import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput, RefreshControl, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, StickerPresets } from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';
import { useBoardStore } from '@/stores/boardStore';
import { useDemoStore } from '@/stores/demoStore';
import {
  DEMO_USER, generateDemoStickers, type DemoBoardWithDetails,
} from '@/lib/demo-data';
import type { Sticker, Reward, Penalty } from '@/types/database';

// 스티커판 배경 색상 테마
const BOARD_THEMES = [
  { bg: '#FFF8E1', border: '#FFD54F', accent: '#FF8F00' },  // 따뜻한 노랑
  { bg: '#FCE4EC', border: '#F48FB1', accent: '#E91E63' },  // 핑크
  { bg: '#E8F5E9', border: '#81C784', accent: '#388E3C' },  // 그린
  { bg: '#E3F2FD', border: '#64B5F6', accent: '#1976D2' },  // 블루
  { bg: '#F3E5F5', border: '#BA68C8', accent: '#7B1FA2' },  // 퍼플
];

export default function BoardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { currentBoard, stickers, isLoading, fetchBoardDetail, acceptBoard, giveSticker, completeReward, completePenalty } = useBoardStore();
  const { isDemoMode, getBoardById } = useDemoStore();

  const [showStickerSheet, setShowStickerSheet] = useState(false);
  const [reason, setReason] = useState('');       // 칭찬 이유 (필수)
  const [stickerCount, setStickerCount] = useState('1');  // 줄 개수
  const [isGiving, setIsGiving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const [demoBoard, setDemoBoard] = useState<DemoBoardWithDetails | null>(null);
  const [demoStickers, setDemoStickers] = useState<Sticker[]>([]);

  useEffect(() => {
    if (isDemoMode && id) {
      const found = getBoardById(id);
      setDemoBoard(found);
      if (found) setDemoStickers(generateDemoStickers(found.id, found.current_count));
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

  const preset = StickerPresets.find(s => s.id === board.sticker_preset);
  const stickerEmoji = preset?.emoji ?? '⭐';
  const percent = Math.min(Math.round((board.current_count / board.target_count) * 100), 100);
  const daysLeft = Math.ceil((new Date(board.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  // 보드 ID로 테마 색상 결정 (고정)
  const themeIndex = board.id.charCodeAt(board.id.length - 1) % BOARD_THEMES.length;
  const theme = BOARD_THEMES[themeIndex];

  const reward: Reward | undefined = (board as DemoBoardWithDetails).rewards?.[0];
  const penalty: Penalty | undefined = (board as DemoBoardWithDetails).penalties?.[0];
  const hasCustomImage = !!board.sticker_image_url;

  const handleAccept = async () => {
    if (isDemoMode) {
      Alert.alert('데모', '수락되었습니다!');
      if (demoBoard) setDemoBoard({ ...demoBoard, status: 'active' });
      return;
    }
    const result = await acceptBoard(board.id);
    if (result.success) fetchBoardDetail(board.id);
    else Alert.alert('오류', result.error);
  };

  const handleGiveSticker = async () => {
    if (!reason.trim()) {
      Alert.alert('알림', '칭찬 이유를 적어주세요!');
      return;
    }

    const count = Math.max(1, Math.min(parseInt(stickerCount) || 1, remaining));

    if (isDemoMode) {
      setIsGiving(true);
      await new Promise(r => setTimeout(r, 500));

      const newStickers: Sticker[] = [];
      for (let i = 0; i < count; i++) {
        const seq = board.current_count + i + 1;
        newStickers.push({
          id: `demo-new-${seq}`,
          board_id: board.id,
          giver_id: DEMO_USER.id,
          memo: i === 0 ? reason.trim() : null,
          sequence: seq,
          created_at: new Date().toISOString(),
        });
      }

      const newCount = board.current_count + count;
      const goalAchieved = newCount >= board.target_count;

      setDemoStickers(prev => [...prev, ...newStickers]);
      setDemoBoard(prev => prev ? { ...prev, current_count: newCount, status: goalAchieved ? 'success' : prev.status } : prev);
      setIsGiving(false);
      setShowStickerSheet(false);
      setReason('');
      setStickerCount('1');
      if (goalAchieved) setShowCelebration(true);
      return;
    }

    // 실제 모드: 서버에 한 개씩 전송 (여러 개일 경우 반복)
    setIsGiving(true);
    let lastGoalAchieved = false;
    for (let i = 0; i < count; i++) {
      const result = await giveSticker(board.id, i === 0 ? reason.trim() : undefined);
      if (!result.success) {
        Alert.alert('오류', result.error);
        break;
      }
      if (result.goalAchieved) { lastGoalAchieved = true; break; }
    }
    setIsGiving(false);
    setShowStickerSheet(false);
    setReason('');
    setStickerCount('1');
    if (lastGoalAchieved) setShowCelebration(true);
  };

  // 남은 스티커 수
  const remaining = board.target_count - board.current_count;

  // 스티커 그리드: 5열 기준
  const cols = 5;
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

        {/* ========== 스티커판 카드 ========== */}
        <View style={[styles.boardCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          {/* 스티커판 헤더 */}
          <View style={styles.boardCardHeader}>
            <Text style={[styles.boardCardTitle, { color: theme.accent }]}>{board.title}</Text>
            {isActive && (
              <View style={[styles.daysLeftBadge, { backgroundColor: daysLeft <= 3 ? Colors.error : theme.accent }]}>
                <Text style={styles.daysLeftBadgeText}>D-{Math.max(daysLeft, 0)}</Text>
              </View>
            )}
          </View>

          {/* 진행률 바 */}
          {!isDraft && (
            <View style={styles.boardProgressSection}>
              <View style={[styles.boardProgressBar, { backgroundColor: `${theme.border}50` }]}>
                <View style={[styles.boardProgressFill, { width: `${percent}%`, backgroundColor: theme.accent }]} />
              </View>
              <Text style={[styles.boardProgressText, { color: theme.accent }]}>
                {board.current_count} / {board.target_count}개 ({percent}%)
              </Text>
            </View>
          )}

          {/* ===== 스티커 그리드 ===== */}
          <View style={styles.stickerGrid}>
            {gridItems.map(item => (
              <View key={item.index} style={styles.stickerCell}>
                {item.filled ? (
                  /* 채워진 스티커 */
                  <View style={[styles.stickerFilled, { backgroundColor: theme.accent }]}>
                    {hasCustomImage ? (
                      <Image source={{ uri: board.sticker_image_url! }} style={styles.stickerImage} />
                    ) : (
                      <Text style={styles.stickerFilledEmoji}>{stickerEmoji}</Text>
                    )}
                  </View>
                ) : (
                  /* 빈 칸 */
                  <View style={[styles.stickerEmpty, { borderColor: theme.border }]}>
                    <Text style={[styles.stickerEmptyNumber, { color: theme.border }]}>{item.index}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* 장식 요소 */}
          <View style={[styles.boardCardFooter, { borderTopColor: theme.border }]}>
            <Text style={styles.boardCardFooterEmoji}>🎯</Text>
            <Text style={[styles.boardCardFooterText, { color: theme.accent }]}>
              {board.target_count}개를 모아보세요!
            </Text>
          </View>
        </View>

        {/* ========== 보상 & 패널티 카드 ========== */}
        {reward && (
          <View style={styles.rewardCard}>
            <View style={styles.rewardCardHeader}>
              <Text style={styles.rewardCardEmoji}>🎁</Text>
              <Text style={styles.rewardCardLabel}>성공 보상</Text>
            </View>
            <Text style={styles.rewardCardValue}>{reward.description}</Text>
            {reward.status === 'pending' && (
              <TouchableOpacity
                style={styles.rewardCompleteBtn}
                onPress={() => Alert.alert('보상 완료', '보상을 이행했나요?', [
                  { text: '아직이요', style: 'cancel' },
                  { text: '완료!', onPress: () => isDemoMode ? Alert.alert('완료!', '보상이 이행되었습니다') : completeReward(reward.id) },
                ])}
              >
                <Text style={styles.rewardCompleteBtnText}>보상 완료 확인</Text>
              </TouchableOpacity>
            )}
            {reward.status === 'completed' && <Text style={styles.completedText}>✅ 이행 완료</Text>}
          </View>
        )}

        {penalty && (
          <View style={[styles.rewardCard, { borderLeftColor: Colors.warning }]}>
            <View style={styles.rewardCardHeader}>
              <Text style={styles.rewardCardEmoji}>⚡</Text>
              <Text style={styles.rewardCardLabel}>실패 패널티</Text>
            </View>
            <Text style={styles.rewardCardValue}>{penalty.description}</Text>
            {penalty.status === 'pending' && (
              <TouchableOpacity
                style={[styles.rewardCompleteBtn, { backgroundColor: Colors.warning }]}
                onPress={() => Alert.alert('패널티 완료', '패널티를 이행했나요?', [
                  { text: '아직이요', style: 'cancel' },
                  { text: '완료!', onPress: () => isDemoMode ? Alert.alert('완료!', '이행되었습니다') : completePenalty(penalty.id) },
                ])}
              >
                <Text style={styles.rewardCompleteBtnText}>패널티 완료 확인</Text>
              </TouchableOpacity>
            )}
            {penalty.status === 'completed' && <Text style={styles.completedText}>✅ 이행 완료</Text>}
          </View>
        )}

        {/* ========== 최근 기록 ========== */}
        {displayStickers.length > 0 && (
          <View style={styles.logSection}>
            <Text style={styles.logTitle}>최근 기록</Text>
            {displayStickers.slice(-5).reverse().map(s => (
              <View key={s.id} style={styles.logItem}>
                <View style={[styles.logDot, { backgroundColor: theme.accent }]} />
                <View style={styles.logContent}>
                  <Text style={styles.logDate}>
                    {new Date(s.created_at).toLocaleDateString('ko-KR')} · #{s.sequence}번째
                  </Text>
                  {s.memo && <Text style={styles.logMemo}>"{s.memo}"</Text>}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ========== 스티커 주기 FAB ========== */}
      {(isActive || (isDemoMode && board.status === 'active')) && isGiver && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: theme.accent }]} onPress={() => setShowStickerSheet(true)}>
          <Text style={styles.fabText}>{stickerEmoji} 스티커 주기</Text>
        </TouchableOpacity>
      )}

      {/* ========== 스티커 주기 바텀시트 ========== */}
      <Modal visible={showStickerSheet} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>스티커 주기</Text>

            <View style={[styles.sheetStickerPreview, { backgroundColor: theme.accent }]}>
              {hasCustomImage ? (
                <Image source={{ uri: board.sticker_image_url! }} style={styles.sheetStickerImage} />
              ) : (
                <Text style={styles.sheetStickerEmoji}>{stickerEmoji}</Text>
              )}
            </View>

            <Text style={styles.sheetCount}>현재 {board.current_count}개 / 목표 {board.target_count}개 (남은 {remaining}개)</Text>

            {/* 칭찬 이유 (필수) */}
            <View style={styles.sheetFieldWrap}>
              <Text style={styles.sheetFieldLabel}>칭찬 이유 <Text style={{ color: Colors.error }}>*</Text></Text>
              <TextInput
                style={styles.sheetInput}
                placeholder="예: 오늘 운동 1시간 했어!"
                placeholderTextColor={Colors.textLight}
                value={reason}
                onChangeText={setReason}
                maxLength={100}
              />
            </View>

            {/* 스티커 개수 */}
            <View style={styles.sheetFieldWrap}>
              <Text style={styles.sheetFieldLabel}>줄 스티커 개수</Text>
              <View style={styles.sheetCountRow}>
                <TouchableOpacity
                  style={styles.sheetCountBtn}
                  onPress={() => setStickerCount(String(Math.max(1, (parseInt(stickerCount) || 1) - 1)))}
                >
                  <Text style={styles.sheetCountBtnText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.sheetCountInput}
                  value={stickerCount}
                  onChangeText={(t) => {
                    const num = parseInt(t) || 0;
                    if (num > remaining) setStickerCount(String(remaining));
                    else setStickerCount(t.replace(/[^0-9]/g, ''));
                  }}
                  keyboardType="number-pad"
                  maxLength={3}
                />
                <TouchableOpacity
                  style={styles.sheetCountBtn}
                  onPress={() => setStickerCount(String(Math.min(remaining, (parseInt(stickerCount) || 1) + 1)))}
                >
                  <Text style={styles.sheetCountBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sheetCountHint}>최대 {remaining}개까지 한 번에 줄 수 있어요</Text>
            </View>

            <TouchableOpacity
              style={[styles.sheetButton, { backgroundColor: theme.accent }, (!reason.trim() || isGiving) && { opacity: 0.5 }]}
              onPress={handleGiveSticker}
              disabled={!reason.trim() || isGiving}
            >
              <Text style={styles.sheetButtonText}>
                {isGiving ? '붙이는 중...' : `${stickerEmoji} 스티커 ${parseInt(stickerCount) || 1}개 붙이기!`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setShowStickerSheet(false); setReason(''); setStickerCount('1'); }}>
              <Text style={styles.sheetCancel}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========== 축하 모달 ========== */}
      <Modal visible={showCelebration} transparent animationType="fade">
        <View style={styles.celebrationOverlay}>
          <View style={styles.celebrationContent}>
            <Text style={styles.celebrationEmoji}>🎉🥳🎊</Text>
            <Text style={styles.celebrationTitle}>축하해요!</Text>
            <Text style={styles.celebrationSubtitle}>목표를 달성했어요!</Text>
            {reward && (
              <View style={[styles.celebrationReward, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Text style={styles.celebrationRewardLabel}>🎁 보상</Text>
                <Text style={[styles.celebrationRewardText, { color: theme.accent }]}>{reward.description}</Text>
              </View>
            )}
            <TouchableOpacity style={[styles.celebrationButton, { backgroundColor: theme.accent }]} onPress={() => setShowCelebration(false)}>
              <Text style={styles.celebrationButtonText}>좋아요!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 100, gap: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: Colors.textSecondary },

  // Status banners
  draftBanner: { backgroundColor: Colors.secondaryLight, borderRadius: 16, padding: 16, gap: 12, alignItems: 'center' },
  draftBannerText: { fontSize: 15, color: Colors.text, textAlign: 'center' },
  acceptButton: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 },
  acceptButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statusBanner: { borderRadius: 16, padding: 20, alignItems: 'center', gap: 4 },
  statusBannerEmoji: { fontSize: 40 },
  statusBannerText: { fontSize: 22, fontWeight: '800' },

  // ===== 스티커판 카드 =====
  boardCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    gap: 16,
    // 카드 그림자
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  boardCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boardCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  daysLeftBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  daysLeftBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  boardProgressSection: {
    gap: 6,
  },
  boardProgressBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  boardProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  boardProgressText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },

  // ===== 스티커 그리드 =====
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  stickerCell: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerFilled: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    // 스티커 효과
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  stickerFilledEmoji: {
    fontSize: 26,
  },
  stickerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  stickerEmpty: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  stickerEmptyNumber: {
    fontSize: 14,
    fontWeight: '600',
  },

  boardCardFooter: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  boardCardFooterEmoji: {
    fontSize: 16,
  },
  boardCardFooterText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // ===== 보상 카드 =====
  rewardCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rewardCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardCardEmoji: { fontSize: 20 },
  rewardCardLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  rewardCardValue: { fontSize: 18, fontWeight: '700', color: Colors.text },
  rewardCompleteBtn: { backgroundColor: Colors.success, borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  rewardCompleteBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  completedText: { fontSize: 14, color: Colors.success, fontWeight: '600' },

  // ===== 기록 =====
  logSection: { gap: 12 },
  logTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  logItem: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  logDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  logContent: { flex: 1 },
  logDate: { fontSize: 13, color: Colors.textSecondary },
  logMemo: { fontSize: 14, color: Colors.text, marginTop: 2, fontStyle: 'italic' },

  // ===== FAB =====
  fab: {
    position: 'absolute', bottom: 24, left: 20, right: 20,
    borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 18, fontWeight: '800' },

  // ===== 바텀시트 =====
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingTop: 12, alignItems: 'center', gap: 16,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, marginBottom: 8 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  sheetStickerPreview: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  sheetStickerEmoji: { fontSize: 44 },
  sheetStickerImage: { width: 64, height: 64, borderRadius: 32 },
  sheetCount: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  sheetFieldWrap: { width: '100%', gap: 6 },
  sheetFieldLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  sheetCountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center' },
  sheetCountBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  sheetCountBtnText: { fontSize: 22, fontWeight: '700', color: Colors.text },
  sheetCountInput: { width: 64, height: 44, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, textAlign: 'center', fontSize: 20, fontWeight: '700', color: Colors.text, backgroundColor: Colors.surface },
  sheetCountHint: { fontSize: 12, color: Colors.textLight, textAlign: 'center' },
  sheetInput: {
    width: '100%', backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Colors.text,
  },
  sheetButton: { width: '100%', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  sheetButtonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  sheetCancel: { fontSize: 16, color: Colors.textSecondary, paddingVertical: 8 },

  // ===== 축하 =====
  celebrationOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  celebrationContent: { backgroundColor: Colors.surface, borderRadius: 28, padding: 36, alignItems: 'center', gap: 12, marginHorizontal: 28 },
  celebrationEmoji: { fontSize: 48 },
  celebrationTitle: { fontSize: 32, fontWeight: '800', color: Colors.primary },
  celebrationSubtitle: { fontSize: 16, color: Colors.textSecondary },
  celebrationReward: { borderRadius: 16, borderWidth: 2, padding: 16, width: '100%', alignItems: 'center', gap: 4, marginTop: 4 },
  celebrationRewardLabel: { fontSize: 14, color: Colors.textSecondary },
  celebrationRewardText: { fontSize: 20, fontWeight: '800' },
  celebrationButton: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 48, marginTop: 8 },
  celebrationButtonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
