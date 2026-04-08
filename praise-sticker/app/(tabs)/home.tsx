import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, StickerPresets } from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';
import { useRelationshipStore } from '@/stores/relationshipStore';
import { useBoardStore } from '@/stores/boardStore';
import { useDemoStore } from '@/stores/demoStore';
import { DEMO_USER, DEMO_PARTNER, type DemoBoardWithDetails } from '@/lib/demo-data';
import ConfirmModal from '@/components/ConfirmModal';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { partner } = useRelationshipStore();
  const { boards, isLoading, fetchBoards, checkExpiredBoards } = useBoardStore();
  const { isDemoMode, activeBoards: demoBoards, deleteBoard } = useDemoStore();
  const [refreshing, setRefreshing] = useState(false);

  // 삭제 모달 상태
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

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

  const displayUser = isDemoMode ? DEMO_USER : user;
  const displayPartner = isDemoMode ? DEMO_PARTNER : partner;
  const displayBoards: DemoBoardWithDetails[] = isDemoMode ? demoBoards : (boards as DemoBoardWithDetails[]);

  const activeBoardsList = displayBoards.filter(b => b.status === 'active');
  const draftBoardsList = displayBoards.filter(b => b.status === 'draft');

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (isDemoMode) {
      deleteBoard(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  const getDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getProgressPercent = (current: number, target: number) =>
    Math.min(Math.round((current / target) * 100), 100);

  const getStickerEmoji = (preset: string) =>
    StickerPresets.find(s => s.id === preset)?.emoji ?? '⭐';

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isDemoMode && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>데모 모드 - 가짜 데이터로 체험 중</Text>
          </View>
        )}

        {/* Partner */}
        <View style={styles.partnerCard}>
          <Text style={styles.partnerEmoji}>💑</Text>
          <View>
            <Text style={styles.partnerLabel}>나의 파트너</Text>
            <Text style={styles.partnerName}>{displayPartner?.nickname ?? '...'}</Text>
          </View>
        </View>

        {/* Draft Boards */}
        {draftBoardsList.map(board => (
          <View key={board.id} style={[styles.boardCard, styles.boardCardDraft]}>
            <TouchableOpacity style={styles.boardCardContent} onPress={() => router.push(`/board/${board.id}`)}>
              <View style={styles.draftBadge}>
                <Text style={styles.draftBadgeText}>수락 대기</Text>
              </View>
              <Text style={styles.boardTitle}>{board.title}</Text>
              <Text style={styles.boardMeta}>
                {getStickerEmoji(board.sticker_preset)} 목표 {board.target_count}개
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteTarget({ id: board.id, title: board.title })}>
              <Text style={styles.deleteBtnText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Active Boards */}
        {activeBoardsList.length > 0 ? (
          activeBoardsList.map(board => {
            const daysLeft = getDaysLeft(board.end_date);
            const percent = getProgressPercent(board.current_count, board.target_count);

            return (
              <View key={board.id} style={styles.boardCard}>
                <TouchableOpacity style={styles.boardCardContent} onPress={() => router.push(`/board/${board.id}`)}>
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
                    <Text style={styles.rewardPreview}>🎁 {board.rewards[0].description}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteTarget({ id: board.id, title: board.title })}>
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            );
          })
        ) : draftBoardsList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>아직 스티커판이 없어요</Text>
            <Text style={styles.emptySubtitle}>첫 스티커판을 만들어보세요!</Text>
          </View>
        ) : null}

        {/* Create Button */}
        <TouchableOpacity style={styles.createButton} onPress={() => router.push('/board/create')}>
          <Text style={styles.createButtonText}>+ 새 스티커판 만들기</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        visible={!!deleteTarget}
        title="스티커판 삭제"
        message={`"${deleteTarget?.title}" 스티커판을 삭제할까요?\n삭제하면 되돌릴 수 없어요.`}
        confirmText="삭제"
        confirmColor={Colors.error}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  demoBanner: { backgroundColor: '#FFF3E0', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' },
  demoBannerText: { fontSize: 13, fontWeight: '600', color: '#E65100' },
  partnerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryLight, borderRadius: 16, padding: 16, gap: 12 },
  partnerEmoji: { fontSize: 36 },
  partnerLabel: { fontSize: 12, color: Colors.textSecondary },
  partnerName: { fontSize: 18, fontWeight: '700', color: Colors.text },

  boardCard: {
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'center', overflow: 'hidden',
  },
  boardCardDraft: { borderColor: Colors.warning, borderStyle: 'dashed' },
  boardCardContent: { flex: 1, padding: 20, gap: 12 },
  deleteBtn: { paddingHorizontal: 16, paddingVertical: 20, justifyContent: 'center' },
  deleteBtnText: { fontSize: 20 },

  draftBadge: { backgroundColor: Colors.secondaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  draftBadgeText: { fontSize: 12, fontWeight: '600', color: Colors.warning },
  boardMeta: { fontSize: 14, color: Colors.textSecondary },
  boardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  boardTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, flex: 1 },
  daysLeft: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  daysLeftUrgent: { color: Colors.error },
  progressContainer: { gap: 6 },
  progressBar: { height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 5 },
  progressText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  rewardPreview: { fontSize: 13, color: Colors.textSecondary },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary },
  createButton: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  createButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
