/**
 * Monitoring.gs
 * ─────────────────────────────────────────────────────────────────────────
 * 안전장치: 매일 실행 결과 로그 + 미실행/오류 알림(명세서 A항목).
 * ─────────────────────────────────────────────────────────────────────────
 */

/** 실행 1건 로그 기록. */
function recordRun_(status, processed, message) {
  try {
    var sh = logSheet_();
    sh.appendRow([new Date().toISOString(), status, processed, message]);
  } catch (e) {
    // 로깅 실패가 본작업을 막지 않도록 삼킴(Stackdriver 에는 남음).
    console.error('로그 기록 실패: ' + e);
  }
}

/** 관리자 메일 알림. ADMIN_EMAIL 미설정이면 조용히 통과. */
function notifyAdmin_(subject, body) {
  var email = cfg_('ADMIN_EMAIL');
  if (!email) return;
  try {
    MailApp.sendEmail(email, subject, body);
  } catch (e) {
    console.error('알림 메일 발송 실패: ' + e);
  }
}

/**
 * 미실행 감시(워치독). 별도의 시간 트리거로 매일 늦게 1회 실행해,
 * 오늘자 OK 로그가 없으면 알림.
 */
function watchdogCheckTodayRun() {
  var sh = logSheet_();
  var last = sh.getLastRow();
  var tz = Session.getScriptTimeZone();
  var today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');

  var ranToday = false;
  if (last >= 2) {
    var start = Math.max(2, last - 50); // 최근 일부만 검사
    var rows = sh.getRange(start, 1, last - start + 1, LOG_HEADERS.length).getValues();
    for (var i = 0; i < rows.length; i++) {
      var ts = String(rows[i][0]);
      var status = String(rows[i][1]);
      if (ts.indexOf(today) === 0 && status === LOG_STATUS_OK) {
        ranToday = true;
        break;
      }
    }
  }
  if (!ranToday) {
    notifyAdmin_('[구독동기화 미실행 경고] ' + today,
      '오늘자 정상(OK) 실행 로그가 없습니다. dailySync 트리거/오류를 점검하세요.');
  }
}
