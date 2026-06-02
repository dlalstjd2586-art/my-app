/**
 * OAuth.gs
 * ─────────────────────────────────────────────────────────────────────────
 * 카페24 최초 토큰 발급(인가코드 → access/refresh 토큰).
 * 비개발자도 "URL 열고 승인" 두 번의 클릭으로 끝나도록 구성.
 *
 * 사전 준비(README/안내 참고):
 *   1) 이 스크립트를 "웹 앱"으로 배포해 /exec URL 을 얻는다.
 *   2) 그 URL 을 스크립트 속성 CAFE24_REDIRECT_URI 에 넣는다.
 *   3) 같은 URL 을 카페24 개발자센터 앱의 "Redirect URI" 에도 등록한다.
 *
 * 사용:
 *   - getCafe24AuthUrl() 실행 → 로그에 뜬 URL 을 브라우저에서 열고 카페24 승인.
 *   - 승인하면 카페24가 /exec?code=... 로 되돌려 보내고, doGet 이 자동으로
 *     인가코드를 토큰으로 교환해 CAFE24_REFRESH_TOKEN 등을 저장한다.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** 인가 URL 생성(로그 출력). 브라우저에서 열어 승인. */
function getCafe24AuthUrl() {
  var clientId = cfg_('CAFE24_CLIENT_ID', true);
  var redirect = cfg_('CAFE24_REDIRECT_URI', true);
  var scopes = cfg_('CAFE24_SCOPES') || 'mall.read_order';

  var state = Utilities.getUuid();
  props_().setProperty('CAFE24_OAUTH_STATE', state);

  var url = cafe24BaseUrl_() + '/api/v2/oauth/authorize'
    + '?response_type=code'
    + '&client_id=' + encodeURIComponent(clientId)
    + '&state=' + encodeURIComponent(state)
    + '&redirect_uri=' + encodeURIComponent(redirect)
    + '&scope=' + encodeURIComponent(scopes);

  console.log('▼ 아래 URL 전체를 복사해 브라우저 새 탭에서 열고, 카페24 로그인 후 "승인"하세요:\n\n' + url + '\n');
  return url;
}

/**
 * OAuth 콜백 처리(doGet 에서 code 파라미터가 있을 때 호출).
 * 인가코드를 토큰으로 교환 후 저장하고, 성공/실패 안내 페이지 반환.
 */
function handleOAuthCallback_(params) {
  try {
    var savedState = props_().getProperty('CAFE24_OAUTH_STATE');
    if (!params.state || params.state !== savedState) {
      return htmlPage_('인증 실패', 'state 값이 일치하지 않습니다. getCafe24AuthUrl() 부터 다시 실행하세요.');
    }
    cafe24ExchangeCode_(params.code);
    return htmlPage_('인증 완료 ✅',
      'refresh token 이 저장되었습니다. 이 창은 닫아도 됩니다.<br>' +
      'Apps Script 로 돌아가 <b>debugDumpTestOrder</b> 를 실행해 보세요.');
  } catch (err) {
    return htmlPage_('인증 실패', String(err && err.message || err));
  }
}

/** 인가코드 → 토큰 교환 후 저장. */
function cafe24ExchangeCode_(code) {
  if (!code) throw new Error('인가코드(code)가 없습니다.');

  var clientId = cfg_('CAFE24_CLIENT_ID', true);
  var clientSecret = cfg_('CAFE24_CLIENT_SECRET', true);
  var redirect = cfg_('CAFE24_REDIRECT_URI', true);
  var basic = Utilities.base64Encode(clientId + ':' + clientSecret);

  var res = UrlFetchApp.fetch(cafe24BaseUrl_() + '/api/v2/oauth/token', {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    headers: { Authorization: 'Basic ' + basic },
    payload: {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirect
    },
    muteHttpExceptions: true
  });

  var status = res.getResponseCode();
  var body = res.getContentText();
  if (status < 200 || status >= 300) {
    throw new Error('토큰 교환 실패 (' + status + '): ' + body);
  }

  var data = JSON.parse(body);
  var p = props_();
  if (data.access_token) p.setProperty('CAFE24_ACCESS_TOKEN', data.access_token);
  if (data.refresh_token) p.setProperty('CAFE24_REFRESH_TOKEN', data.refresh_token);
  p.setProperty('CAFE24_ACCESS_TOKEN_EXPIRES_AT',
    data.expires_at || new Date(Date.now() + 100 * 60 * 1000).toISOString());
  return data;
}

/** 간단한 HTML 안내 페이지. */
function htmlPage_(title, message) {
  var html = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<style>body{font-family:sans-serif;padding:40px;line-height:1.6;}' +
    'h2{margin-bottom:16px;}</style></head><body>' +
    '<h2>' + title + '</h2><p>' + message + '</p></body></html>';
  return HtmlService.createHtmlOutput(html);
}
