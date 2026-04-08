import { create } from 'zustand';

interface DemoState {
  isDemoMode: boolean;
  enableDemo: () => void;
  disableDemo: () => void;
}

// 데모 모드: Supabase 없이 가짜 데이터로 앱을 체험
export const useDemoStore = create<DemoState>((set) => ({
  isDemoMode: false,
  enableDemo: () => set({ isDemoMode: true }),
  disableDemo: () => set({ isDemoMode: false }),
}));
