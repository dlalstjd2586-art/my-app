// Supabase Edge Function: accept-board
// 스티커판 수락 (draft → active)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { board_id } = await req.json();

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

    if (board.status !== 'draft') {
      return new Response(JSON.stringify({ error: '이미 처리된 스티커판입니다' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only the non-creator can accept
    if (board.creator_id === user.id) {
      return new Response(JSON.stringify({ error: '생성자는 직접 수락할 수 없습니다' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check user is part of this board
    if (board.collector_id !== user.id && board.giver_id !== user.id) {
      return new Response(JSON.stringify({ error: '권한이 없습니다' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Activate board
    const { data: updated, error } = await supabaseAdmin
      .from('sticker_boards')
      .update({ status: 'active' })
      .eq('id', board_id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ board: updated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
