/**
 * Config.gs
 * ─────────────────────────────────────────────────────────────────────────
 * 모든 설정값/시크릿은 코드에 하드코딩하지 않고 스크립트 속성(Script Properties)에 보관한다.
 * 최초 1회 Setup.gs 의 initProperties() 를 실행해 키를 만든 뒤, Apps Script 편집기
 * "프로젝트 설정 > 스크립트 속성"에서 실제 값을 채운다.
 *
 * 핸드오프 시 채워야 할 값 (명세서 "클로드 코드 핸드오프 시 가져갈 값"):
 *   - CAFE24_MALL_ID           : 카페24 몰 아이디 (예: myshop  →  myshop.cafe24api.com)
 *   - CAFE24_CLIENT_ID         : 카페24 앱 Client ID
 *   - CAFE24_CLIENT_SECRET     : 카페24 앱 Client Secret
 *   - CAFE24_REFRESH_TOKEN     : 회원 쓰기 스코프 포함 재인증으로 발급받은 refresh token
 *   - SUBSCRIPTION_PRODUCT_NO  : 강의구독 정기배송 상품의 상품번호
 *   - CYCLE_UNIT / CYCLE_VALUE : 정기배송 주기 (테스트=day 7 등 / 실제=year 1 등)
 *   - LOOKUP_TOKEN_SECRET      : 강의실 조회 엔드포인트 본인확인 토큰용 HMAC 시크릿
 *   - ADMIN_EMAIL              : 미실행/오류 알림 수신 메일
 * ─────────────────────────────────────────────────────────────────────────
 */

/** 스크립트 속성에서 정의해 사용하는 키 목록과 기본값. */
var CONFIG_KEYS = {
  CAFE24_MALL_ID: '',
  CAFE24_CLIENT_ID: '',
  CAFE24_CLIENT_SECRET: '',
  CAFE24_REFRESH_TOKEN: '',
  // 아래 두 개는 런타임 캐시(자동 갱신). 수동으로 넣지 않는다.
  CAFE24_ACCESS_TOKEN: '',
  CAFE24_ACCESS_TOKEN_EXPIRES_AT: '',

  SUBSCRIPTION_PRODUCT_NO: '',
  CYCLE_UNIT: 'year',   // 'day' | 'month' | 'year'
  CYCLE_VALUE: '1',     // 문자열로 저장(속성은 문자열). 정수로 파싱해 사용.

  // 정기배송 주문을 매일 조회할 때 거슬러 올라가 살펴볼 일수(중복 누락 방지용 여유분).
  LOOKBACK_DAYS: '3',

  // 만료일 경과 후에도 며칠 여유를 줄지(결제 지연 대비 유예). 0 = 유예 없음.
  GRACE_DAYS: '0',

  LOOKUP_TOKEN_SECRET: '',
  ADMIN_EMAIL: ''
};

/** 시트 이름(같은 스프레드시트 안의 탭). */
var SHEET_NAMES = {
  LEDGER: '구독장부',   // 회원별 구독 만료일/스위치 장부
  LOG: '실행로그'        // 매일 실행 결과 로그
};

/** 구독장부 시트 헤더(열 순서가 곧 스키마). */
var LEDGER_HEADERS = [
  'member_id',          // A: 카페24 회원 아이디
  'last_order_id',      // B: 마지막으로 반영한 정기배송 주문번호
  'last_payment_date',  // C: 마지막 결제일 (ISO yyyy-MM-dd)
  'last_cycle',         // D: 마지막 회차 번호
  'expiry_date',        // E: 구독 만료일 (ISO yyyy-MM-dd)
  'switch',             // F: 'ON' | 'OFF'
  'updated_at'          // G: 장부 갱신 시각(ISO)
];

var LOG_HEADERS = ['timestamp', 'status', 'processed_count', 'message'];

/** 속성 저장소 핸들. */
function props_() {
  return PropertiesService.getScriptProperties();
}

/**
 * 설정값 읽기. 없으면 기본값, 기본값도 없으면 예외.
 * @param {string} key CONFIG_KEYS 의 키
 * @param {boolean=} required true면 비어 있을 때 예외
 */
function cfg_(key, required) {
  var p = props_();
  var v = p.getProperty(key);
  if (v === null || v === undefined || v === '') {
    v = CONFIG_KEYS.hasOwnProperty(key) ? CONFIG_KEYS[key] : '';
  }
  if (required && (v === '' || v === null || v === undefined)) {
    throw new Error('필수 설정값이 비어 있습니다: ' + key + ' (스크립트 속성에 입력하세요)');
  }
  return v;
}

/** 정수 설정값. */
function cfgInt_(key, fallback) {
  var v = parseInt(cfg_(key), 10);
  return isNaN(v) ? fallback : v;
}

/** 카페24 API 베이스 URL. */
function cafe24BaseUrl_() {
  var mall = cfg_('CAFE24_MALL_ID', true);
  return 'https://' + mall + '.cafe24api.com';
}
