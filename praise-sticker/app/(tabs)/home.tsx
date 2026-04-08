import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, StickerPresets } from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';
import { useRelationshipStore } from '@/stores/relationshipStore';
import { useBoardStore } from '@/stores/boardStore';
import { useDemoStore } from '@/stores/demoStore';
import { DEMO_USER, DEMO_PARTNER, DEMO_ACTIVE_BOARDS, type DemoBoardWithDetails } from '@/lib/demo-data';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { partner } = useRelationshipStore();
  const { boards, isLoading, fetchBoards, checkExpiredBoards } = useBoardStore();
  const { isDemoMode } = useDemoStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isDemoMode) fetchBoards();
  }, [isDemoMode]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (!isDemoMode) {
      await checkExpiredBoards();
      await fetchBoards();
    }
    setRefreshing(false);
  };

  // 데모 모드면 가짜 데이터, 아니면 진짜 데이터
  const displayUser = isDemoMode ? DEMO_USER : user;
  const displayPartner = isDemoMode ? DEMO_PARTNER : partner;
  const displayBoards = isDemoMode ? DEMO_ACTIVE_BOARDS : boards;

  const activeBoards = displayBoards.filter((b: DemoBoardWithDetails) => b.status === 'active');
  const draftBoards = displayBoards.filter((b: DemoBoardWithDetails) => b.status === 'draft');

  const getDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getProgressPercent = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const getStickerEmoji = (preset: string) => {
    return StickerPresets.find(s => s.id === preset)?.emoji ?? '⭐';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Demo Banner */}
      {isDemoMode && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>데모 모드 - 가짜 데이터로 체험 중</Text>
        </View>
      )}

      {/* Partner Info */}
      <View style={styles.partnerCard}>
        <Text style={styles.partnerEmoji}>💑</Text>
        <View>
          <Text style={styles.partnerLabel}>나의 파트너</Text>
          <Text style={styles.partnerName}>{displayPartner?.nickname ?? '...'}</Text>
        </View>
      </View>

      {/* Draft Boards (needs acceptance) */}
      {draftBoards.map((board: DemoBoardWithDetails) => (
        <TouchableOpacity
          key={board.id}
          style={[styles.boardCard, styles.boardCardDraft]}
          onPress={() => router.push(`/board/${board.id}`)}
        >
          <View style={styles.draftBadge}>
            <Text style={styles.draftBadgeText}>수락 대기</Text>
          </View>
          <Text style={styles.boardTitle}>{board.title}</Text>
          <Text style={styles.boardMeta}>
            {getStickerEmoji(board.sticker_preset)} 목표 {board.target_count}개
          </Text>
        </TouchableOpacity>
      ))}

      {/* Active Boards */}
      {activeBoards.length > 0 ? (
        activeBoards.map((board: DemoBoardWithDetails) => {
          const daysLeft = getDaysLeft(board.end_date);
          const percent = getProgressPercent(board.current_count, board.target_count);

          return (
            <TouchableOpacity
              key={board.id}
              style={styles.boardCard}
              onPress={() => router.push(`/board/${board.id}`)}
            >
              <View style={styles.boardHeader}>
                <Text style={styles.boardTitle}>{board.title}</Text>
                <Text style={[styles.daysLeft, daysLeft <= 3 && styles.daysLeftUrgent]}>
                  D-{daysLeft > 0 ? daysLeft : 0}
                </Text>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${percent}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {getStickerEmoji(board.sticker_preset)} {board.current_count}/{board.target_count}
                </Text>
              </View>

              {board.rewards && board.rewards.length > 0 && (
                <Text style={styles.rewardPreview}>
                  🎁 {board.rewards[0].description}
                </Text>
              )}
            </TouchableOpacity>
          );
        })
      ) : draftBoards.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>아직 스티커판이 없어요</Text>
          <Text style={styles.emptySubtitle}>첫 스티커판을 만들어보세요!</Text>
        </View>
      ) : null}

      {/* Create Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/board/create')}
      >
        <Text style={styles.createButtonText}>+ 새 스티커판 만들기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  demoBanner: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  demoBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E65100',
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  partnerEmoji: {
    fontSize: 36,
  },
  partnerLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  boardCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  boardCardDraft: {
    borderColor: Colors.warning,
    borderStyle: 'dashed',
  },
  draftBadge: {
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  draftBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warning,
  },
  boardMeta: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  boardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  daysLeft: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  daysLeftUrgent: {
    color: Colors.error,
  },
  progressContainer: {
    gap: 6,
  },
  progressBar: {
    height: 10,
    backgroundColor: Colors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  rewardPreview: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
