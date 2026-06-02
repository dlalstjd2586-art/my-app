# 운동강의 구독 시스템 — GAS 동기화 코어

명세서 v2 **A항목(구독상태 동기화)** 의 Google Apps Script 스캐폴드.

카페24 정기배송(자동갱신 결제) 주문을 매일 읽어 **회원별 구독 만료일(스위치)** 을
구글시트 장부에 갱신하고, 강의실 페이지가 조회할 수 있는 **본인확인 토큰 기반
조회 엔드포인트**(doGet)를 제공한다. 회원등급(학년 로열티)은 건드리지 않는다.

> 스위치 저장 방식: **구글시트 장부 + 조회 엔드포인트** (명세서 백업 방식 채택)

## 데이터 흐름

```
정기배송 결제 → "정기배송 N회차" 주문 생성
  → dailySync: 주문 읽고 회원 만료일 = 결제일 + 주기 → 스위치 ON
매 갱신 → 새 회차 주문 → 만료일 연장(스위치 유지)
해지/결제실패 → 새 회차 안 옴 → 만료일 경과 → 스위치 OFF(차단)

강의실 페이지 → doGet(member_id, token) → { active: true/false }
  → 서버단에서 active=true 일 때만 비메오 임베드 렌더
```

## 파일 구성

| 파일 | 역할 |
|------|------|
| `appsscript.json` | 매니페스트(시간대 Asia/Seoul, 웹앱 설정) |
| `src/Config.gs` | 설정/시크릿(스크립트 속성) + 시트 스키마 |
| `src/Cafe24Api.gs` | OAuth 토큰 갱신(refresh 회전 포함) + 주문 조회 |
| `src/Sheet.gs` | 구글시트 장부 입출력 |
| `src/Sync.gs` | 코어: 만료일 갱신 + 스위치 ON/OFF 평가 |
| `src/WebApp.gs` | 강의실 조회 엔드포인트(doGet, HMAC 토큰) |
| `src/Monitoring.gs` | 실행 로그 + 미실행/오류 알림 |
| `src/Setup.gs` | 설치 도우미 + 디버그 함수 |

## 설치 순서

1. 새 구글시트를 만들고 **확장 프로그램 > Apps Script** 로 컨테이너 바운드
   스크립트를 연다(또는 clasp 로 배포 — 아래 참고).
2. `src/*.gs` 와 `appsscript.json` 내용을 프로젝트에 넣는다.
3. 편집기에서 **`setup()`** 1회 실행 → 속성 키 생성 + 시트 + 트리거 설치.
4. **프로젝트 설정 > 스크립트 속성** 에서 아래 값을 채운다.
5. **`debugDumpOrder('20260602-0000862')`** 실행 → 응답 JSON 에서 "정기배송 N회차"
   태그가 어느 필드인지 확인하고, 필요하면 `Sync.gs` 의 `extractCycle_` /
   `isSubscriptionOrder_` 셀렉터를 확정한다.
6. **`runOnce()`** 로 1회 수동 동기화 → `구독장부`/`실행로그` 시트 확인.
7. **배포 > 새 배포 > 웹 앱** 으로 doGet 엔드포인트 URL 발급(액세스: 모든 사용자).

## 채워야 할 스크립트 속성 (핸드오프 값)

| 키 | 설명 |
|----|------|
| `CAFE24_MALL_ID` | 몰 아이디 (`myshop` → `myshop.cafe24api.com`) |
| `CAFE24_CLIENT_ID` / `CAFE24_CLIENT_SECRET` | 카페24 앱 자격증명 |
| `CAFE24_REFRESH_TOKEN` | **회원 쓰기 스코프 포함 재인증**으로 발급한 refresh token |
| `SUBSCRIPTION_PRODUCT_NO` | 강의구독 정기배송 상품번호 |
| `CYCLE_UNIT` / `CYCLE_VALUE` | 주기 (테스트=`day`/`7`, 실제=`year`/`1` 등) |
| `LOOKUP_TOKEN_SECRET` | 조회 엔드포인트 HMAC 시크릿(임의 강한 문자열) |
| `ADMIN_EMAIL` | 미실행/오류 알림 수신 메일 |
| `LOOKBACK_DAYS` | 매일 거슬러 조회할 일수(기본 3, 누락 방지 여유) |
| `GRACE_DAYS` | 만료 후 유예일(기본 0) |

> `CAFE24_ACCESS_TOKEN` / `..._EXPIRES_AT` 은 런타임 자동 캐시이므로 수동 입력하지 않는다.

## 강의실 연동(B항목) 메모

- 스킨은 로그인 회원의 `member_id` 와 그 회원용 `token` 을 **서버단에서** 주입해
  엔드포인트를 호출하고, 응답 `active` 가 `true` 일 때만 비메오 임베드를 렌더한다.
- 토큰은 `makeLookupToken_(member_id)` 로 생성(= `debugMakeToken('회원ID')`).
  평문 `LOOKUP_TOKEN_SECRET` 을 클라이언트에 노출하지 말 것.
- JS 로 숨기는 방식은 우회되므로 반드시 서버단 렌더 분기로 처리.

## 카페24 API 확인 필요 사항 (TODO)

`Sync.gs` 의 주문 파싱 헬퍼는 실제 정기배송 주문 JSON 구조 확정 후 고정해야 한다.
특히 "정기배송 N회차" 태그 위치를 테스트 주문(`20260602-0000862`)으로 검증할 것.
주문 목록/상세 API 의 필드명(`payment_date`, `member_id`, `items[].product_no` 등)도
응답에 맞춰 조정한다.

## clasp 로 배포(선택)

```bash
npm i -g @google/clasp
clasp login
# 기존 시트 바운드 스크립트면 scriptId 를 .clasp.json 에 기입
clasp push
```

`.clasp.json` 예시는 `.clasp.json.example` 참고.

## 제약(명세서)

- 정기배송 결제수단 = 카드(+카카오페이). **네이버페이 불가** → 결제 안내 문구 필요.
- 강의구독 상품 = **배송없음**. 기구는 **구독 증정**(세트상품 불가).
- 회원등급은 1인 1개 → 구독은 등급이 아닌 **스위치**로 분리.
