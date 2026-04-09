import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { StickerBoard, Sticker, Reward, Penalty } from '@/types/database';

interface BoardWithDetails extends StickerBoard {
  rewards?: Reward[];
  penalties?: Penalty[];
}

interface CreateBoardParams {
  title: string;
  collector_id: string;
  target_count: number;
  start_date: string;
  end_date: string;
  sticker_preset: string;
  sticker_image_url?: string | null;
  reward_description: string;
  reward_type: string;
  has_penalty: boolean;
  penalty_description?: string;
}

interface BoardState {
  boards: BoardWithDetails[];
  currentBoard: BoardWithDetails | null;
  stickers: Sticker[];
  isLoading: boolean;

  fetchBoards: () => Promise<void>;
  fetchBoardDetail: (boardId: string) => Promise<void>;
  createBoard: (params: CreateBoardParams) => Promise<{ success: boolean; boardId?: string; error?: string }>;
  acceptBoard: (boardId: string) => Promise<{ success: boolean; error?: string }>;
  giveSticker: (boardId: string, memo?: string) => Promise<{ success: boolean; goalAchieved?: boolean; error?: string }>;
  cancelBoard: (boardId: string) => Promise<void>;
  completeReward: (rewardId: string) => Promise<void>;
  completePenalty: (penaltyId: string) => Promise<void>;
  checkExpiredBoards: () => Promise<void>;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  currentBoard: null,
  stickers: [],
  isLoading: false,

  fetchBoards: async () => {
    set({ isLoading: true });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) { set({ isLoading: false }); return; }

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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return { success: false, error: '로그인이 필요합니다' };

    // 관계 조회
    const { data: rel } = await supabase
      .from('relationships')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'connected')
      .maybeSingle();

    if (!rel) return { success: false, error: '연결된 파트너가 없습니다' };

    const giverId = params.collector_id === session.user.id ? rel.partner_id : session.user.id;

    // 보드 생성
    const { data: board, error: boardError } = await supabase
      .from('sticker_boards')
      .insert({
        relationship_id: rel.id,
        creator_id: session.user.id,
        collector_id: params.collector_id,
        giver_id: giverId,
        title: params.title,
        target_count: params.target_count,
        current_count: 0,
        sticker_preset: params.sticker_preset,
        sticker_image_url: params.sticker_image_url || null,
        start_date: params.start_date,
        end_date: params.end_date,
        status: 'active', // 바로 활성화 (MVP 간소화)
        has_penalty: params.has_penalty,
      })
      .select()
      .single();

    if (boardError || !board) return { success: false, error: boardError?.message ?? '보드 생성 실패' };

    // 보상 생성
    await supabase.from('rewards').insert({
      board_id: board.id,
      description: params.reward_description,
      reward_type: params.reward_type || 'promise',
      status: 'waiting',
      provider_id: giverId,
    });

    // 패널티 생성
    if (params.has_penalty && params.penalty_description) {
      await supabase.from('penalties').insert({
        board_id: board.id,
        description: params.penalty_description,
        status: 'inactive',
        responsible_id: params.collector_id,
      });
    }

    await get().fetchBoards();
    return { success: true, boardId: board.id };
  },

  acceptBoard: async (boardId: string) => {
    const { error } = await supabase
      .from('sticker_boards')
      .update({ status: 'active' })
      .eq('id', boardId);

    if (error) return { success: false, error: error.message };
    await get().fetchBoards();
    return { success: true };
  },

  giveSticker: async (boardId: string, memo?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return { success: false, error: '로그인이 필요합니다' };

    // 보드 조회
    const { data: board } = await supabase
      .from('sticker_boards')
      .select('*')
      .eq('id', boardId)
      .single();

    if (!board) return { success: false, error: '스티커판을 찾을 수 없습니다' };
    if (board.status !== 'active') return { success: false, error: '활성 상태가 아닙니다' };
    if (board.giver_id !== session.user.id) return { success: false, error: '스티커를 줄 권한이 없습니다' };
    if (board.current_count >= board.target_count) return { success: false, error: '이미 목표 달성' };

    const newSequence = board.current_count + 1;

    // 스티커 추가
    const { error: stickerError } = await supabase.from('stickers').insert({
      board_id: boardId,
      giver_id: session.user.id,
      memo: memo || null,
      sequence: newSequence,
    });

    if (stickerError) return { success: false, error: stickerError.message };

    // 카운트 업데이트 + 목표 달성 체크
    const newCount = board.current_count + 1;
    const goalAchieved = newCount >= board.target_count;

    await supabase
      .from('sticker_boards')
      .update({
        current_count: newCount,
        ...(goalAchieved ? { status: 'success' } : {}),
      })
      .eq('id', boardId);

    // 목표 달성 시 보상 상태 변경
    if (goalAchieved) {
      await supabase
        .from('rewards')
        .update({ status: 'pending' })
        .eq('board_id', boardId)
        .eq('status', 'waiting');
    }

    await get().fetchBoardDetail(boardId);
    return { success: true, goalAchieved };
  },

  cancelBoard: async (boardId: string) => {
    await supabase
      .from('sticker_boards')
      .update({ status: 'cancelled' })
      .eq('id', boardId);
    await get().fetchBoards();
  },

  completeReward: async (rewardId: string) => {
    await supabase
      .from('rewards')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', rewardId);

    if (get().currentBoard) {
      await get().fetchBoardDetail(get().currentBoard!.id);
    }
  },

  completePenalty: async (penaltyId: string) => {
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
        const boardId = (board as { id: string }).id;
        await supabase.from('sticker_boards').update({ status: 'failed' }).eq('id', boardId);
        await supabase.from('penalties').update({ status: 'pending' }).eq('board_id', boardId).eq('status', 'inactive');
      }
      await get().fetchBoards();
    }
  },
}));
