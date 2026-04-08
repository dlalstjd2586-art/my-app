// Supabase Edge Function: create-board
// 스티커판 생성 (보드 + 보상 + 패널티 INSERT)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const { title, collector_id, target_count, start_date, end_date, sticker_preset,
            reward_description, reward_type, has_penalty, penalty_description } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: '인증이 필요합니다' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get relationship
    const { data: rel } = await supabaseAdmin
      .from('relationships')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'connected')
      .single();

    if (!rel) {
      return new Response(JSON.stringify({ error: '연결된 파트너가 없습니다' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine giver
    const giver_id = collector_id === user.id ? rel.partner_id : user.id;

    // Validate
    if (target_count < 5 || target_count > 100) {
      return new Response(JSON.stringify({ error: '목표는 5~100개 사이여야 합니다' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create board
    const { data: board, error: boardError } = await supabaseAdmin
      .from('sticker_boards')
      .insert({
        relationship_id: rel.id,
        creator_id: user.id,
        collector_id,
        giver_id,
        title,
        target_count,
        current_count: 0,
        sticker_preset: sticker_preset || 'star_gold',
        start_date,
        end_date,
        status: 'draft',
        has_penalty: has_penalty || false,
      })
      .select()
      .single();

    if (boardError || !board) throw new Error(boardError?.message ?? '보드 생성 실패');

    // Create reward
    const { error: rewardError } = await supabaseAdmin
      .from('rewards')
      .insert({
        board_id: board.id,
        description: reward_description,
        reward_type: reward_type || 'promise',
        status: 'waiting',
        provider_id: giver_id, // 스티커를 주는 사람이 보상 제공
      });

    if (rewardError) throw new Error(rewardError.message);

    // Create penalty if enabled
    if (has_penalty && penalty_description) {
      const { error: penaltyError } = await supabaseAdmin
        .from('penalties')
        .insert({
          board_id: board.id,
          description: penalty_description,
          status: 'inactive',
          responsible_id: collector_id, // 스티커 모으는 사람이 패널티 이행
        });

      if (penaltyError) throw new Error(penaltyError.message);
    }

    return new Response(JSON.stringify({ board }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
