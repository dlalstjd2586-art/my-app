# 칭찬스티커 앱 - 개발 셋업 가이드

## 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. Project Settings > API에서 `URL`과 `anon key` 복사
3. 프로젝트 루트에 `.env` 파일 생성:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 2. 데이터베이스 설정

1. Supabase Dashboard > SQL Editor 열기
2. `supabase/migrations/00001_initial_schema.sql` 파일 내용을 복사하여 실행
3. 테이블 10개 + RLS 정책 + 트리거가 생성됨

## 3. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. APIs & Services > Credentials > OAuth 2.0 Client ID 생성
   - Web Application 타입
   - Authorized redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Supabase Dashboard > Authentication > Providers > Google 활성화
   - Client ID, Client Secret 입력

## 4. Edge Functions 배포

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref YOUR_PROJECT_REF

# Edge Functions 배포
supabase functions deploy create-invite
supabase functions deploy accept-invite
supabase functions deploy create-board
supabase functions deploy accept-board
supabase functions deploy give-sticker
supabase functions deploy complete-reward
```

## 5. 앱 실행

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npx expo start

# 실기기: Expo Go 앱으로 QR 스캔
# 에뮬레이터: a (Android) 또는 i (iOS)
```

## 프로젝트 구조

```
praise-sticker/
├── app/                    # 화면 (Expo Router)
│   ├── _layout.tsx         # 루트 레이아웃 + 인증 가드
│   ├── login.tsx           # 로그인
│   ├── setup-nickname.tsx  # 닉네임 설정
│   ├── connect.tsx         # 파트너 연동
│   ├── (tabs)/             # 탭 네비게이션
│   │   ├── home.tsx        # 홈 대시보드
│   │   ├── history.tsx     # 기록
│   │   └── settings.tsx    # 설정
│   └── board/
│       ├── create.tsx      # 스티커판 생성
│       └── [id].tsx        # 스티커판 상세
├── lib/supabase.ts         # Supabase 클라이언트
├── stores/                 # Zustand 상태 관리
├── types/database.ts       # TypeScript 타입
├── supabase/
│   ├── migrations/         # DB 스키마 SQL
│   └── functions/          # Edge Functions
└── constants/Colors.ts     # 디자인 토큰
```
