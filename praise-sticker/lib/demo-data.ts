// 데모 모드용 가짜 데이터
// Supabase 연결 없이 앱 화면을 미리 볼 수 있습니다

import type { User, Relationship, StickerBoard, Sticker, Reward, Penalty } from '@/types/database';

export const DEMO_USER: User = {
  id: 'demo-user-1',
  nickname: '민수',
  profile_image_url: null,
  auth_provider: 'demo',
  push_token: null,
  notification_sticker: true,
  notification_expiry: true,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-04-08T00:00:00Z',
  deleted_at: null,
};

export const DEMO_PARTNER: User = {
  id: 'demo-user-2',
  nickname: '지은',
  profile_image_url: null,
  auth_provider: 'demo',
  push_token: null,
  notification_sticker: true,
  notification_expiry: true,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-04-08T00:00:00Z',
  deleted_at: null,
};

export const DEMO_RELATIONSHIP: Relationship = {
  id: 'demo-rel-1',
  user_id: DEMO_USER.id,
  partner_id: DEMO_PARTNER.id,
  status: 'connected',
  nickname_for_partner: null,
  connected_at: '2026-03-01T00:00:00Z',
  ended_at: null,
  created_at: '2026-03-01T00:00:00Z',
};

// 진행 중인 스티커판
export const DEMO_BOARD_ACTIVE: StickerBoard = {
  id: 'demo-board-1',
  relationship_id: DEMO_RELATIONSHIP.id,
  creator_id: DEMO_USER.id,
  collector_id: DEMO_PARTNER.id,
  giver_id: DEMO_USER.id,
  title: '지은이 운동 챌린지',
  target_count: 20,
  current_count: 13,
  sticker_image_url: null,
  sticker_preset: 'star_gold',
  start_date: '2026-03-15',
  end_date: '2026-04-20',
  status: 'active',
  has_penalty: true,
  created_at: '2026-03-15T00:00:00Z',
  updated_at: '2026-04-08T00:00:00Z',
};

export const DEMO_REWARD_ACTIVE: Reward = {
  id: 'demo-reward-1',
  board_id: DEMO_BOARD_ACTIVE.id,
  description: '청담 오마카세 가기',
  reward_type: 'promise',
  reward_data: null,
  status: 'waiting',
  provider_id: DEMO_USER.id,
  completed_at: null,
  proof_image_url: null,
  created_at: '2026-03-15T00:00:00Z',
  updated_at: '2026-03-15T00:00:00Z',
};

export const DEMO_PENALTY_ACTIVE: Penalty = {
  id: 'demo-penalty-1',
  board_id: DEMO_BOARD_ACTIVE.id,
  description: '민수에게 치킨 쏘기',
  status: 'inactive',
  responsible_id: DEMO_PARTNER.id,
  completed_at: null,
  proof_image_url: null,
  created_at: '2026-03-15T00:00:00Z',
  updated_at: '2026-03-15T00:00:00Z',
};

// 수락 대기 중인 스티커판
export const DEMO_BOARD_DRAFT: StickerBoard = {
  id: 'demo-board-2',
  relationship_id: DEMO_RELATIONSHIP.id,
  creator_id: DEMO_PARTNER.id,
  collector_id: DEMO_USER.id,
  giver_id: DEMO_PARTNER.id,
  title: '민수 독서 챌린지',
  target_count: 10,
  current_count: 0,
  sticker_image_url: null,
  sticker_preset: 'heart_red',
  start_date: '2026-04-08',
  end_date: '2026-05-08',
  status: 'draft',
  has_penalty: false,
  created_at: '2026-04-08T00:00:00Z',
  updated_at: '2026-04-08T00:00:00Z',
};

export const DEMO_REWARD_DRAFT: Reward = {
  id: 'demo-reward-2',
  board_id: DEMO_BOARD_DRAFT.id,
  description: '원하는 책 3권 사주기',
  reward_type: 'promise',
  reward_data: null,
  status: 'waiting',
  provider_id: DEMO_PARTNER.id,
  completed_at: null,
  proof_image_url: null,
  created_at: '2026-04-08T00:00:00Z',
  updated_at: '2026-04-08T00:00:00Z',
};

// 성공한 과거 스티커판
export const DEMO_BOARD_SUCCESS: StickerBoard = {
  id: 'demo-board-3',
  relationship_id: DEMO_RELATIONSHIP.id,
  creator_id: DEMO_USER.id,
  collector_id: DEMO_PARTNER.id,
  giver_id: DEMO_USER.id,
  title: '지은이 물 2L 마시기',
  target_count: 14,
  current_count: 14,
  sticker_image_url: null,
  sticker_preset: 'thumbs_up',
  start_date: '2026-02-01',
  end_date: '2026-02-28',
  status: 'success',
  has_penalty: false,
  created_at: '2026-02-01T00:00:00Z',
  updated_at: '2026-02-25T00:00:00Z',
};

export const DEMO_REWARD_SUCCESS: Reward = {
  id: 'demo-reward-3',
  board_id: DEMO_BOARD_SUCCESS.id,
  description: '네일아트 해주기',
  reward_type: 'promise',
  reward_data: null,
  status: 'completed',
  provider_id: DEMO_USER.id,
  completed_at: '2026-02-26T00:00:00Z',
  proof_image_url: null,
  created_at: '2026-02-01T00:00:00Z',
  updated_at: '2026-02-26T00:00:00Z',
};

// 실패한 과거 스티커판
export const DEMO_BOARD_FAILED: StickerBoard = {
  id: 'demo-board-4',
  relationship_id: DEMO_RELATIONSHIP.id,
  creator_id: DEMO_USER.id,
  collector_id: DEMO_USER.id,
  giver_id: DEMO_PARTNER.id,
  title: '민수 금연 챌린지',
  target_count: 30,
  current_count: 18,
  sticker_image_url: null,
  sticker_preset: 'fire',
  start_date: '2026-01-01',
  end_date: '2026-01-31',
  status: 'failed',
  has_penalty: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-31T00:00:00Z',
};

export const DEMO_PENALTY_FAILED: Penalty = {
  id: 'demo-penalty-2',
  board_id: DEMO_BOARD_FAILED.id,
  description: '지은이에게 스타벅스 상품권 쏘기',
  status: 'completed',
  responsible_id: DEMO_USER.id,
  completed_at: '2026-02-02T00:00:00Z',
  proof_image_url: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-02T00:00:00Z',
};

// 스티커 목록 (진행 중 보드용)
export function generateDemoStickers(boardId: string, count: number): Sticker[] {
  const memos = [
    '오늘 5km 뛰었대! 대단해',
    '필라테스 다녀옴',
    '아침에 홈트 30분!',
    '퇴근 후 헬스장 갔다왔대',
    '비 오는데도 운동했어',
    null,
    '오늘도 열심히!',
    null,
    '주말에도 안 빠졌어',
    '러닝 새 기록 달성!',
    null,
    '요가 1시간 완료',
    '수영 배우기 시작!',
  ];

  const stickers: Sticker[] = [];
  const startDate = new Date('2026-03-16');

  for (let i = 1; i <= count; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + Math.floor((i - 1) * 1.7));

    stickers.push({
      id: `demo-sticker-${boardId}-${i}`,
      board_id: boardId,
      giver_id: DEMO_USER.id,
      memo: memos[(i - 1) % memos.length],
      sequence: i,
      created_at: date.toISOString(),
    });
  }

  return stickers;
}

// 모든 보드 (보상/패널티 포함)
export interface DemoBoardWithDetails extends StickerBoard {
  rewards?: Reward[];
  penalties?: Penalty[];
}

export const DEMO_ACTIVE_BOARDS: DemoBoardWithDetails[] = [
  { ...DEMO_BOARD_ACTIVE, rewards: [DEMO_REWARD_ACTIVE], penalties: [DEMO_PENALTY_ACTIVE] },
  { ...DEMO_BOARD_DRAFT, rewards: [DEMO_REWARD_DRAFT], penalties: [] },
];

export const DEMO_HISTORY_BOARDS: DemoBoardWithDetails[] = [
  { ...DEMO_BOARD_SUCCESS, rewards: [DEMO_REWARD_SUCCESS], penalties: [] },
  { ...DEMO_BOARD_FAILED, rewards: [], penalties: [DEMO_PENALTY_FAILED] },
];
