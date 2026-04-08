# 14. 실제 구현용 산출물

---

## 14-A. PRD (Product Requirements Document) 초안

### 제품명
칭찬스티커 (PraiseSticker)

### 버전
MVP v1.0

### 작성일
2026-04-08

### 제품 비전
소중한 사람과 칭찬 스티커를 주고받으며 함께 목표를 달성하는 관계형 리워드 앱

### 타겟 사용자
- Primary: 20~30대 커플/부부
- Secondary: 부모-자녀

### 핵심 가치 제안
1. 칭찬을 시각적으로 기록하고 모으는 재미
2. 목표 달성 시 약속한 보상이 실행되는 동기부여
3. 관계 속 긍정적 행동을 강화하는 게이미피케이션

### 성공 지표 (KPI)

| 지표 | 목표 (출시 3개월) | 측정 방법 |
|------|-----------------|----------|
| MAU | 500명 | Supabase Auth 활성 사용자 |
| 일평균 스티커 부여 수 | 2개/활성 보드 | stickers 테이블 집계 |
| 스티커판 완주율 | 30% | success / (success + failed) |
| D7 리텐션 | 40% | 7일 후 재접속 비율 |
| 관계 연동율 | 가입자의 60% | relationships 테이블 |

### 사용자 스토리

| ID | 역할 | 행동 | 목적 |
|----|------|------|------|
| US-01 | 사용자 | 구글 계정으로 가입한다 | 빠르게 시작하기 위해 |
| US-02 | 사용자 | 초대코드를 생성하여 파트너에게 공유한다 | 파트너와 연결하기 위해 |
| US-03 | 사용자 | 초대코드를 입력하여 파트너와 연결한다 | 함께 사용하기 위해 |
| US-04 | 사용자 | 스티커판을 생성한다 | 새로운 목표를 시작하기 위해 |
| US-05 | 수신자 | 스티커판을 수락한다 | 목표에 동의하기 위해 |
| US-06 | 부여자 | 파트너에게 스티커를 준다 | 칭찬을 기록하기 위해 |
| US-07 | 사용자 | 현재 진행률을 확인한다 | 동기부여를 얻기 위해 |
| US-08 | 사용자 | 목표 달성 시 보상 내용을 확인한다 | 보상을 이행하기 위해 |
| US-09 | 사용자 | 보상 이행 완료를 기록한다 | 약속 이행을 증명하기 위해 |

### 제약 조건
- 외부 결제/선물 자동 연동 없음 (약속형 텍스트 + 링크만)
- 1:1 관계만 지원 (그룹 미지원)
- 광고 수익 모델만 (인앱 결제 없음)
- 14세 미만 사용자는 법정대리인 동의 필요 (부모-자녀 사용 시)

### 비기능 요구사항
- 앱 로딩 시간: 3초 이내
- 스티커 부여 응답 시간: 1초 이내
- 이미지 업로드: 500KB 이하, 리사이즈 처리
- 데이터 백업: Supabase 자동 백업 (일간)
- 개인정보: 최소 수집 원칙 (닉네임, 프로필 사진, 푸시 토큰)

---

## 14-B. 화면 플로우

### 전체 플로우 차트

```
┌─────────────┐
│  앱 실행     │
└──────┬──────┘
       ▼
┌─────────────┐     ┌──────────────┐
│  로그인 여부  │──N──▶│  로그인 화면   │
│  체크        │     │ (구글 OAuth)  │
└──────┬──────┘     └──────┬───────┘
       │Y                  │
       ▼                   ▼
┌─────────────┐     ┌──────────────┐
│  프로필 있음?│──N──▶│ 닉네임 설정   │
└──────┬──────┘     └──────┬───────┘
       │Y                  │
       ▼                   ▼
┌─────────────┐     ┌──────────────┐
│  관계 있음?  │──N──▶│  관계 연동    │
│              │     │ 초대/코드입력  │
└──────┬──────┘     └──────┬───────┘
       │Y                  │
       ▼                   ▼
┌══════════════════════════════════┐
║         홈 대시보드              ║
║  ┌────────────────────────────┐ ║
║  │ 파트너: 지은 💑             │ ║
║  │                            │ ║
║  │ [진행 중 스티커판 카드]      │ ║
║  │  "운동 챌린지"              │ ║
║  │  ██████████░░░░ 15/20      │ ║
║  │  D-5                       │ ║
║  │                            │ ║
║  │ [ + 새 스티커판 만들기 ]     │ ║
║  └────────────────────────────┘ ║
║                                  ║
║  [🏠홈]    [📋기록]    [⚙️설정] ║
╚══════════════════════════════════╝
       │                    │
       ▼                    ▼
┌──────────────┐    ┌──────────────┐
│ 스티커판 생성  │    │ 스티커판 상세  │
│              │    │              │
│ 이름: ____   │    │ ⭐⭐⭐⭐⭐   │
│ 목표: [20]개  │    │ ⭐⭐⭐⭐⭐   │
│ 기간: [30]일  │    │ ⭐⭐⭐⭐⭐   │
│ 보상: ____   │    │ ⭐⭐⭐○○   │
│ 스티커: [⭐]  │    │              │
│              │    │ 보상: 오마카세 │
│ [생성하기]    │    │              │
└──────────────┘    │ [🌟스티커주기] │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ 스티커 주기   │
                    │ (바텀시트)    │
                    │              │
                    │    🌟        │
                    │ 메모: ____   │
                    │              │
                    │ [스티커 주기] │
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │              │
                    ▼              ▼
             목표 미달성      목표 달성!
             (카운트+1)    ┌──────────────┐
                          │  🎉 축하!     │
                          │  목표 달성!    │
                          │              │
                          │  보상:        │
                          │  청담 오마카세  │
                          │              │
                          │ [보상 완료]   │
                          └──────────────┘
```

### 화면 전환 매트릭스

| From | To | 트리거 |
|------|----|--------|
| 앱 실행 | 로그인 | 비로그인 상태 |
| 앱 실행 | 홈 | 로그인+연동 완료 상태 |
| 로그인 | 닉네임 설정 | 첫 가입 |
| 로그인 | 홈 | 기존 사용자 |
| 닉네임 설정 | 관계 연동 | 관계 미연동 |
| 관계 연동 | 홈 | 연동 완료 |
| 홈 | 스티커판 생성 | "새 스티커판" 버튼 |
| 홈 | 스티커판 상세 | 카드 탭 |
| 스티커판 상세 | 스티커 주기 (바텀시트) | "스티커 주기" 버튼 |
| 스티커 주기 | 축하 모달 | 목표 달성 시 |
| 스티커 주기 | 스티커판 상세 | 일반 부여 시 |

---

## 14-C. DB 스키마 초안 (SQL)

```sql
-- ============================================
-- 칭찬스티커 앱 DB 스키마
-- Supabase PostgreSQL
-- ============================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users (Supabase Auth의 auth.users와 연결)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname VARCHAR(30) NOT NULL,
    profile_image_url TEXT,
    auth_provider VARCHAR(20) NOT NULL DEFAULT 'google',
    push_token TEXT,
    notification_sticker BOOLEAN NOT NULL DEFAULT true,
    notification_expiry BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 2. Invite Codes
CREATE TABLE public.invite_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(6) NOT NULL UNIQUE,
    creator_id UUID NOT NULL REFERENCES public.users(id),
    expires_at TIMESTAMPTZ NOT NULL,
    used_by UUID REFERENCES public.users(id),
    used_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'used', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX idx_invite_codes_creator ON public.invite_codes(creator_id);
CREATE INDEX idx_invite_codes_status_expires ON public.invite_codes(status, expires_at);

-- 3. Relationships
CREATE TABLE public.relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    partner_id UUID NOT NULL REFERENCES public.users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'connected', 'ended')),
    nickname_for_partner VARCHAR(30),
    connected_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, partner_id)
);

CREATE INDEX idx_relationships_user_status ON public.relationships(user_id, status);

-- 4. Sticker Boards
CREATE TABLE public.sticker_boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES public.relationships(id),
    creator_id UUID NOT NULL REFERENCES public.users(id),
    collector_id UUID NOT NULL REFERENCES public.users(id),
    giver_id UUID NOT NULL REFERENCES public.users(id),
    title VARCHAR(50) NOT NULL,
    target_count INTEGER NOT NULL CHECK (target_count BETWEEN 5 AND 100),
    current_count INTEGER NOT NULL DEFAULT 0 CHECK (current_count >= 0),
    sticker_image_url TEXT,
    sticker_preset VARCHAR(20) DEFAULT 'star_gold',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'active', 'success', 'failed', 'cancelled')),
    has_penalty BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date > start_date),
    CHECK (current_count <= target_count)
);

CREATE INDEX idx_boards_relationship_status ON public.sticker_boards(relationship_id, status);
CREATE INDEX idx_boards_collector ON public.sticker_boards(collector_id);
CREATE INDEX idx_boards_giver ON public.sticker_boards(giver_id);
CREATE INDEX idx_boards_status_enddate ON public.sticker_boards(status, end_date);

-- 5. Stickers
CREATE TABLE public.stickers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES public.sticker_boards(id),
    giver_id UUID NOT NULL REFERENCES public.users(id),
    memo VARCHAR(100),
    sequence INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(board_id, sequence)
);

CREATE INDEX idx_stickers_board_seq ON public.stickers(board_id, sequence);

-- 6. Rewards
CREATE TABLE public.rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL UNIQUE REFERENCES public.sticker_boards(id),
    description VARCHAR(200) NOT NULL,
    reward_type VARCHAR(20) NOT NULL DEFAULT 'promise'
        CHECK (reward_type IN ('promise', 'link', 'gifticon_code')),
    reward_data TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting'
        CHECK (status IN ('waiting', 'pending', 'completed', 'skipped')),
    provider_id UUID NOT NULL REFERENCES public.users(id),
    completed_at TIMESTAMPTZ,
    proof_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Penalties
CREATE TABLE public.penalties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL UNIQUE REFERENCES public.sticker_boards(id),
    description VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'inactive'
        CHECK (status IN ('inactive', 'pending', 'completed', 'skipped')),
    responsible_id UUID NOT NULL REFERENCES public.users(id),
    completed_at TIMESTAMPTZ,
    proof_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Reward Logs
CREATE TABLE public.reward_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES public.sticker_boards(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('reward', 'penalty')),
    actor_id UUID NOT NULL REFERENCES public.users(id),
    description VARCHAR(200) NOT NULL,
    proof_image_url TEXT,
    completed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    type VARCHAR(30) NOT NULL,
    title VARCHAR(100) NOT NULL,
    body VARCHAR(200) NOT NULL,
    data JSONB,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, is_read, created_at DESC);

-- 10. Ad Events (분석용)
CREATE TABLE public.ad_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    ad_type VARCHAR(20) NOT NULL,
    ad_unit_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(20) NOT NULL,
    screen VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ad_events_user_date ON public.ad_events(user_id, created_at);

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticker_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;

-- Users: 자기 자신만
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Invite Codes: 자기가 만든 것 또는 사용할 코드
CREATE POLICY "Users can read own invite codes" ON public.invite_codes
    FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = used_by);
CREATE POLICY "Users can create invite codes" ON public.invite_codes
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Relationships: 자신이 포함된 관계만
CREATE POLICY "Users can read own relationships" ON public.relationships
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = partner_id);

-- Sticker Boards: collector 또는 giver만
CREATE POLICY "Users can read own boards" ON public.sticker_boards
    FOR SELECT USING (auth.uid() = collector_id OR auth.uid() = giver_id);

-- Stickers: 해당 보드 접근 권한자만
CREATE POLICY "Users can read board stickers" ON public.stickers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sticker_boards
            WHERE id = stickers.board_id
            AND (collector_id = auth.uid() OR giver_id = auth.uid())
        )
    );

-- Notifications: 자기 알림만
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- updated_at 자동 갱신 트리거
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_boards_updated_at
    BEFORE UPDATE ON public.sticker_boards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_rewards_updated_at
    BEFORE UPDATE ON public.rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_penalties_updated_at
    BEFORE UPDATE ON public.penalties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 14-D. 개발 태스크 리스트

### Sprint 1: 기반 세팅 (Day 1~2)

| # | 태스크 | 담당 | 산출물 |
|---|--------|------|--------|
| T-01 | Expo 프로젝트 생성 (TypeScript, Expo Router) | 프론트 | 프로젝트 폴더 |
| T-02 | Supabase 프로젝트 생성 + 환경변수 설정 | 백엔드 | .env, supabase 연결 |
| T-03 | DB 마이그레이션 실행 (위 SQL) | 백엔드 | 테이블 생성 완료 |
| T-04 | RLS 정책 적용 | 백엔드 | 보안 정책 활성화 |
| T-05 | Supabase Client 초기화 (lib/supabase.ts) | 프론트 | supabase 인스턴스 |
| T-06 | 기본 네비게이션 구조 (auth/main 분기) | 프론트 | 라우팅 구조 |

### Sprint 2: 인증 (Day 3~4)

| # | 태스크 | 담당 | 산출물 |
|---|--------|------|--------|
| T-07 | 구글 OAuth 설정 (Supabase + Google Console) | 백엔드 | OAuth 연동 |
| T-08 | 로그인 화면 UI | 프론트 | login.tsx |
| T-09 | 로그인 로직 (supabase.auth.signInWithOAuth) | 프론트 | 인증 플로우 |
| T-10 | 닉네임 설정 화면 UI + 로직 | 프론트 | setup-profile.tsx |
| T-11 | 인증 상태 관리 (Zustand authStore) | 프론트 | authStore.ts |
| T-12 | 로그인 여부에 따른 화면 분기 | 프론트 | _layout.tsx 수정 |

### Sprint 3: 관계 연동 (Day 5~7)

| # | 태스크 | 담당 | 산출물 |
|---|--------|------|--------|
| T-13 | Edge Function: create-invite (초대코드 생성) | 백엔드 | create-invite/index.ts |
| T-14 | Edge Function: accept-invite (초대 수락) | 백엔드 | accept-invite/index.ts |
| T-15 | 관계 연동 화면 UI (초대탭/입력탭) | 프론트 | connect.tsx |
| T-16 | 초대코드 복사/공유 기능 | 프론트 | Clipboard + Share API |
| T-17 | 연동 완료 후 홈으로 이동 | 프론트 | 네비게이션 로직 |

### Sprint 4: 스티커판 (Day 8~10)

| # | 태스크 | 담당 | 산출물 |
|---|--------|------|--------|
| T-18 | Edge Function: create-board | 백엔드 | create-board/index.ts |
| T-19 | Edge Function: accept-board | 백엔드 | accept-board/index.ts |
| T-20 | 스티커판 생성 화면 UI (폼) | 프론트 | board/create.tsx |
| T-21 | 기본 스티커 이미지 3종 제작/등록 | 디자인 | assets/stickers/ |
| T-22 | 홈 대시보드 UI (진행 중 보드 카드) | 프론트 | home.tsx |
| T-23 | 보드 상세 화면 UI (스티커 그리드) | 프론트 | board/[id].tsx |

### Sprint 5: 스티커 부여 + 달성 (Day 11~12)

| # | 태스크 | 담당 | 산출물 |
|---|--------|------|--------|
| T-24 | Edge Function: give-sticker (스티커 부여 + 달성 체크) | 백엔드 | give-sticker/index.ts |
| T-25 | 스티커 주기 바텀시트 UI | 프론트 | GiveStickerSheet.tsx |
| T-26 | 진행률 바 컴포넌트 | 프론트 | ProgressBar.tsx |
| T-27 | 스티커 그리드 컴포넌트 (채워진/빈 칸) | 프론트 | StickerGrid.tsx |
| T-28 | 목표 달성 축하 모달 | 프론트 | GoalAchievedModal.tsx |

### Sprint 6: 만료 + 보상 + 마무리 (Day 13~14)

| # | 태스크 | 담당 | 산출물 |
|---|--------|------|--------|
| T-29 | 클라이언트 만료 체크 로직 (앱 열 때) | 프론트 | useCheckExpiry 훅 |
| T-30 | Edge Function: complete-reward | 백엔드 | complete-reward/index.ts |
| T-31 | 보상 완료 UI (버튼 + 상태 표시) | 프론트 | board/[id].tsx 수정 |
| T-32 | 빈 상태 처리 (관계 없음, 보드 없음) | 프론트 | EmptyState 컴포넌트 |
| T-33 | 에러 핸들링 + 로딩 상태 | 프론트 | 전체 화면 |

### Sprint 7: 테스트 + 수정 (Day 15~16)

| # | 태스크 | 담당 | 산출물 |
|---|--------|------|--------|
| T-34 | 실기기 테스트 (iOS + Android) | QA | 버그 리스트 |
| T-35 | 버그 수정 | 전체 | 수정된 코드 |
| T-36 | 개인정보처리방침 + 이용약관 페이지 작성 | PM | URL |
| T-37 | 앱 아이콘 + 스플래시 스크린 | 디자인 | 에셋 파일 |

---

## 태스크 요약

| 스프린트 | 기간 | 태스크 수 |
|---------|------|----------|
| Sprint 1: 기반 세팅 | Day 1~2 | 6개 |
| Sprint 2: 인증 | Day 3~4 | 6개 |
| Sprint 3: 관계 연동 | Day 5~7 | 5개 |
| Sprint 4: 스티커판 | Day 8~10 | 6개 |
| Sprint 5: 스티커+달성 | Day 11~12 | 5개 |
| Sprint 6: 만료+보상 | Day 13~14 | 5개 |
| Sprint 7: 테스트 | Day 15~16 | 4개 |
| **합계** | **16일** | **37개** |
