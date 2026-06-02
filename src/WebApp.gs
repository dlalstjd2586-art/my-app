/**
 * WebApp.gs
 * ─────────────────────────────────────────────────────────────────────────
 * 강의실 페이지(카페24 스킨)가 호출하는 구독상태 조회 엔드포인트.
 *
 * 게이팅 방식(선택됨): "비메오 도메인제한 + 엔드포인트".
 *   - 강의실 스킨이 로그인 회원ID로 이 엔드포인트에 구독상태를 물어보고,
 *     active=true 일 때만 비메오 임베드를 노출한다.
 *   - 영상 자체는 비메오 "도메인 제한"(내 사이트에서만 재생)으로 1차 보호한다.
 *
 * 토큰(본인확인)은 선택사항이다:
 *   - LOOKUP_TOKEN_SECRET 설정 + token 파라미터가 오면 검증한다(더 안전한 모드).
 *   - token 이 없으면 member_id 만으로 상태를 반환한다(스킨 간편 연동 모드).
 *     반환값은 active(boolean)뿐이며 영상 ID는 스킨이 보유한다.
 *
 * 호출 예:
 *   GET https://script.google.com/.../exec?member_id=abc
 *   GET https://script.google.com/.../exec?member_id=abc&token=XXXX
 *   (선택) &callback=fn  → JSONP 응답(크로스도메인 회피)
 * ─────────────────────────────────────────────────────────────────────────
 */

function doGet(e) {
  var params = (e && e.parameter) || {};

  // 카페24 OAuth 콜백(인가코드 수신) 처리 → 토큰 저장. (OAuth.gs)
  if (params.code) {
    return handleOAuthCallback_(params);
  }

  var memberId = (params.member_id || '').trim();
  var token = (params.token || '').trim();
  var callback = (params.callback || '').trim();

  var payload;
  if (!memberId) {
    payload = { ok: false, error: 'member_id 가 필요합니다.' };
  } else if (token && !verifyLookupToken_(memberId, token)) {
    // 토큰을 보냈는데 틀리면 거부(더 안전한 모드에서만 동작).
    payload = { ok: false, error: '토큰 검증 실패' };
  } else {
    var rec = getLedgerRecord_(memberId);
    var active = !!(rec && rec.switch === SWITCH_ON);
    payload = {
      ok: true,
      member_id: memberId,
      active: active,                       // 강의실은 이 값으로 노출/차단 결정
      expiry_date: rec ? rec.expiry_date : null,
      switch: rec ? rec.switch : SWITCH_OFF,
      checked_at: new Date().toISOString()
    };
  }

  return jsonResponse_(payload, callback);
}

/** HMAC 본인확인 토큰 생성(관리/스킨 주입용). */
function makeLookupToken_(memberId) {
  var secret = cfg_('LOOKUP_TOKEN_SECRET', true);
  var raw = Utilities.computeHmacSha256Signature(String(memberId), secret);
  return base64Url_(raw);
}

/** 토큰 검증(타이밍 안전 비교). */
function verifyLookupToken_(memberId, token) {
  var expected = makeLookupToken_(memberId);
  return constantTimeEquals_(expected, token);
}

function base64Url_(bytes) {
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '');
}

function constantTimeEquals_(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** JSON 또는 JSONP 응답. */
function jsonResponse_(obj, callback) {
  var json = JSON.stringify(obj);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
