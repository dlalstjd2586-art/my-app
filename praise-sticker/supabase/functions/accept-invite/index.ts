// Supabase Edge Function: accept-invite
// 초대코드로 관계 연동 (트랜잭션: relationships 2건 + invite_code 업데이트)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { code } = await req.json();
    if (!code || typeof code !== 'string' || code.length !== 6) {
      return new Response(JSON.stringify({ error: '유효한 6자리 코드를 입력해주세요' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Use service role for cross-user operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: '인증이 필요합니다' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find the invite code
    const { data: invite } = await supabaseAdmin
      .from('invite_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('status', 'active')
      .single();

    if (!invite) {
      return new Response(JSON.stringify({ error: '유효하지 않거나 만료된 코드입니다' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check expiry
    if (new Date(invite.expires_at) < new Date()) {
      await supabaseAdmin.from('invite_codes').update({ status: 'expired' }).eq('id', invite.id);
      return new Response(JSON.stringify({ error: '만료된 코드입니다' }), {
        status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Can't use own code
    if (invite.creator_id === user.id) {
      return new Response(JSON.stringify({ error: '자신의 코드는 사용할 수 없습니다' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if either party already has a connection
    const { data: existingRel1 } = await supabaseAdmin
      .from('relationships').select('id').eq('user_id', user.id).eq('status', 'connected').single();
    const { data: existingRel2 } = await supabaseAdmin
      .from('relationships').select('id').eq('user_id', invite.creator_id).eq('status', 'connected').single();

    if (existingRel1 || existingRel2) {
      return new Response(JSON.stringify({ error: '이미 연결된 파트너가 있습니다' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();

    // Create bidirectional relationship
    const { error: relError1 } = await supabaseAdmin.from('relationships').insert({
      user_id: user.id,
      partner_id: invite.creator_id,
      status: 'connected',
      connected_at: now,
    });

    const { error: relError2 } = await supabaseAdmin.from('relationships').insert({
      user_id: invite.creator_id,
      partner_id: user.id,
      status: 'connected',
      connected_at: now,
    });

    if (relError1 || relError2) {
      throw new Error('관계 생성에 실패했습니다');
    }

    // Mark invite code as used
    await supabaseAdmin.from('invite_codes').update({
      status: 'used',
      used_by: user.id,
      used_at: now,
    }).eq('id', invite.id);

    // Get partner info
    const { data: partner } = await supabaseAdmin
      .from('users')
      .select('nickname, profile_image_url')
      .eq('id', invite.creator_id)
      .single();

    return new Response(JSON.stringify({
      success: true,
      partner: partner ?? { nickname: '파트너' },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
