import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/database';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isProfileComplete: boolean;

  setSession: (session: Session | null) => void;
  fetchProfile: () => Promise<void>;
  updateNickname: (nickname: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: true,
  isProfileComplete: false,

  setSession: (session) => set({ session }),

  fetchProfile: async () => {
    const { session } = get();
    if (!session?.user?.id) {
      set({ user: null, isProfileComplete: false, isLoading: false });
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error || !data) {
      set({ user: null, isProfileComplete: false, isLoading: false });
      return;
    }

    set({
      user: data,
      isProfileComplete: !!data.nickname,
      isLoading: false,
    });
  },

  updateNickname: async (nickname: string) => {
    const { session } = get();
    if (!session?.user?.id) return;

    // Upsert: create if not exists, update if exists
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: session.user.id,
        nickname,
        auth_provider: session.user.app_metadata?.provider ?? 'google',
      })
      .select()
      .single();

    if (!error && data) {
      set({ user: data, isProfileComplete: true });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, isProfileComplete: false });
  },

  initialize: async () => {
    set({ isLoading: true });

    const { data: { session } } = await supabase.auth.getSession();
    set({ session });

    if (session) {
      await get().fetchProfile();
    } else {
      set({ isLoading: false });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session });
      if (session) {
        await get().fetchProfile();
      } else {
        set({ user: null, isProfileComplete: false, isLoading: false });
      }
    });
  },
}));
