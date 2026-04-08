// Supabase Edge Function: give-sticker
// 스티커 1개 부여 + 목표 달성 체크

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { board_id, memo } = await req.json();

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

    // Get board
    const { data: board } = await supabaseAdmin
      .from('sticker_boards')
      .select('*')
      .eq('id', board_id)
      .single();

    if (!board) {
      return new Response(JSON.stringify({ error: '스티커판을 찾을 수 없습니다' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (board.status !== 'active') {
      return new Response(JSON.stringify({ error: '활성 상태가 아닌 스티커판입니다' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (board.giver_id !== user.id) {
      return new Response(JSON.stringify({ error: '스티커를 줄 수 있는 권한이 없습니다' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check end date
    if (new Date(board.end_date) < new Date(new Date().toISOString().split('T')[0])) {
      return new Response(JSON.stringify({ error: '기간이 만료된 스티커판입니다' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if already at target
    if (board.current_count >= board.target_count) {
      return new Response(JSON.stringify({ error: '이미 목표를 달성한 스티커판입니다' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newSequence = board.current_count + 1;

    // Insert sticker
    const { error: stickerError } = await supabaseAdmin
      .from('stickers')
      .insert({
        board_id,
        giver_id: user.id,
        memo: memo || null,
        sequence: newSequence,
      });

    if (stickerError) throw new Error(stickerError.message);

    // Update board count
    const newCount = board.current_count + 1;
    const goalAchieved = newCount >= board.target_count;

    const updateData: Record<string, unknown> = { current_count: newCount };
    if (goalAchieved) {
      updateData.status = 'success';
    }

    const { error: updateError } = await supabaseAdmin
      .from('sticker_boards')
      .update(updateData)
      .eq('id', board_id);

    if (updateError) throw new Error(updateError.message);

    // If goal achieved, update reward status
    if (goalAchieved) {
      await supabaseAdmin
        .from('rewards')
        .update({ status: 'pending' })
        .eq('board_id', board_id)
        .eq('status', 'waiting');
    }

    return new Response(JSON.stringify({
      sticker: { board_id, sequence: newSequence, memo },
      current_count: newCount,
      goal_achieved: goalAchieved,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
