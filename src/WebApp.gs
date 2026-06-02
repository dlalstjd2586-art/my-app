/**
 * WebApp.gs
 * ─────────────────────────────────────────────────────────────────────────
 * 강의실 페이지(카페24 스킨)가 호출하는 구독상태 조회 엔드포인트.
 * 명세서 B항목 백업 방식: "구글시트 + 조회 엔드포인트(본인확인 토큰)".
 *
 * 보안: member_id 만으로 임의 조회되면 안 되므로 HMAC 본인확인 토큰을 요구한다.
 *   token = base64url( HMAC_SHA256(member_id, LOOKUP_TOKEN_SECRET) )
 *
 * ⚠️ 서버단 검증 원칙(명세서): 강의실 스킨은 이 엔드포인트의 active 값을 보고
 *    "서버에서" 비메오 임베드를 렌더 여부 결정해야 한다. JS로 숨기는 방식은 우회 가능.
 *    토큰은 회원별로 스킨 서버단에서 주입한다(평문 시크릿을 클라이언트에 노출 금지).
 *
 * 호출 예:
 *   GET https://script.google.com/.../exec?member_id=abc&token=XXXX
 *   (선택) &callback=fn  → JSONP 응답
 * ─────────────────────────────────────────────────────────────────────────
 */

function doGet(e) {
  var params = (e && e.parameter) || {};
  var memberId = (params.member_id || '').trim();
  var token = (params.token || '').trim();
  var callback = (params.callback || '').trim();

  var payload;
  if (!memberId || !token) {
    payload = { ok: false, error: 'member_id 와 token 이 필요합니다.' };
  } else if (!verifyLookupToken_(memberId, token)) {
    payload = { ok: false, error: '토큰 검증 실패' };
  } else {
    var rec = getLedgerRecord_(memberId);
    var active = !!(rec && rec.switch === 'ON');
    payload = {
      ok: true,
      member_id: memberId,
      active: active,                       // 강의실은 이 값으로 노출/차단 결정
      expiry_date: rec ? rec.expiry_date : null,
      switch: rec ? rec.switch : 'OFF',
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
