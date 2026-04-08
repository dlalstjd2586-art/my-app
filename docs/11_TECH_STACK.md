# 11. 추천 기술스택

## 최종 추천 조합

| 영역 | 기술 | 이유 |
|------|------|------|
| **프론트엔드** | **React Native + Expo (SDK 52+)** | AI 바이브코딩에 최적. React 생태계 활용. Expo로 네이티브 빌드 자동화 |
| **백엔드/DB** | **Supabase** | PostgreSQL 기반. 인증/DB/스토리지/Edge Functions 올인원. 무료 플랜 넉넉 |
| **인증** | **Supabase Auth** | 카카오/구글/애플 OAuth 기본 지원. 별도 인증 서버 불필요 |
| **데이터베이스** | **Supabase PostgreSQL** | RLS(Row Level Security)로 권한 관리. 관계형 DB라 이 앱에 적합 |
| **스토리지** | **Supabase Storage** | 프로필 사진, 커스텀 스티커 이미지 저장. 1GB 무료 |
| **서버리스 함수** | **Supabase Edge Functions (Deno)** | 복잡한 비즈니스 로직 처리. TypeScript 사용 |
| **푸시 알림** | **Expo Notifications + FCM** | Expo 내장 푸시 서비스. 설정 간편. 무료 |
| **광고 SDK** | **Google AdMob (react-native-google-mobile-ads)** | 가장 보편적. Expo Config Plugin 지원 |
| **상태 관리** | **Zustand** | 가볍고 직관적. Redux 대비 보일러플레이트 최소 |
| **네비게이션** | **Expo Router (파일 기반 라우팅)** | Next.js 스타일 라우팅. 직관적 |
| **UI 라이브러리** | **Tamagui 또는 NativeWind** | 스타일링 편의. Tailwind 스타일 사용 가능 |
| **빌드/배포** | **EAS Build + EAS Submit** | 클라우드 빌드. 로컬 Xcode/Android Studio 불필요 |
| **스케줄 작업** | **pg_cron (Supabase 내장)** | 만료 처리 등 정기 작업. 별도 서버 불필요 |

---

## 왜 이 조합인가?

### React Native + Expo를 선택한 이유

| 비교 대상 | 장점 | 단점 | 결론 |
|----------|------|------|------|
| **Flutter** | 성능 좋음, UI 일관성 | Dart 언어 (AI 코딩 도구 지원 약함), 커뮤니티 작음 | ❌ |
| **순수 React Native** | 유연성 높음 | 네이티브 빌드 설정 복잡, 초보자 진입장벽 | ❌ |
| **웹앱 (Next.js)** | 개발 빠름 | 푸시 알림 제한, 앱스토어 배포 불가, 네이티브 경험 부족 | ❌ |
| **Expo** | 빌드 자동화, OTA 업데이트, 풍부한 라이브러리, TypeScript | 일부 네이티브 모듈 제한 (하지만 이 앱에는 충분) | ✅ |

**핵심**: Expo는 "비개발자 + AI 코딩"에 가장 적합합니다.
- `npx create-expo-app`으로 즉시 시작
- EAS Build로 로컬에 Xcode/Android Studio 없이도 빌드 가능
- OTA 업데이트로 심사 없이 JS 코드 즉시 배포
- TypeScript/JavaScript 기반 → AI 코딩 도구가 가장 잘 지원하는 언어

### Supabase를 선택한 이유

| 비교 대상 | 장점 | 단점 | 결론 |
|----------|------|------|------|
| **Firebase** | 구글 생태계, 실시간 DB | NoSQL(Firestore)은 관계형 데이터에 부적합, 요금 예측 어려움 | ❌ |
| **직접 구축 (Node.js + PostgreSQL)** | 완전한 통제 | 서버 관리, 배포, 보안 직접 처리 → 초보자에게 과함 | ❌ |
| **Supabase** | PostgreSQL, RLS, Auth, Storage 올인원, 무료 플랜 넉넉 | Edge Functions 생태계 아직 성장 중 | ✅ |

**핵심**: 이 앱은 관계형 데이터(users→relationships→boards→stickers)가 핵심입니다.
- PostgreSQL이 이 구조에 가장 적합
- RLS로 "내 데이터만 접근" 규칙을 DB 레벨에서 강제
- 무료 플랜: 500MB DB, 1GB Storage, 50,000 MAU → MVP에 충분

---

## 프로젝트 구조 (예시)

```
praise-sticker-app/
├── app/                          # Expo Router 파일 기반 라우팅
│   ├── (auth)/                   # 인증 전 화면
│   │   ├── onboarding.tsx
│   │   ├── login.tsx
│   │   └── _layout.tsx
│   ├── (main)/                   # 인증 후 화면 (탭 네비게이션)
│   │   ├── (tabs)/
│   │   │   ├── home.tsx          # 홈 대시보드
│   │   │   ├── history.tsx       # 히스토리
│   │   │   └── settings.tsx      # 설정
│   │   ├── connect.tsx           # 관계 연동
│   │   ├── board/
│   │   │   ├── create.tsx        # 스티커판 생성
│   │   │   └── [id].tsx          # 스티커판 상세
│   │   └── _layout.tsx
│   └── _layout.tsx               # 루트 레이아웃
├── components/                    # 재사용 컴포넌트
│   ├── StickerGrid.tsx
│   ├── ProgressBar.tsx
│   ├── InviteCodeCard.tsx
│   └── AdBanner.tsx
├── lib/                           # 유틸리티
│   ├── supabase.ts               # Supabase 클라이언트
│   ├── auth.ts                   # 인증 헬퍼
│   └── notifications.ts         # 푸시 알림
├── stores/                        # Zustand 스토어
│   ├── authStore.ts
│   ├── boardStore.ts
│   └── relationshipStore.ts
├── types/                         # TypeScript 타입
│   └── database.ts               # DB 스키마 타입 (Supabase 자동 생성)
├── assets/                        # 이미지, 폰트
│   └── stickers/                 # 기본 스티커 이미지
├── supabase/                      # Supabase 로컬 설정
│   ├── migrations/               # DB 마이그레이션
│   └── functions/                # Edge Functions
│       ├── create-invite/
│       ├── accept-invite/
│       ├── create-board/
│       ├── give-sticker/
│       └── ...
├── app.json                       # Expo 설정
├── eas.json                       # EAS Build 설정
└── package.json
```

---

## 개발 환경 세팅 순서

```bash
# 1. Expo 프로젝트 생성
npx create-expo-app@latest praise-sticker-app --template tabs

# 2. 필수 패키지 설치
npx expo install @supabase/supabase-js
npx expo install expo-secure-store
npx expo install expo-notifications
npx expo install expo-image-picker
npx expo install expo-linking
npm install zustand
npm install react-native-google-mobile-ads

# 3. Supabase 프로젝트 생성 (supabase.com에서)
# 4. 환경 변수 설정
# 5. DB 마이그레이션 실행
# 6. 개발 시작
npx expo start
```

---

## 버전/호환성 참고

| 패키지 | 권장 버전 | 비고 |
|--------|----------|------|
| Expo SDK | 52+ | 최신 안정 버전 사용 |
| React Native | 0.76+ | Expo SDK 52와 호환 |
| TypeScript | 5.x | 타입 안전성 |
| Node.js | 20 LTS | 개발 환경 |
| Supabase JS | 2.x | 최신 클라이언트 |
