/**
 * Setup.gs
 * ─────────────────────────────────────────────────────────────────────────
 * 최초 설치/설정 도우미. 편집기에서 한 번씩 수동 실행.
 * ─────────────────────────────────────────────────────────────────────────
 */

/**
 * 1) 스크립트 속성 키를 기본값으로 초기화(이미 값이 있으면 보존).
 *    실행 후 "프로젝트 설정 > 스크립트 속성"에서 실제 값을 채운다.
 */
function initProperties() {
  var p = props_();
  var existing = p.getProperties();
  Object.keys(CONFIG_KEYS).forEach(function (k) {
    if (!(k in existing)) {
      p.setProperty(k, String(CONFIG_KEYS[k]));
    }
  });
  console.log('스크립트 속성 초기화 완료. 비어 있는 필수값을 채우세요:\n' +
    JSON.stringify(p.getProperties(), null, 2));
}

/**
 * 2) 장부용 구글시트를 새로 만들고 그 ID를 속성(LEDGER_SHEET_ID)에 저장.
 *    독립형 스크립트에서 1회만 실행하면 된다(이미 있으면 그대로 사용).
 */
function setupCreateSpreadsheet() {
  var existing = cfg_('LEDGER_SHEET_ID');
  if (existing) {
    var ssOld = SpreadsheetApp.openById(existing);
    console.log('이미 장부 시트가 있습니다:\n' + ssOld.getUrl());
    setupSheets();
    return ssOld.getUrl();
  }
  var ss = SpreadsheetApp.create('운동강의 구독장부');
  props_().setProperty('LEDGER_SHEET_ID', ss.getId());
  setupSheets();
  console.log('새 장부 시트를 만들었습니다. 아래 주소에서 확인하세요:\n' + ss.getUrl());
  return ss.getUrl();
}

/** 시트(장부/로그) 탭 + 헤더 준비. */
function setupSheets() {
  ledgerSheet_();
  logSheet_();
  console.log('시트 준비 완료: ' + SHEET_NAMES.LEDGER + ', ' + SHEET_NAMES.LOG);
}

/**
 * 3) 시간 기반 트리거 설치(중복 방지: 기존 동일 핸들러 제거 후 재설치).
 *    - dailySync: 매일 새벽 동기화
 *    - watchdogCheckTodayRun: 매일 밤 미실행 감시
 */
function installTriggers() {
  removeTriggersFor_(['dailySync', 'watchdogCheckTodayRun']);

  ScriptApp.newTrigger('dailySync')
    .timeBased().everyDays(1).atHour(4).create(); // 04시경

  ScriptApp.newTrigger('watchdogCheckTodayRun')
    .timeBased().everyDays(1).atHour(23).create(); // 23시경

  console.log('트리거 설치 완료: dailySync(04시), watchdogCheckTodayRun(23시)');
}

function removeTriggersFor_(handlerNames) {
  var set = {};
  handlerNames.forEach(function (n) { set[n] = true; });
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (set[t.getHandlerFunction()]) {
      ScriptApp.deleteTrigger(t);
    }
  });
}

/** 한 번에: 속성 초기화 → 장부 시트 생성 → 트리거. */
function setup() {
  initProperties();
  setupCreateSpreadsheet();
  installTriggers();
}

/* ─────────────────────────────────────────────────────────────────────────
 * 디버그/운영 보조 함수.
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * 테스트 주문 1건의 원본 JSON 을 로그로 덤프.
 * 회차 태그가 어느 필드에 들어오는지 확인용(예: '20260602-0000862').
 */
function debugDumpOrder(orderId) {
  var data = cafe24Get_('/api/v2/admin/orders/' + encodeURIComponent(orderId), {
    embed: 'items'
  });
  console.log(JSON.stringify(data, null, 2));
  return data;
}

/**
 * 클릭 한 번으로 실행하는 테스트 주문 덤프(드롭다운에서 골라 실행).
 * 명세서 참고 테스트 주문 20260602-0000862 의 회차 태그 구조 확인용.
 * 다른 주문을 보고 싶으면 아래 문자열만 바꾼다.
 */
function debugDumpTestOrder() {
  return debugDumpOrder('20260602-0000862');
}

/**
 * 테스트 주문에서 동기화에 필요한 핵심 정보만 골라 출력.
 * - 회원/결제일/상품번호 같은 키 필드
 * - "정기배송 N회차" 또는 회차/구독 관련 표식이 들어있는 모든 칸(경로 포함)
 * 출력이 짧아 복사·확인이 쉽다.
 */
function debugAnalyzeTestOrder() {
  return debugAnalyzeOrder('20260602-0000862');
}

function debugAnalyzeOrder(orderId) {
  var data = cafe24Get_('/api/v2/admin/orders/' + encodeURIComponent(orderId), {
    embed: 'items'
  });
  var order = (data && data.order) || data;

  var lines = [];
  lines.push('=== 핵심 필드 ===');
  ['order_id', 'member_id', 'buyer_id', 'payment_date', 'order_date',
   'order_place_name', 'order_place_id', 'market_id'].forEach(function (k) {
    if (order && order[k] !== undefined) lines.push(k + ' = ' + JSON.stringify(order[k]));
  });

  var items = (order && order.items) || [];
  lines.push('\n=== items (' + items.length + '건) ===');
  items.forEach(function (it, i) {
    lines.push('[' + i + '] product_no=' + JSON.stringify(it.product_no) +
      ', product_name=' + JSON.stringify(it.product_name));
  });

  lines.push('\n=== 정기배송/회차 표식 후보 (경로: 값) ===');
  var hits = [];
  scanForSubscription_(order, '', hits);
  if (hits.length === 0) {
    lines.push('(이 주문 응답 안에서는 "정기배송/회차/subscription" 문자열을 못 찾음)');
  } else {
    hits.forEach(function (h) { lines.push(h); });
  }

  console.log(lines.join('\n'));
  return hits;
}

/** 객체를 재귀 순회하며 정기배송/회차/구독 관련 값을 경로와 함께 수집. */
function scanForSubscription_(node, path, hits) {
  if (node === null || node === undefined) return;
  if (typeof node === 'object') {
    var isArr = Object.prototype.toString.call(node) === '[object Array]';
    Object.keys(node).forEach(function (k) {
      var childPath = path + (isArr ? '[' + k + ']' : (path ? '.' : '') + k);
      // 키 이름 자체가 단서면 값 출력
      if (/subscript|recur|정기|회차|cycle/i.test(k)) {
        hits.push(childPath + ' = ' + JSON.stringify(node[k]));
      }
      scanForSubscription_(node[k], childPath, hits);
    });
  } else {
    var s = String(node);
    if (/정기배송|회차|subscription|정기결제|recurring/i.test(s)) {
      hits.push(path + ' = ' + JSON.stringify(node));
    }
  }
}

/** 토큰 1개 생성(스킨 주입값 확인용). */
function debugMakeToken(memberId) {
  var t = makeLookupToken_(memberId);
  console.log('member_id=' + memberId + '\ntoken=' + t);
  return t;
}

/** 동기화 1회 수동 실행(트리거 없이 점검용). */
function runOnce() {
  dailySync();
}
