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
 * 2) 시트(장부/로그) 생성 + 헤더.
 *    독립형 스크립트라면 먼저 시트를 만들고 이 스크립트를 컨테이너 바운드로 연결하거나,
 *    이 함수를 컨테이너 바운드 환경에서 실행한다.
 */
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

/** 한 번에: 속성 초기화 → 시트 → 트리거. */
function setup() {
  initProperties();
  setupSheets();
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
