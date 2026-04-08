// 뱃지/업적 카드 컴포넌트
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export interface Badge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  earned: boolean;
  earnedDate?: string;
}

export const ALL_BADGES: Badge[] = [
  { id: 'first_sticker', emoji: '🌱', title: '첫 발걸음', description: '첫 스티커를 받았어요', earned: false },
  { id: 'first_board', emoji: '📋', title: '시작이 반', description: '첫 스티커판을 만들었어요', earned: false },
  { id: 'first_complete', emoji: '🏆', title: '첫 달성', description: '스티커판을 처음 완주했어요', earned: false },
  { id: 'streak_3', emoji: '🔥', title: '3일 연속', description: '3일 연속 스티커를 받았어요', earned: false },
  { id: 'streak_7', emoji: '💪', title: '일주일 꾸준히', description: '7일 연속 스티커를 받았어요', earned: false },
  { id: 'sticker_10', emoji: '⭐', title: '스티커 10개', description: '총 10개의 스티커를 모았어요', earned: false },
  { id: 'sticker_50', emoji: '🌟', title: '스티커 50개', description: '총 50개의 스티커를 모았어요', earned: false },
  { id: 'sticker_100', emoji: '💎', title: '스티커 100개', description: '총 100개의 스티커를 모았어요', earned: false },
  { id: 'praise_king', emoji: '👑', title: '칭찬왕', description: '한 달에 30개 이상 칭찬했어요', earned: false },
  { id: 'together_30', emoji: '💑', title: '함께 30일', description: '파트너와 30일 함께했어요', earned: false },
  { id: 'together_100', emoji: '💝', title: '함께 100일', description: '파트너와 100일 함께했어요', earned: false },
  { id: 'board_3', emoji: '📚', title: '도전 정신', description: '스티커판을 3개 이상 만들었어요', earned: false },
];

// 데모용: 일부 뱃지를 획득 상태로
export function getDemoBadges(): Badge[] {
  return ALL_BADGES.map(b => {
    if (['first_sticker', 'first_board', 'first_complete', 'streak_3', 'sticker_10', 'together_30'].includes(b.id)) {
      return { ...b, earned: true, earnedDate: '2026-03-15' };
    }
    return b;
  });
}

export default function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <View style={[styles.card, !badge.earned && styles.cardLocked]}>
      <Text style={[styles.emoji, !badge.earned && styles.emojiLocked]}>
        {badge.earned ? badge.emoji : '🔒'}
      </Text>
      <Text style={[styles.title, !badge.earned && styles.titleLocked]}>{badge.title}</Text>
      <Text style={styles.desc}>{badge.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: Colors.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLocked: {
    borderColor: Colors.border,
    backgroundColor: '#F8F8F8',
    opacity: 0.6,
  },
  emoji: { fontSize: 36 },
  emojiLocked: { fontSize: 28 },
  title: { fontSize: 14, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  titleLocked: { color: Colors.textLight },
  desc: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
});
