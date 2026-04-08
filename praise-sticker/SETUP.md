# 칭찬스티커 앱 - 실제 배포 가이드

> 데모 모드는 설정 없이 바로 사용 가능합니다.
> 아래는 **실제 서비스로 배포**할 때 필요한 설정입니다.

---

## 1단계: Supabase 프로젝트 생성 (무료)

1. https://supabase.com 접속 → 회원가입 → "New Project" 클릭
2. 프로젝트 이름: `praise-sticker`, 비밀번호 설정, Region: `Northeast Asia (Tokyo)`
3. 프로젝트 생성 완료 후 **Project Settings > API** 이동
4. 아래 두 값을 복사:
   - `Project URL` (예: `https://abcd1234.supabase.co`)
   - `anon public` 키
5. `praise-sticker` 폴더에 `.env` 파일을 만들고 아래 내용 입력:

```
EXPO_PUBLIC_SUPABASE_URL=https://여기에-Project-URL-붙여넣기
EXPO_PUBLIC_SUPABASE_ANON_KEY=여기에-anon-key-붙여넣기
```

---

## 2단계: 데이터베이스 테이블 만들기

1. Supabase Dashboard > 왼쪽 메뉴 **SQL Editor** 클릭
2. "New query" 클릭
3. `supabase/migrations/00001_initial_schema.sql` 파일 내용을 **전체 복사**하여 붙여넣기
4. **Run** 버튼 클릭
5. "Success" 나오면 완료! (테이블 10개 + 보안 정책 자동 생성)

---

## 3단계: Google 로그인 설정

### A. Google Cloud Console 설정

1. https://console.cloud.google.com 접속 → 로그인
2. 상단 프로젝트 선택 → "새 프로젝트" → 이름: `PraiseSticker`
3. 왼쪽 메뉴 **APIs & Services > OAuth consent screen**
   - User Type: External → Create
   - App name: `칭찬스티커`
   - User support email: 내 이메일
   - 나머지 빈칸 → Save
4. 왼쪽 메뉴 **Credentials > + CREATE CREDENTIALS > OAuth client ID**
   - Application type: `Web application`
   - Name: `Supabase Auth`
   - Authorized redirect URIs에 추가:
     `https://여기에-Project-URL.supabase.co/auth/v1/callback`
   - **Create** 클릭
5. **Client ID**와 **Client Secret**을 복사해두기

### B. Supabase에 Google 연결

1. Supabase Dashboard > **Authentication > Providers**
2. **Google** 클릭 → Enable 켜기
3. 위에서 복사한 Client ID, Client Secret 입력
4. **Save**

---

## 4단계: Edge Functions 배포

```bash
npm install -g supabase
supabase login
supabase link --project-ref 여기에-프로젝트-ref-입력

supabase functions deploy create-invite
supabase functions deploy accept-invite
supabase functions deploy create-board
supabase functions deploy accept-board
supabase functions deploy give-sticker
supabase functions deploy complete-reward
```

> 프로젝트 ref는 Supabase Dashboard URL에서 확인:
> `https://supabase.com/dashboard/project/여기가ref`

---

## 5단계: 앱 실행

```bash
npm install
npx expo start
```

- **w** → 웹 브라우저에서 테스트
- **Expo Go 앱** (폰에 설치) → QR 스캔으로 폰에서 테스트

---

## 6단계: 실제 앱 빌드 (스토어 출시)

```bash
# EAS CLI 설치
npm install -g eas-cli

# Expo 계정 로그인
eas login

# 프로젝트 초기화
eas build:configure

# Android APK 빌드 (테스트용)
eas build --platform android --profile preview

# Android 프로덕션 빌드
eas build --platform android --profile production

# iOS 빌드 (Apple Developer 계정 필요, $99/년)
eas build --platform ios --profile production
```

---

## 프로젝트 구조

```
praise-sticker/
├── app/                    # 화면 (Expo Router)
│   ├── _layout.tsx         # 루트 레이아웃 + 인증 가드
│   ├── index.tsx           # 시작 화면 리다이렉트
│   ├── login.tsx           # Google 로그인 + 데모 모드
│   ├── setup-nickname.tsx  # 닉네임 설정
│   ├── connect.tsx         # 파트너 초대코드 연동
│   ├── (tabs)/             # 하단 탭 네비게이션
│   │   ├── home.tsx        # 🏠 홈 대시보드
│   │   ├── praise.tsx      # 💝 칭찬 모아보기 + 뱃지 + 리포트
│   │   ├── history.tsx     # 📋 지난 기록
│   │   └── settings.tsx    # ⚙️ 설정
│   └── board/
│       ├── create.tsx      # 스티커판 생성 (템플릿 포함)
│       └── [id].tsx        # 스티커판 상세 (스티커 그리드 + 부여)
├── components/             # 공통 컴포넌트
│   ├── ConfettiOverlay.tsx # 스티커 부여 팡! 효과
│   ├── ConfirmModal.tsx    # 확인/취소 모달
│   └── BadgeCard.tsx       # 뱃지 카드
├── lib/
│   ├── supabase.ts         # Supabase 클라이언트
│   └── demo-data.ts        # 데모 모드 가짜 데이터
├── stores/                 # Zustand 상태 관리
├── types/database.ts       # TypeScript 타입
├── supabase/
│   ├── migrations/         # DB 스키마 SQL
│   └── functions/          # Edge Functions (6개)
├── app.json                # Expo 설정
├── eas.json                # EAS Build 설정
└── .env.example            # 환경변수 예시
```
