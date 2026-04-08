import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, StickerPresets } from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';
import { useBoardStore } from '@/stores/boardStore';
import { useDemoStore } from '@/stores/demoStore';
import {
  DEMO_USER, DEMO_ACTIVE_BOARDS, DEMO_HISTORY_BOARDS,
  generateDemoStickers, type DemoBoardWithDetails,
} from '@/lib/demo-data';
import type { Sticker, Reward, Penalty } from '@/types/database';

export default function BoardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { currentBoard, stickers, isLoading, fetchBoardDetail, acceptBoard, giveSticker, completeReward, completePenalty } = useBoardStore();
  const { isDemoMode } = useDemoStore();

  const [showStickerSheet, setShowStickerSheet] = useState(false);
  const [memo, setMemo] = useState('');
  const [isGiving, setIsGiving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // 데모 모드: 가짜 데이터에서 보드 찾기
  const [demoBoard, setDemoBoard] = useState<DemoBoardWithDetails | null>(null);
  const [demoStickers, setDemoStickers] = useState<Sticker[]>([]);

  useEffect(() => {
    if (isDemoMode && id) {
      const allBoards = [...DEMO_ACTIVE_BOARDS, ...DEMO_HISTORY_BOARDS];
      const found = allBoards.find(b => b.id === id) ?? null;
      setDemoBoard(found);
      if (found) {
        setDemoStickers(generateDemoStickers(found.id, found.current_count));
      }
    } else if (id) {
      fetchBoardDetail(id);
    }
  }, [id, isDemoMode]);

  const board = isDemoMode ? demoBoard : currentBoard;
  const displayStickers = isDemoMode ? demoStickers : stickers;
  const displayUser = isDemoMode ? DEMO_USER : user;

  if (!board) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  const isGiver = board.giver_id === displayUser?.id;
  const isDraft = board.status === 'draft';
  const isActive = board.status === 'active';
  const isSuccess = board.status === 'success';
  const isFailed = board.status === 'failed';
  const canAccept = isDraft && board.creator_id !== displayUser?.id;

  const stickerEmoji = StickerPresets.find(s => s.id === board.sticker_preset)?.emoji ?? '⭐';
  const percent = Math.min(Math.round((board.current_count / board.target_count) * 100), 100);
  const daysLeft = Math.ceil(
    (new Date(board.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const reward: Reward | undefined = (board as DemoBoardWithDetails).rewards?.[0];
  const penalty: Penalty | undefined = (board as DemoBoardWithDetails).penalties?.[0];

  const handleAccept = async () => {
    if (isDemoMode) {
      Alert.alert('데모 모드', '데모 모드에서는 수락이 자동 처리됩니다!');
      if (demoBoard) setDemoBoard({ ...demoBoard, status: 'active' });
      return;
    }
    const result = await acceptBoard(board.id);
    if (result.success) fetchBoardDetail(board.id);
    else Alert.alert('오류', result.error);
  };

  const handleGiveSticker = async () => {
    if (isDemoMode) {
      // 데모: 스티커 추가 시뮬레이션
      setIsGiving(true);
      await new Promise(r => setTimeout(r, 500));
      const newCount = board.current_count + 1;
      const goalAchieved = newCount >= board.target_count;

      const newSticker: Sticker = {
        id: `demo-new-${newCount}`,
        board_id: board.id,
        giver_id: DEMO_USER.id,
        memo: memo.trim() || null,
        sequence: newCount,
        created_at: new Date().toISOString(),
      };

      setDemoStickers(prev => [...prev, newSticker]);
      setDemoBoard(prev => prev ? { ...prev, current_count: newCount, status: goalAchieved ? 'success' : prev.status } : prev);

      setIsGiving(false);
      setShowStickerSheet(false);
      setMemo('');

      if (goalAchieved) setShowCelebration(true);
      return;
    }

    setIsGiving(true);
    const result = await giveSticker(board.id, memo.trim() || undefined);
    setIsGiving(false);
    setShowStickerSheet(false);
    setMemo('');

    if (result.success && result.goalAchieved) setShowCelebration(true);
    else if (!result.success) Alert.alert('오류', result.error);
  };

  const handleCompleteReward = () => {
    if (!reward) return;
    Alert.alert('보상 완료', '보상을 이행했나요?', [
      { text: '아직이요', style: 'cancel' },
      {
        text: '완료!',
        onPress: () => {
          if (isDemoMode) {
            Alert.alert('축하해요!', '보상이 완료 처리되었습니다');
          } else {
            completeReward(reward.id);
          }
        },
      },
    ]);
  };

  // Build sticker grid
  const gridItems = [];
  for (let i = 1; i <= board.target_count; i++) {
    const sticker = displayStickers.find(s => s.sequence === i);
    gridItems.push({ index: i, filled: !!sticker, memo: sticker?.memo });
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => !isDemoMode && fetchBoardDetail(board.id)} />}
      >
        {/* Status Banner */}
        {isDraft && (
          <View style={styles.draftBanner}>
            <Text style={styles.draftBannerText}>
              {canAccept ? '상대방이 스티커판을 만들었어요!' : '상대방의 수락을 기다리고 있어요'}
            </Text>
            {canAccept && (
              <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
                <Text style={styles.acceptButtonText}>수락하기</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isSuccess && (
          <View style={[styles.statusBanner, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.statusBannerEmoji}>🎉</Text>
            <Text style={[styles.statusBannerText, { color: Colors.success }]}>목표 달성!</Text>
          </View>
        )}

        {isFailed && (
          <View style={[styles.statusBanner, { backgroundColor: '#FFEBEE' }]}>
            <Text style={styles.statusBannerEmoji}>😢</Text>
            <Text style={[styles.statusBannerText, { color: Colors.error }]}>기간 만료</Text>
          </View>
        )}

        {/* Progress */}
        {!isDraft && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressCount}>
                {stickerEmoji} {board.current_count}/{board.target_count}
              </Text>
              {isActive && (
                <Text style={[styles.daysLeftText, daysLeft <= 3 && { color: Colors.error }]}>
                  D-{Math.max(daysLeft, 0)}
                </Text>
              )}
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>
            <Text style={styles.percentText}>{percent}% 달성</Text>
          </View>
        )}

        {/* Sticker Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.grid}>
            {gridItems.map(item => (
              <View
                key={item.index}
                style={[styles.gridCell, item.filled && styles.gridCellFilled]}
              >
                <Text style={styles.gridCellText}>
                  {item.filled ? stickerEmoji : item.index}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Reward & Penalty Info */}
        <View style={styles.infoSection}>
          {reward && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>🎁 성공 보상</Text>
              <Text style={styles.infoValue}>{reward.description}</Text>
              {reward.status === 'pending' && (
                <TouchableOpacity style={styles.completeButton} onPress={handleCompleteReward}>
                  <Text style={styles.completeButtonText}>보상 완료 확인</Text>
                </TouchableOpacity>
              )}
              {reward.status === 'completed' && (
                <Text style={styles.completedBadge}>✅ 이행 완료</Text>
              )}
            </View>
          )}

          {penalty && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>⚡ 실패 패널티</Text>
              <Text style={styles.infoValue}>{penalty.description}</Text>
              {penalty.status === 'pending' && (
                <TouchableOpacity
                  style={[styles.completeButton, { backgroundColor: Colors.warning }]}
                  onPress={() => {
                    Alert.alert('패널티 완료', '패널티를 이행했나요?', [
                      { text: '아직이요', style: 'cancel' },
                      { text: '완료!', onPress: () => isDemoMode ? Alert.alert('완료!', '패널티가 이행되었습니다') : completePenalty(penalty.id) },
                    ]);
                  }}
                >
                  <Text style={styles.completeButtonText}>패널티 완료 확인</Text>
                </TouchableOpacity>
              )}
              {penalty.status === 'completed' && (
                <Text style={styles.completedBadge}>✅ 이행 완료</Text>
              )}
            </View>
          )}
        </View>

        {/* Recent Sticker Log */}
        {displayStickers.length > 0 && (
          <View style={styles.logSection}>
            <Text style={styles.logTitle}>최근 기록</Text>
            {displayStickers.slice(-5).reverse().map(s => (
              <View key={s.id} style={styles.logItem}>
                <Text style={styles.logEmoji}>{stickerEmoji}</Text>
                <View style={styles.logContent}>
                  <Text style={styles.logDate}>
                    {new Date(s.created_at).toLocaleDateString('ko-KR')} #{s.sequence}
                  </Text>
                  {s.memo && <Text style={styles.logMemo}>{s.memo}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Give Sticker FAB */}
      {(isActive || (isDemoMode && board.status === 'active')) && isGiver && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowStickerSheet(true)}
        >
          <Text style={styles.fabText}>{stickerEmoji} 스티커 주기</Text>
        </TouchableOpacity>
      )}

      {/* Give Sticker Bottom Sheet */}
      <Modal visible={showStickerSheet} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>스티커 주기</Text>
            <Text style={styles.sheetSticker}>{stickerEmoji}</Text>
            <Text style={styles.sheetCount}>{board.current_count + 1}번째 스티커</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="한 줄 메모 (선택)"
              placeholderTextColor={Colors.textLight}
              value={memo}
              onChangeText={setMemo}
              maxLength={100}
            />
            <TouchableOpacity
              style={[styles.sheetButton, isGiving && { backgroundColor: Colors.disabled }]}
              onPress={handleGiveSticker}
              disabled={isGiving}
            >
              <Text style={styles.sheetButtonText}>{isGiving ? '부여 중...' : '스티커 주기'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowStickerSheet(false); setMemo(''); }}>
              <Text style={styles.sheetCancel}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Celebration Modal */}
      <Modal visible={showCelebration} transparent animationType="fade">
        <View style={styles.celebrationOverlay}>
          <View style={styles.celebrationContent}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationTitle}>축하해요!</Text>
            <Text style={styles.celebrationSubtitle}>목표를 달성했어요!</Text>
            {reward && (
              <View style={styles.celebrationReward}>
                <Text style={styles.celebrationRewardLabel}>보상</Text>
                <Text style={styles.celebrationRewardText}>{reward.description}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.celebrationButton} onPress={() => setShowCelebration(false)}>
              <Text style={styles.celebrationButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 100, gap: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: Colors.textSecondary },
  draftBanner: { backgroundColor: Colors.secondaryLight, borderRadius: 14, padding: 16, gap: 12, alignItems: 'center' },
  draftBannerText: { fontSize: 15, color: Colors.text, textAlign: 'center' },
  acceptButton: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  acceptButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statusBanner: { borderRadius: 14, padding: 16, alignItems: 'center', gap: 4 },
  statusBannerEmoji: { fontSize: 36 },
  statusBannerText: { fontSize: 20, fontWeight: '800' },
  progressSection: { gap: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressCount: { fontSize: 22, fontWeight: '800', color: Colors.text },
  daysLeftText: { fontSize: 18, fontWeight: '700', color: Colors.textSecondary },
  progressBar: { height: 12, backgroundColor: Colors.border, borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 6 },
  percentText: { fontSize: 13, color: Colors.textSecondary },
  gridContainer: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  gridCell: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  gridCellFilled: { backgroundColor: Colors.secondaryLight, borderColor: Colors.secondary },
  gridCellText: { fontSize: 18 },
  infoSection: { gap: 12 },
  infoCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  infoLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  infoValue: { fontSize: 16, fontWeight: '600', color: Colors.text },
  completeButton: { backgroundColor: Colors.success, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  completeButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  completedBadge: { fontSize: 14, color: Colors.success, fontWeight: '600' },
  logSection: { gap: 10 },
  logTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  logItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  logEmoji: { fontSize: 20, marginTop: 2 },
  logContent: { flex: 1 },
  logDate: { fontSize: 13, color: Colors.textSecondary },
  logMemo: { fontSize: 14, color: Colors.text, marginTop: 2 },
  fab: { position: 'absolute', bottom: 24, left: 20, right: 20, backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8 },
  fabText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, alignItems: 'center', gap: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  sheetSticker: { fontSize: 56 },
  sheetCount: { fontSize: 16, color: Colors.textSecondary },
  sheetInput: { width: '100%', backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: Colors.text },
  sheetButton: { width: '100%', backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  sheetButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sheetCancel: { fontSize: 16, color: Colors.textSecondary, paddingVertical: 8 },
  celebrationOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.overlay },
  celebrationContent: { backgroundColor: Colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', gap: 12, marginHorizontal: 32 },
  celebrationEmoji: { fontSize: 64 },
  celebrationTitle: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  celebrationSubtitle: { fontSize: 16, color: Colors.textSecondary },
  celebrationReward: { backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 16, width: '100%', alignItems: 'center', gap: 4 },
  celebrationRewardLabel: { fontSize: 13, color: Colors.textSecondary },
  celebrationRewardText: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  celebrationButton: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 48, marginTop: 8 },
  celebrationButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
