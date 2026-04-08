export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type InviteCodeStatus = 'active' | 'used' | 'expired';
export type RelationshipStatus = 'pending' | 'connected' | 'ended';
export type BoardStatus = 'draft' | 'active' | 'success' | 'failed' | 'cancelled';
export type RewardStatus = 'waiting' | 'pending' | 'completed' | 'skipped';
export type PenaltyStatus = 'inactive' | 'pending' | 'completed' | 'skipped';
export type RewardType = 'promise' | 'link' | 'gifticon_code';
export type NotificationType =
  | 'invite_received'
  | 'relationship_connected'
  | 'board_created'
  | 'board_accepted'
  | 'sticker_received'
  | 'goal_achieved'
  | 'board_expiring_soon'
  | 'board_expired'
  | 'reward_pending'
  | 'penalty_pending';

export interface User {
  id: string;
  nickname: string;
  profile_image_url: string | null;
  auth_provider: string;
  push_token: string | null;
  notification_sticker: boolean;
  notification_expiry: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface InviteCode {
  id: string;
  code: string;
  creator_id: string;
  expires_at: string;
  used_by: string | null;
  used_at: string | null;
  status: InviteCodeStatus;
  created_at: string;
}

export interface Relationship {
  id: string;
  user_id: string;
  partner_id: string;
  status: RelationshipStatus;
  nickname_for_partner: string | null;
  connected_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface StickerBoard {
  id: string;
  relationship_id: string;
  creator_id: string;
  collector_id: string;
  giver_id: string;
  title: string;
  target_count: number;
  current_count: number;
  sticker_image_url: string | null;
  sticker_preset: string;
  start_date: string;
  end_date: string;
  status: BoardStatus;
  has_penalty: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sticker {
  id: string;
  board_id: string;
  giver_id: string;
  memo: string | null;
  sequence: number;
  created_at: string;
}

export interface Reward {
  id: string;
  board_id: string;
  description: string;
  reward_type: RewardType;
  reward_data: string | null;
  status: RewardStatus;
  provider_id: string;
  completed_at: string | null;
  proof_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Penalty {
  id: string;
  board_id: string;
  description: string;
  status: PenaltyStatus;
  responsible_id: string;
  completed_at: string | null;
  proof_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Json;
  is_read: boolean;
  created_at: string;
}
