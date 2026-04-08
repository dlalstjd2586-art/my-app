# 칭찬스티커 앱 - 기획 문서 인덱스

> **커플/부부/가족이 서로에게 칭찬 스티커를 주고, 목표를 달성하면 약속한 보상을 실행하는 관계형 리워드 앱**

## 문서 목록

| # | 문서 | 내용 |
|---|------|------|
| 01 | [서비스 정의](./01_SERVICE_DEFINITION.md) | 한 줄 정의, 타겟, 사용 이유 |
| 02 | [사용자 시나리오](./02_USER_SCENARIOS.md) | 가입→연동→스티커→달성 전체 플로우 |
| 03 | [기능 정의서](./03_FEATURE_SPEC.md) | MVP/2차/3차 기능 분류 (35개 기능) |
| 04 | [화면 기획](./04_SCREEN_DESIGN.md) | 9개 화면별 UI 요소, 데이터, 행동 |
| 05 | [DB 스키마](./05_DATABASE_SCHEMA.md) | 10개 테이블 설계 + RLS 정책 |
| 06 | [상태값 설계](./06_STATUS_ENUMS.md) | 7개 status enum + 전이 다이어그램 |
| 07 | [API 설계](./07_API_DESIGN.md) | 17개 API 엔드포인트 + Cron Job |
| 08 | [외부 연동 검토](./08_EXTERNAL_INTEGRATION.md) | 카카오 선물하기 불가 판정 + 대안 5가지 |
| 09 | [광고 수익 모델](./09_AD_REVENUE_MODEL.md) | 광고 배치 전략 + 현실적 수익 분석 |
| 10 | [MVP 우선순위](./10_MVP_PRIORITY.md) | 1차/2차/3차 개발 순서 + 마일스톤 |
| 11 | [기술스택](./11_TECH_STACK.md) | Expo + Supabase 추천 + 프로젝트 구조 |
| 12 | [난이도/리스크](./12_DIFFICULTY_RISK.md) | 기능별 난이도 + 리스크 매트릭스 |
| 13 | [MVP 축소안](./13_MVP_SCOPE.md) | "진짜 최소" 범위 = 6화면, 16일 |
| 14 | [구현용 산출물](./14_IMPLEMENTATION_DOCS.md) | PRD + 화면 플로우 + SQL 스키마 + 37개 태스크 |

## 기술스택 요약

| 영역 | 선택 |
|------|------|
| 프론트엔드 | React Native + Expo (SDK 52+) |
| 백엔드/DB | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| 푸시 알림 | Expo Notifications + FCM |
| 광고 | Google AdMob |
| 배포 | EAS Build + EAS Submit |

## 가장 현실적인 MVP 한 줄 결론

> **구글 로그인 + 초대코드 연동 + 스티커판 1개 + 스티커 주기 + 목표 달성 = 6화면, 16일이면 출시 가능한 MVP가 완성된다. 카카오 선물하기 자동 연동은 불가능하니 "약속형 텍스트 보상"으로 시작하고, 사용자가 모이면 그때 확장하자.**
