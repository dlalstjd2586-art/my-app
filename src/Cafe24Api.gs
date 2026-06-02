/**
 * Cafe24Api.gs
 * ─────────────────────────────────────────────────────────────────────────
 * 카페24 OAuth 토큰 관리 + 정기배송 주문 조회.
 *
 * 토큰 흐름:
 *   - access_token 은 약 2시간, refresh_token 은 약 2주 유효.
 *   - 호출 시 캐시된 access_token 의 만료 여부를 보고 필요하면 refresh.
 *   - 중요: 카페24는 refresh 시 refresh_token 도 새로 회전(rotate)시킨다.
 *           새 refresh_token 을 반드시 다시 저장해야 다음 갱신이 가능하다.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** API 버전 헤더. 카페24 변경 시 이 값만 갱신. */
var CAFE24_API_VERSION = '2024-06-01';

/**
 * 유효한 access token 반환(필요 시 갱신).
 * @return {string}
 */
function cafe24AccessToken_() {
  var p = props_();
  var token = p.getProperty('CAFE24_ACCESS_TOKEN');
  var expiresAt = p.getProperty('CAFE24_ACCESS_TOKEN_EXPIRES_AT');

  // 만료 60초 전이면 갱신.
  var now = Date.now();
  if (token && expiresAt && now < (Date.parse(expiresAt) - 60 * 1000)) {
    return token;
  }
  return cafe24RefreshAccessToken_();
}

/**
 * refresh_token 으로 access_token 재발급. 회전된 refresh_token 도 저장.
 * @return {string} 새 access_token
 */
function cafe24RefreshAccessToken_() {
  var clientId = cfg_('CAFE24_CLIENT_ID', true);
  var clientSecret = cfg_('CAFE24_CLIENT_SECRET', true);
  var refreshToken = cfg_('CAFE24_REFRESH_TOKEN', true);

  var url = cafe24BaseUrl_() + '/api/v2/oauth/token';
  var basic = Utilities.base64Encode(clientId + ':' + clientSecret);

  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    headers: { Authorization: 'Basic ' + basic },
    payload: {
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    },
    muteHttpExceptions: true
  });

  var code = res.getResponseCode();
  var body = res.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('카페24 토큰 갱신 실패 (' + code + '): ' + body +
      '\n→ refresh_token 만료 시 OAuth 재인증이 필요합니다(회원 쓰기 스코프 포함).');
  }

  var data = JSON.parse(body);
  var p = props_();
  p.setProperty('CAFE24_ACCESS_TOKEN', data.access_token);
  // expires_at 이 ISO 문자열로 온다. 없으면 보수적으로 100분 뒤로.
  var exp = data.expires_at || new Date(Date.now() + 100 * 60 * 1000).toISOString();
  p.setProperty('CAFE24_ACCESS_TOKEN_EXPIRES_AT', exp);
  // 회전된 refresh_token 저장(핵심).
  if (data.refresh_token) {
    p.setProperty('CAFE24_REFRESH_TOKEN', data.refresh_token);
  }
  return data.access_token;
}

/**
 * 카페24 Admin API GET 호출(JSON).
 * @param {string} path '/api/v2/admin/...'
 * @param {Object=} query 쿼리 파라미터 객체
 * @return {Object} 파싱된 응답
 */
function cafe24Get_(path, query) {
  var qs = '';
  if (query) {
    var parts = [];
    Object.keys(query).forEach(function (k) {
      if (query[k] === undefined || query[k] === null) return;
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(query[k]));
    });
    if (parts.length) qs = '?' + parts.join('&');
  }
  var url = cafe24BaseUrl_() + path + qs;

  var res = UrlFetchApp.fetch(url, {
    method: 'get',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + cafe24AccessToken_(),
      'X-Cafe24-Api-Version': CAFE24_API_VERSION
    },
    muteHttpExceptions: true
  });

  var code = res.getResponseCode();
  var body = res.getContentText();

  // access token 만료(401)면 1회 강제 갱신 후 재시도.
  if (code === 401) {
    cafe24RefreshAccessToken_();
    res = UrlFetchApp.fetch(url, {
      method: 'get',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + cafe24AccessToken_(),
        'X-Cafe24-Api-Version': CAFE24_API_VERSION
      },
      muteHttpExceptions: true
    });
    code = res.getResponseCode();
    body = res.getContentText();
  }

  if (code < 200 || code >= 300) {
    throw new Error('카페24 GET 실패 ' + path + ' (' + code + '): ' + body);
  }
  return JSON.parse(body);
}

/**
 * 최근 LOOKBACK_DAYS 일치 주문을 페이지네이션하며 모두 가져온다.
 * 정기배송/회차 식별은 별도 필터 함수(isSubscriptionOrder_)로 처리.
 *
 * @return {Array<Object>} 주문 배열(items 포함)
 */
function fetchRecentOrders_() {
  var lookback = cfgInt_('LOOKBACK_DAYS', 3);
  var tz = Session.getScriptTimeZone();
  var end = new Date();
  var start = new Date(end.getTime() - lookback * 24 * 60 * 60 * 1000);

  var startStr = Utilities.formatDate(start, tz, 'yyyy-MM-dd');
  var endStr = Utilities.formatDate(end, tz, 'yyyy-MM-dd');

  var all = [];
  var limit = 500;
  var offset = 0;

  while (true) {
    var data = cafe24Get_('/api/v2/admin/orders', {
      start_date: startStr,
      end_date: endStr,
      date_type: 'pay_date',   // 결제일 기준
      embed: 'items',          // 주문 상품 정보 함께
      limit: limit,
      offset: offset
    });
    var orders = (data && data.orders) || [];
    all = all.concat(orders);
    if (orders.length < limit) break;
    offset += limit;
    if (offset > 10000) break; // 안전 한도
  }
  return all;
}
