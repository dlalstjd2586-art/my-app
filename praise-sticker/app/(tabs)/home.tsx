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

const BOARD_COLORS = ['#6C5CE7', '#FF6B6B', '#00B894', '#FDCB6E', '#E056A0', '#00D2D3'];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { partner } = useRelationshipStore();
  const { boards, fetchBoards, checkExpiredBoards } = useBoardStore();
  const { isDemoMode, activeBoards: demoBoards, deleteBoard } = useDemoStore();
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => { if (!isDemoMode) fetchBoards(); }, [isDemoMode]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (!isDemoMode) { await checkExpiredBoards(); await fetchBoards(); }
    setRefreshing(false);
  };

  const displayUser = isDemoMode ? DEMO_USER : user;
  const displayPartner = isDemoMode ? DEMO_PARTNER : partner;
  const displayBoards: DemoBoardWithDetails[] = isDemoMode ? demoBoards : (boards as DemoBoardWithDetails[]);

  const activeBoardsList = displayBoards.filter(b => b.status === 'active');
  const draftBoardsList = displayBoards.filter(b => b.status === 'draft');

  const getDaysLeft = (endDate: string) => Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const getPercent = (c: number, t: number) => Math.min(Math.round((c / t) * 100), 100);
  const getEmoji = (preset: string) => StickerPresets.find(s => s.id === preset)?.emoji ?? '⭐';
  const getColor = (id: string) => BOARD_COLORS[id.charCodeAt(id.length - 1) % BOARD_COLORS.length];

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>

        {isDemoMode && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>🔍 데모 모드 체험 중</Text>
          </View>
        )}

        {/* 파트너 카드 */}
        <View style={styles.partnerCard}>
          <View style={styles.partnerLeft}>
            <View style={styles.partnerAvatarMe}><Text style={styles.avatarText}>{displayUser?.nickname?.[0] ?? '?'}</Text></View>
            <View style={styles.partnerHeart}><Text style={{ fontSize: 14 }}>💜</Text></View>
            <View style={styles.partnerAvatarPartner}><Text style={styles.avatarText}>{displayPartner?.nickname?.[0] ?? '?'}</Text></View>
          </View>
          <View style={styles.partnerRight}>
            <Text style={styles.partnerNames}>{displayUser?.nickname} & {displayPartner?.nickname}</Text>
            <Text style={styles.partnerLabel}>진행 중 {activeBoardsList.length}개</Text>
          </View>
        </View>

        {/* 진행 중 보드 */}
        {activeBoardsList.map((board, idx) => {
          const daysLeft = getDaysLeft(board.end_date);
          const percent = getPercent(board.current_count, board.target_count);
          const color = getColor(board.id);

          return (
            <TouchableOpacity key={board.id} style={styles.boardCard} onPress={() => router.push(`/board/${board.id}`)} activeOpacity={0.7}>
              <View style={[styles.boardColorBar, { backgroundColor: color }]} />
              <View style={styles.boardBody}>
                <View style={styles.boardTop}>
                  <View style={styles.boardTitleRow}>
                    <Text style={styles.boardEmoji}>{getEmoji(board.sticker_preset)}</Text>
                    <Text style={styles.boardTitle} numberOfLines={1}>{board.title}</Text>
                  </View>
                  <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={(e) => { e.stopPropagation(); setDeleteTarget({ id: board.id, title: board.title }); }}>
                    <Text style={styles.deleteIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.progressRow}>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${percent}%`, backgroundColor: color }]} />
                  </View>
                  <Text style={[styles.progressPercent, { color }]}>{percent}%</Text>
                </View>

                <View style={styles.boardBottom}>
                  <Text style={styles.boardCount}>{board.current_count}/{board.target_count}개</Text>
                  <Text style={[styles.boardDday, daysLeft <= 3 && { color: Colors.error }]}>
                    D-{Math.max(daysLeft, 0)}
                  </Text>
                </View>

                {board.rewards?.[0] && (
                  <Text style={styles.boardReward} numberOfLines={1}>🎁 {board.rewards[0].description}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* 대기 중 보드 */}
        {draftBoardsList.map(board => (
          <TouchableOpacity key={board.id} style={[styles.boardCard, styles.draftCard]}
            onPress={() => router.push(`/board/${board.id}`)}>
            <View style={[styles.boardColorBar, { backgroundColor: Colors.warning }]} />
            <View style={styles.boardBody}>
              <View style={styles.draftBadge}><Text style={styles.draftBadgeText}>수락 대기</Text></View>
              <Text style={styles.boardTitle}>{board.title}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* 빈 상태 */}
        {activeBoardsList.length === 0 && draftBoardsList.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌟</Text>
            <Text style={styles.emptyTitle}>아직 스티커판이 없어요</Text>
            <Text style={styles.emptySubtitle}>아래 버튼을 눌러 첫 스티커판을 만들어보세요!</Text>
          </View>
        )}

        {/* 만들기 버튼 */}
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/board/create')} activeOpacity={0.8}>
          <Text style={styles.createBtnText}>+ 새 스티커판 만들기</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmModal
        visible={!!deleteTarget} title="스티커판 삭제"
        message={`"${deleteTarget?.title}" 스티커판을 삭제할까요?`}
        confirmText="삭제" confirmColor={Colors.error}
        onConfirm={() => { if (deleteTarget) { deleteBoard(deleteTarget.id); setDeleteTarget(null); } }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40, gap: 14 },
  demoBanner: { backgroundColor: Colors.primaryLight, borderRadius: 12, paddingVertical: 8, alignItems: 'center' },
  demoBannerText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // Partner
  partnerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: Colors.surface, borderRadius: 20, padding: 18,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 3,
  },
  partnerLeft: { flexDirection: 'row', alignItems: 'center' },
  partnerAvatarMe: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  partnerAvatarPartner: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', marginLeft: -12 },
  partnerHeart: { zIndex: 1, marginHorizontal: -6 },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  partnerRight: { flex: 1, gap: 2 },
  partnerNames: { fontSize: 17, fontWeight: '800', color: Colors.text },
  partnerLabel: { fontSize: 13, color: Colors.textSecondary },

  // Board Card
  boardCard: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  boardColorBar: { width: 5 },
  boardBody: { flex: 1, padding: 16, gap: 10 },
  boardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  boardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  boardEmoji: { fontSize: 22 },
  boardTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, flex: 1 },
  deleteIcon: { fontSize: 16, color: Colors.textLight, padding: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBarBg: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressPercent: { fontSize: 14, fontWeight: '800', width: 40, textAlign: 'right' },
  boardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  boardCount: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  boardDday: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  boardReward: { fontSize: 12, color: Colors.textLight },

  // Draft
  draftCard: { opacity: 0.8 },
  draftBadge: { backgroundColor: Colors.goldLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  draftBadgeText: { fontSize: 11, fontWeight: '700', color: '#D4A017' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyEmoji: { fontSize: 56, marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

  // Create
  createBtn: {
    backgroundColor: Colors.primary, borderRadius: 18, paddingVertical: 18, alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  createBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
