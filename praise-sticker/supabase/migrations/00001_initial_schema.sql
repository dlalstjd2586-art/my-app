-- ============================================
-- 칭찬스티커 앱 DB 스키마
-- Supabase PostgreSQL
-- Run this in Supabase SQL Editor
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

-- Users
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Invite Codes
CREATE POLICY "Users can read own invite codes" ON public.invite_codes
    FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = used_by);
CREATE POLICY "Users can create invite codes" ON public.invite_codes
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Relationships
CREATE POLICY "Users can read own relationships" ON public.relationships
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = partner_id);

-- Sticker Boards
CREATE POLICY "Users can read own boards" ON public.sticker_boards
    FOR SELECT USING (auth.uid() = collector_id OR auth.uid() = giver_id);
CREATE POLICY "Users can update own boards" ON public.sticker_boards
    FOR UPDATE USING (auth.uid() = collector_id OR auth.uid() = giver_id);

-- Stickers
CREATE POLICY "Users can read board stickers" ON public.stickers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sticker_boards
            WHERE id = stickers.board_id
            AND (collector_id = auth.uid() OR giver_id = auth.uid())
        )
    );

-- Rewards
CREATE POLICY "Users can read board rewards" ON public.rewards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sticker_boards
            WHERE id = rewards.board_id
            AND (collector_id = auth.uid() OR giver_id = auth.uid())
        )
    );

-- Penalties
CREATE POLICY "Users can read board penalties" ON public.penalties
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sticker_boards
            WHERE id = penalties.board_id
            AND (collector_id = auth.uid() OR giver_id = auth.uid())
        )
    );
CREATE POLICY "Users can update board penalties" ON public.penalties
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.sticker_boards
            WHERE id = penalties.board_id
            AND (collector_id = auth.uid() OR giver_id = auth.uid())
        )
    );

-- Notifications
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
