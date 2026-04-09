import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Relationship, User } from '@/types/database';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

interface RelationshipState {
  relationship: Relationship | null;
  partner: User | null;
  isLoading: boolean;
  inviteCode: string | null;
  inviteExpiresAt: string | null;

  fetchRelationship: () => Promise<void>;
  createInviteCode: () => Promise<string | null>;
  acceptInviteCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  reset: () => void;
}

export const useRelationshipStore = create<RelationshipState>((set, get) => ({
  relationship: null,
  partner: null,
  isLoading: false,
  inviteCode: null,
  inviteExpiresAt: null,

  fetchRelationship: async () => {
    set({ isLoading: true });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      set({ isLoading: false });
      return;
    }

    const { data: rel } = await supabase
      .from('relationships')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'connected')
      .maybeSingle();

    if (!rel) {
      set({ relationship: null, partner: null, isLoading: false });
      return;
    }

    const relationship = rel as Relationship;

    const { data: partnerData } = await supabase
      .from('users')
      .select('*')
      .eq('id', relationship.partner_id)
      .maybeSingle();

    set({
      relationship,
      partner: (partnerData as User) ?? null,
      isLoading: false,
    });
  },

  createInviteCode: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return null;

    // 기존 active 코드 만료 처리
    await supabase
      .from('invite_codes')
      .update({ status: 'expired' })
      .eq('creator_id', session.user.id)
      .eq('status', 'active');

    // 새 코드 생성 (충돌 시 재시도)
    let code = '';
    for (let i = 0; i < 5; i++) {
      code = generateCode();
      const { data: existing } = await supabase
        .from('invite_codes')
        .select('id')
        .eq('code', code)
        .eq('status', 'active')
        .maybeSingle();
      if (!existing) break;
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('invite_codes')
      .insert({ code, creator_id: session.user.id, expires_at: expiresAt, status: 'active' })
      .select()
      .single();

    if (error || !data) return null;
    set({ inviteCode: data.code, inviteExpiresAt: data.expires_at });
    return data.code as string;
  },

  acceptInviteCode: async (code: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return { success: false, error: '로그인이 필요합니다' };

    // 코드 조회
    const { data: invite } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('status', 'active')
      .maybeSingle();

    if (!invite) return { success: false, error: '유효하지 않거나 만료된 코드입니다' };

    // 만료 체크
    if (new Date(invite.expires_at) < new Date()) {
      await supabase.from('invite_codes').update({ status: 'expired' }).eq('id', invite.id);
      return { success: false, error: '만료된 코드입니다' };
    }

    // 자기 코드 체크
    if (invite.creator_id === session.user.id) {
      return { success: false, error: '자신의 코드는 사용할 수 없습니다' };
    }

    // 이미 연결된 관계 체크
    const { data: existingRel } = await supabase
      .from('relationships')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('status', 'connected')
      .maybeSingle();

    if (existingRel) return { success: false, error: '이미 연결된 파트너가 있습니다' };

    const now = new Date().toISOString();

    // 양방향 관계 생성
    const { error: relError1 } = await supabase.from('relationships').insert({
      user_id: session.user.id,
      partner_id: invite.creator_id,
      status: 'connected',
      connected_at: now,
    });

    const { error: relError2 } = await supabase.from('relationships').insert({
      user_id: invite.creator_id,
      partner_id: session.user.id,
      status: 'connected',
      connected_at: now,
    });

    if (relError1 || relError2) {
      return { success: false, error: '관계 생성에 실패했습니다' };
    }

    // 코드 사용 처리
    await supabase.from('invite_codes').update({
      status: 'used', used_by: session.user.id, used_at: now,
    }).eq('id', invite.id);

    // 관계 새로고침
    await get().fetchRelationship();
    return { success: true };
  },

  reset: () => set({
    relationship: null, partner: null, inviteCode: null, inviteExpiresAt: null,
  }),
}));
