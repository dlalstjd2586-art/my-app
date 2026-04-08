import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { StickerBoard, Sticker, Reward, Penalty } from '@/types/database';

interface BoardWithDetails extends StickerBoard {
  rewards?: Reward[];
  penalties?: Penalty[];
}

interface BoardState {
  boards: BoardWithDetails[];
  currentBoard: BoardWithDetails | null;
  stickers: Sticker[];
  isLoading: boolean;

  fetchBoards: () => Promise<void>;
  fetchBoardDetail: (boardId: string) => Promise<void>;
  createBoard: (params: CreateBoardParams) => Promise<{ success: boolean; error?: string }>;
  acceptBoard: (boardId: string) => Promise<{ success: boolean; error?: string }>;
  giveSticker: (boardId: string, memo?: string) => Promise<{ success: boolean; goalAchieved?: boolean; error?: string }>;
  completeReward: (rewardId: string) => Promise<void>;
  completePenalty: (penaltyId: string) => Promise<void>;
  checkExpiredBoards: () => Promise<void>;
}

interface CreateBoardParams {
  title: string;
  collector_id: string;
  target_count: number;
  start_date: string;
  end_date: string;
  sticker_preset: string;
  reward_description: string;
  reward_type: string;
  has_penalty: boolean;
  penalty_description?: string;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  currentBoard: null,
  stickers: [],
  isLoading: false,

  fetchBoards: async () => {
    set({ isLoading: true });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      set({ isLoading: false });
      return;
    }

    const { data } = await supabase
      .from('sticker_boards')
      .select('*, rewards(*), penalties(*)')
      .or(`collector_id.eq.${session.user.id},giver_id.eq.${session.user.id}`)
      .in('status', ['draft', 'active'])
      .order('created_at', { ascending: false });

    set({ boards: (data as BoardWithDetails[]) ?? [], isLoading: false });
  },

  fetchBoardDetail: async (boardId: string) => {
    set({ isLoading: true });

    const { data: board } = await supabase
      .from('sticker_boards')
      .select('*, rewards(*), penalties(*)')
      .eq('id', boardId)
      .single();

    const { data: stickers } = await supabase
      .from('stickers')
      .select('*')
      .eq('board_id', boardId)
      .order('sequence', { ascending: true });

    set({
      currentBoard: (board as BoardWithDetails) ?? null,
      stickers: (stickers as Sticker[]) ?? [],
      isLoading: false,
    });
  },

  createBoard: async (params) => {
    const { data, error } = await supabase.functions.invoke('create-board', {
      body: params,
    });

    if (error) {
      return { success: false, error: error.message ?? '생성에 실패했어요' };
    }

    await get().fetchBoards();
    return { success: true };
  },

  acceptBoard: async (boardId: string) => {
    const { data, error } = await supabase.functions.invoke('accept-board', {
      body: { board_id: boardId },
    });

    if (error) {
      return { success: false, error: error.message ?? '수락에 실패했어요' };
    }

    await get().fetchBoards();
    return { success: true };
  },

  giveSticker: async (boardId: string, memo?: string) => {
    const { data, error } = await supabase.functions.invoke('give-sticker', {
      body: { board_id: boardId, memo },
    });

    if (error) {
      return { success: false, error: error.message ?? '스티커 부여에 실패했어요' };
    }

    await get().fetchBoardDetail(boardId);
    return { success: true, goalAchieved: data?.goal_achieved ?? false };
  },

  completeReward: async (rewardId: string) => {
    const { error } = await supabase.functions.invoke('complete-reward', {
      body: { reward_id: rewardId },
    });

    if (!error && get().currentBoard) {
      await get().fetchBoardDetail(get().currentBoard!.id);
    }
  },

  completePenalty: async (penaltyId: string) => {
    // Direct update via client (penalty completion)
    await supabase
      .from('penalties')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', penaltyId);

    if (get().currentBoard) {
      await get().fetchBoardDetail(get().currentBoard!.id);
    }
  },

  checkExpiredBoards: async () => {
    const today = new Date().toISOString().split('T')[0];

    const { data: expiredBoards } = await supabase
      .from('sticker_boards')
      .select('id')
      .eq('status', 'active')
      .lt('end_date', today);

    if (expiredBoards && expiredBoards.length > 0) {
      for (const board of expiredBoards) {
        await supabase
          .from('sticker_boards')
          .update({ status: 'failed' })
          .eq('id', (board as { id: string }).id);

        await supabase
          .from('penalties')
          .update({ status: 'pending' })
          .eq('board_id', (board as { id: string }).id)
          .eq('status', 'inactive');
      }

      await get().fetchBoards();
    }
  },
}));
