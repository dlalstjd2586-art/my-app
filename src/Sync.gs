/**
 * Sync.gs  — 코어 로직
 * ─────────────────────────────────────────────────────────────────────────
 * 명세서 A항목 의사코드 구현:
 *
 *   매일 실행:
 *     주문 = 카페24주문조회(상품번호=강의구독, 정기배송 회차 태그, 최근분)
 *     for 각 정기배송주문:
 *        회원 = 주문.회원ID
 *        시트.만료일[회원] = 주문.결제일 + 결제주기
 *     for 각 회원 in 시트:
 *        if 오늘 <= 만료일:  스위치(회원) = ON
 *        else:              스위치(회원) = OFF
 *     알림.기록("정상, 처리 N명")
 *
 * 핵심 원칙: 회원당 만료일 1개만 관리. "회차 주문 안 옴 = 만료" 로 해지·결제실패 일괄 처리.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** 매일 트리거가 호출하는 진입점. */
function dailySync() {
  var startedAt = new Date();
  try {
    var processed = syncSubscriptions_();
    recordRun_('OK', processed, '정상 동작, 처리 ' + processed + '명');
  } catch (err) {
    recordRun_('ERROR', 0, String(err && err.stack || err));
    notifyAdmin_('[구독동기화 실패] ' + new Date().toISOString(),
      '오류: ' + (err && err.stack || err));
    throw err; // 실행 로그(Stackdriver)에도 남도록 재throw
  }
}

/**
 * 실제 동기화. 처리(만료일 갱신/스위치 평가)한 회원 수 반환.
 * @return {number}
 */
function syncSubscriptions_() {
  var ledger = loadLedger_();
  var orders = fetchRecentOrders_();

  // 1) 정기배송 강의구독 주문만 골라 회원별 만료일 갱신.
  var touched = {};
  for (var i = 0; i < orders.length; i++) {
    var order = orders[i];
    if (!isSubscriptionOrder_(order)) continue;

    var memberId = extractMemberId_(order);
    if (!memberId) continue;

    var payDate = extractPaymentDate_(order);
    if (!payDate) continue;

    var newExpiry = addCycle_(payDate, cfg_('CYCLE_UNIT'), cfgInt_('CYCLE_VALUE', 1));

    var existing = ledger.map[memberId];
    var prevExpiryStr = existing && existing.record.expiry_date;
    var prevExpiry = prevExpiryStr ? parseDate_(prevExpiryStr) : null;

    // 더 늦은 만료일만 채택(중복/순서 뒤섞임 방지). 갱신은 곧 연장이므로.
    var finalExpiry = (prevExpiry && prevExpiry.getTime() >= newExpiry.getTime())
      ? prevExpiry : newExpiry;

    upsertLedgerRecord_(ledger, {
      member_id: memberId,
      last_order_id: extractOrderId_(order),
      last_payment_date: toIsoDate_(payDate),
      last_cycle: extractCycle_(order),
      expiry_date: toIsoDate_(finalExpiry),
      switch: '', // 2)에서 일괄 평가
      updated_at: new Date().toISOString()
    });
    touched[memberId] = true;
  }

  // 2) 장부 전체 회원의 스위치 ON/OFF 평가(만료 경과 = OFF).
  var grace = cfgInt_('GRACE_DAYS', 0);
  var today = startOfDay_(new Date());
  var count = 0;

  Object.keys(ledger.map).forEach(function (memberId) {
    var rec = ledger.map[memberId].record;
    var expiry = rec.expiry_date ? parseDate_(rec.expiry_date) : null;
    var on = false;
    if (expiry) {
      var cutoff = new Date(expiry.getTime() + grace * 24 * 60 * 60 * 1000);
      on = today.getTime() <= startOfDay_(cutoff).getTime();
    }
    var newSwitch = on ? 'ON' : 'OFF';
    if (rec.switch !== newSwitch) {
      rec.switch = newSwitch;
      rec.updated_at = new Date().toISOString();
      upsertLedgerRecord_(ledger, rec);
    }
    count++;
  });

  return count;
}

/* ─────────────────────────────────────────────────────────────────────────
 * 주문 파싱 헬퍼.
 *
 * ⚠️ 아래 함수들은 카페24 정기배송 주문의 실제 JSON 구조에 맞춰 확정해야 한다.
 *    테스트 주문 20260602-0000862 를 debugDumpOrder('20260602-0000862') 로 덤프해
 *    "정기배송 N회차" 태그가 어느 필드에 들어오는지 확인 후 셀렉터를 고정할 것.
 * ───────────────────────────────────────────────────────────────────────── */

/** 강의구독 정기배송 주문인지 판정. */
function isSubscriptionOrder_(order) {
  var productNo = cfg_('SUBSCRIPTION_PRODUCT_NO', true);
  var items = (order && order.items) || [];

  var hasProduct = items.some(function (it) {
    return String(it.product_no) === String(productNo);
  });
  if (!hasProduct) return false;

  // 정기배송 회차 표식 확인. 카페24 응답 구조 확정 후 정밀화.
  // 후보: order.subscription, order.market_id, item.additional_option, 주문 메모/태그 등.
  return hasSubscriptionMarker_(order);
}

/**
 * 정기배송/회차 표식 존재 여부.
 * TODO(핸드오프): 테스트 주문 덤프로 실제 필드 확인 후 정밀화.
 * 현재는 보수적으로 "회차 정보를 추출할 수 있으면 정기배송"으로 간주.
 */
function hasSubscriptionMarker_(order) {
  return extractCycle_(order) !== '';
}

/** "정기배송 N회차"에서 N(회차) 추출. 없으면 ''. */
function extractCycle_(order) {
  // 흔히 주문/배송 메모 또는 별도 구독 필드에 "정기배송 N회차" 문자열이 들어온다.
  var candidates = [
    order && order.additional_order_info,
    order && order.order_memo,
    order && order.subscription && order.subscription.cycle,
    order && order.market_order_no
  ];
  for (var i = 0; i < candidates.length; i++) {
    var v = candidates[i];
    if (v === undefined || v === null) continue;
    if (typeof v === 'number') return String(v);
    var m = String(v).match(/정기배송\s*(\d+)\s*회차/);
    if (m) return m[1];
  }
  return '';
}

function extractMemberId_(order) {
  return order && (order.member_id || order.buyer_id) ?
    String(order.member_id || order.buyer_id).trim() : '';
}

function extractOrderId_(order) {
  return order && (order.order_id || order.order_no) ?
    String(order.order_id || order.order_no) : '';
}

/** 결제일(Date). pay_date 우선, 없으면 order_date. */
function extractPaymentDate_(order) {
  var raw = (order && (order.payment_date || order.pay_date || order.order_date)) || '';
  return raw ? parseDate_(String(raw)) : null;
}

/* ─────────────────────────────────────────────────────────────────────────
 * 날짜 유틸.
 * ───────────────────────────────────────────────────────────────────────── */

function addCycle_(date, unit, value) {
  var d = new Date(date.getTime());
  switch (String(unit)) {
    case 'day': d.setDate(d.getDate() + value); break;
    case 'month': d.setMonth(d.getMonth() + value); break;
    case 'year': d.setFullYear(d.getFullYear() + value); break;
    default: d.setFullYear(d.getFullYear() + value); break;
  }
  return d;
}

/** ISO/일반 날짜 문자열 → Date. yyyy-MM-dd 또는 ISO 모두 허용. */
function parseDate_(s) {
  var str = String(s).trim();
  // "yyyy-MM-dd HH:mm:ss" 형태를 안전 파싱
  var m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
  }
  var t = Date.parse(str);
  return isNaN(t) ? null : new Date(t);
}

function toIsoDate_(date) {
  var tz = Session.getScriptTimeZone();
  return Utilities.formatDate(date, tz, 'yyyy-MM-dd');
}

function startOfDay_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
