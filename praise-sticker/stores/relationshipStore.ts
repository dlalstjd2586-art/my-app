import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Relationship, User } from '@/types/database';

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
      .single();

    if (!rel) {
      set({ relationship: null, partner: null, isLoading: false });
      return;
    }

    const { data: partnerData } = await supabase
      .from('users')
      .select('*')
      .eq('id', rel.partner_id)
      .single();

    set({
      relationship: rel,
      partner: partnerData ?? null,
      isLoading: false,
    });
  },

  createInviteCode: async () => {
    const { data, error } = await supabase.functions.invoke('create-invite');
    if (error || !data) return null;
    set({ inviteCode: data.code, inviteExpiresAt: data.expires_at });
    return data.code;
  },

  acceptInviteCode: async (code: string) => {
    const { data, error } = await supabase.functions.invoke('accept-invite', {
      body: { code },
    });

    if (error) {
      return { success: false, error: error.message ?? '연결에 실패했어요' };
    }

    // Refresh relationship
    await get().fetchRelationship();
    return { success: true };
  },

  reset: () => set({
    relationship: null,
    partner: null,
    inviteCode: null,
    inviteExpiresAt: null,
  }),
}));
