// Supabase Edge Function: complete-reward
// 보상 이행 완료 처리

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { reward_id } = await req.json();

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

    // Get reward
    const { data: reward } = await supabaseAdmin
      .from('rewards')
      .select('*')
      .eq('id', reward_id)
      .single();

    if (!reward) {
      return new Response(JSON.stringify({ error: '보상을 찾을 수 없습니다' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (reward.status !== 'pending') {
      return new Response(JSON.stringify({ error: '이행 대기 상태가 아닙니다' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();

    // Update reward
    const { data: updated, error } = await supabaseAdmin
      .from('rewards')
      .update({ status: 'completed', completed_at: now })
      .eq('id', reward_id)
      .select()
      .single();

    if (error) throw error;

    // Log
    await supabaseAdmin.from('reward_logs').insert({
      board_id: reward.board_id,
      type: 'reward',
      actor_id: user.id,
      description: reward.description,
      completed_at: now,
    });

    return new Response(JSON.stringify({ reward: updated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
