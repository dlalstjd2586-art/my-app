import { create } from 'zustand';
import {
  DEMO_ACTIVE_BOARDS, DEMO_HISTORY_BOARDS,
  DEMO_USER, DEMO_PARTNER, DEMO_RELATIONSHIP,
  generateDemoStickers, type DemoBoardWithDetails,
} from '@/lib/demo-data';
import type { Sticker, Reward, Penalty } from '@/types/database';

interface DemoState {
  isDemoMode: boolean;
  // 보드 데이터 (추가/삭제 가능)
  activeBoards: DemoBoardWithDetails[];
  historyBoards: DemoBoardWithDetails[];

  enableDemo: () => void;
  disableDemo: () => void;
  addBoard: (board: DemoBoardWithDetails) => void;
  deleteBoard: (boardId: string) => void;
  getBoardById: (boardId: string) => DemoBoardWithDetails | null;
}

export const useDemoStore = create<DemoState>((set, get) => ({
  isDemoMode: false,
  activeBoards: [],
  historyBoards: [],

  enableDemo: () => set({
    isDemoMode: true,
    activeBoards: [...DEMO_ACTIVE_BOARDS],
    historyBoards: [...DEMO_HISTORY_BOARDS],
  }),

  disableDemo: () => set({
    isDemoMode: false,
    activeBoards: [],
    historyBoards: [],
  }),

  addBoard: (board) => set(state => ({
    activeBoards: [board, ...state.activeBoards],
  })),

  deleteBoard: (boardId) => set(state => ({
    activeBoards: state.activeBoards.filter(b => b.id !== boardId),
    historyBoards: state.historyBoards.filter(b => b.id !== boardId),
  })),

  getBoardById: (boardId) => {
    const { activeBoards, historyBoards } = get();
    return [...activeBoards, ...historyBoards].find(b => b.id === boardId) ?? null;
  },
}));
