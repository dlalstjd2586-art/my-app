// Supabase Edge Function: create-invite
// 초대코드 생성 (6자리, 24시간 유효)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동 문자 제외 (0,O,1,I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: '인증이 필요합니다' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if already has a connected relationship
    const { data: existingRel } = await supabase
      .from('relationships')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'connected')
      .single();

    if (existingRel) {
      return new Response(JSON.stringify({ error: '이미 연결된 파트너가 있습니다' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Expire existing active codes
    await supabase
      .from('invite_codes')
      .update({ status: 'expired' })
      .eq('creator_id', user.id)
      .eq('status', 'active');

    // Generate unique code (retry up to 5 times)
    let code = '';
    for (let i = 0; i < 5; i++) {
      code = generateCode();
      const { data: existing } = await supabase
        .from('invite_codes')
        .select('id')
        .eq('code', code)
        .eq('status', 'active')
        .single();
      if (!existing) break;
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('invite_codes')
      .insert({
        code,
        creator_id: user.id,
        expires_at: expiresAt,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ code: data.code, expires_at: data.expires_at }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
