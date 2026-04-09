-- ============================================
-- 클라이언트에서 직접 CRUD 가능하도록 RLS 정책 추가
-- Edge Functions 없이 앱이 동작하기 위한 정책
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- invite_codes: 누구나 active 코드를 조회 가능 (코드 입력 시)
CREATE POLICY "Anyone can read active invite codes" ON public.invite_codes
    FOR SELECT USING (status = 'active');

-- invite_codes: 코드 상태 업데이트 (사용 처리)
CREATE POLICY "Users can update invite codes" ON public.invite_codes
    FOR UPDATE USING (true);

-- relationships: 인증된 사용자는 관계 생성 가능
CREATE POLICY "Users can create relationships" ON public.relationships
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = partner_id);

-- relationships: 자신의 관계 업데이트 가능
CREATE POLICY "Users can update own relationships" ON public.relationships
    FOR UPDATE USING (auth.uid() = user_id);

-- sticker_boards: 생성 가능
CREATE POLICY "Users can create boards" ON public.sticker_boards
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- stickers: giver가 스티커 추가 가능
CREATE POLICY "Giver can add stickers" ON public.stickers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sticker_boards
            WHERE id = board_id AND giver_id = auth.uid() AND status = 'active'
        )
    );

-- rewards: 보드 관련자가 생성/수정 가능
CREATE POLICY "Users can create rewards" ON public.rewards
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update rewards" ON public.rewards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.sticker_boards
            WHERE id = rewards.board_id
            AND (collector_id = auth.uid() OR giver_id = auth.uid())
        )
    );

-- penalties: 보드 관련자가 생성/수정 가능
CREATE POLICY "Users can create penalties" ON public.penalties
    FOR INSERT WITH CHECK (true);

-- reward_logs: 생성 가능
CREATE POLICY "Users can create reward logs" ON public.reward_logs
    FOR INSERT WITH CHECK (auth.uid() = actor_id);

CREATE POLICY "Users can read reward logs" ON public.reward_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sticker_boards
            WHERE id = reward_logs.board_id
            AND (collector_id = auth.uid() OR giver_id = auth.uid())
        )
    );

-- notifications: 생성 가능
CREATE POLICY "Users can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- users: 다른 사용자 닉네임 조회 (파트너 정보 표시용)
CREATE POLICY "Users can read partner data" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.relationships
            WHERE (user_id = auth.uid() AND partner_id = users.id)
               OR (partner_id = auth.uid() AND user_id = users.id)
        )
    );
