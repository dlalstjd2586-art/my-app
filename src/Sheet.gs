/**
 * Sheet.gs
 * ─────────────────────────────────────────────────────────────────────────
 * 구글시트 장부 입출력. 이 스크립트는 컨테이너 바운드(시트에 종속) 또는
 * 독립형 모두 동작하도록 SpreadsheetApp.getActive() 를 우선 사용한다.
 * 독립형이면 Setup.gs 에서 시트를 생성/연결한다.
 * ─────────────────────────────────────────────────────────────────────────
 */

/** 활성 스프레드시트 핸들. 없으면 명확한 안내 예외. */
function spreadsheet_() {
  // 1) 속성에 장부 스프레드시트 ID가 지정돼 있으면 그것을 연다(독립형 스크립트용).
  var id = cfg_('LEDGER_SHEET_ID');
  if (id) {
    return SpreadsheetApp.openById(id);
  }
  // 2) 시트에 바운드된 스크립트면 활성 스프레드시트 사용.
  var ss = SpreadsheetApp.getActive();
  if (ss) return ss;

  throw new Error('장부 스프레드시트가 없습니다. Setup.gs 의 setupCreateSpreadsheet() 를 1회 실행하세요.');
}

/** 시트 가져오기(없으면 생성 + 헤더 기록). */
function getOrCreateSheet_(name, headers) {
  var ss = spreadsheet_();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
  }
  if (headers && sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function ledgerSheet_() { return getOrCreateSheet_(SHEET_NAMES.LEDGER, LEDGER_HEADERS); }
function logSheet_() { return getOrCreateSheet_(SHEET_NAMES.LOG, LOG_HEADERS); }

/**
 * 장부 전체를 member_id → {row, record} 맵으로 로드.
 * @return {{map: Object, sheet: Sheet}}
 */
function loadLedger_() {
  var sh = ledgerSheet_();
  var last = sh.getLastRow();
  var map = {};
  if (last < 2) return { map: map, sheet: sh };

  var values = sh.getRange(2, 1, last - 1, LEDGER_HEADERS.length).getValues();
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var memberId = String(row[0]).trim();
    if (!memberId) continue;
    map[memberId] = {
      rowIndex: i + 2, // 실제 시트 행 번호
      record: {
        member_id: memberId,
        last_order_id: row[1],
        last_payment_date: row[2],
        last_cycle: row[3],
        expiry_date: row[4],
        switch: row[5],
        updated_at: row[6]
      }
    };
  }
  return { map: map, sheet: sh };
}

/** 한 회원의 record 를 장부에 기록(있으면 갱신, 없으면 추가). */
function upsertLedgerRecord_(ledger, record) {
  var sh = ledger.sheet;
  var rowValues = [
    record.member_id,
    record.last_order_id || '',
    record.last_payment_date || '',
    record.last_cycle || '',
    record.expiry_date || '',
    record.switch || '',
    record.updated_at || ''
  ];
  var existing = ledger.map[record.member_id];
  if (existing) {
    sh.getRange(existing.rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    existing.record = record;
  } else {
    sh.appendRow(rowValues);
    // 새 행 인덱스는 다음 로드 때 반영(여기선 맵만 갱신).
    ledger.map[record.member_id] = { rowIndex: sh.getLastRow(), record: record };
  }
}

/** 단일 회원 구독상태 조회(웹앱 엔드포인트용). 없으면 null. */
function getLedgerRecord_(memberId) {
  var ledger = loadLedger_();
  var hit = ledger.map[String(memberId).trim()];
  return hit ? hit.record : null;
}
