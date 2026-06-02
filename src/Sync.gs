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

    // 회차(last_cycle): 카페24 주문에는 회차 숫자가 없으므로 직접 카운트한다.
    // 같은 주문(주문번호 동일)을 다시 읽으면 증가하지 않고, "새 주문"일 때만 +1.
    var thisOrderId = extractOrderId_(order);
    var prevCycle = existing ? (parseInt(existing.record.last_cycle, 10) || 0) : 0;
    var prevOrderId = existing ? String(existing.record.last_order_id || '') : '';
    var cycle = (thisOrderId && thisOrderId !== prevOrderId)
      ? prevCycle + 1
      : (prevCycle || 1);

    upsertLedgerRecord_(ledger, {
      member_id: memberId,
      last_order_id: thisOrderId,
      last_payment_date: toIsoDate_(payDate),
      last_cycle: cycle,
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
 * 카페24 실제 응답(테스트 주문 20260602-0000862) 기준으로 확정:
 *   - 정기결제 표식: 주문/상품 모두 subscription === "T" ("정기배송 N회차" 텍스트는 없음)
 *   - 상품번호: items[].product_no (예: 1736 "정기결제 테스트")
 *   - 회원: member_id (소셜로그인 시 "...@n" 형태도 그대로 키로 사용)
 *   - 결제일: payment_date (ISO8601, 예 "2026-06-02T16:05:57+09:00")
 * ───────────────────────────────────────────────────────────────────────── */

/** 강의구독 정기결제 주문인지 판정. */
function isSubscriptionOrder_(order) {
  var productNo = String(cfg_('SUBSCRIPTION_PRODUCT_NO', true));
  var items = (order && order.items) || [];

  // 강의구독 상품 항목이 정기결제(subscription="T")로 담긴 주문.
  var hasSubscribedItem = items.some(function (it) {
    return String(it.product_no) === productNo && isTrueFlag_(it.subscription);
  });
  if (hasSubscribedItem) return true;

  // 일부(목록) 응답은 항목 레벨 표식이 없을 수 있어 주문 레벨로 보강.
  var hasProduct = items.some(function (it) {
    return String(it.product_no) === productNo;
  });
  return hasProduct && isTrueFlag_(order && order.subscription);
}

/** 카페24 'T'/'F' 플래그 → boolean. */
function isTrueFlag_(v) {
  return String(v).toUpperCase() === 'T';
}

/**
 * (참고용) 카페24 주문 상세 응답에는 회차 숫자 필드가 존재하지 않는다.
 * 실제 회차(last_cycle)는 syncSubscriptions_ 에서 "새 주문이 들어올 때마다 +1"
 * 방식으로 직접 카운트한다. 절대 회차가 필요하면 카페24 정기결제 전용 API 연동 필요.
 */
function extractCycle_(order) {
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
