// 칭찬 모아보기 + 뱃지 + 월간 리포트
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, StickerPresets } from '@/constants/Colors';
import { useDemoStore } from '@/stores/demoStore';
import { DEMO_USER, DEMO_PARTNER, DEMO_RELATIONSHIP, generateDemoStickers, DEMO_ACTIVE_BOARDS, DEMO_HISTORY_BOARDS } from '@/lib/demo-data';
import BadgeCard, { getDemoBadges, type Badge } from '@/components/BadgeCard';

type Tab = 'praise' | 'badges' | 'report';

export default function PraiseScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('praise');
  const { isDemoMode, activeBoards, historyBoards } = useDemoStore();

  // 데모 데이터 수집
  const allBoards = [...activeBoards, ...historyBoards];
  const allStickers = allBoards.flatMap(b => generateDemoStickers(b.id, b.current_count));
  const totalStickers = allStickers.length;
  const totalBoards = allBoards.length;
  const successBoards = historyBoards.filter(b => b.status === 'success').length;
  const badges = getDemoBadges();
  const earnedBadges = badges.filter(b => b.earned);

  // 커플 함께한 일수
  const daysTogether = Math.ceil((Date.now() - new Date(DEMO_RELATIONSHIP.connected_at!).getTime()) / (1000 * 60 * 60 * 24));

  const tabs: { key: Tab; label: string; emoji: string }[] = [
    { key: 'praise', label: '칭찬', emoji: '💬' },
    { key: 'badges', label: '뱃지', emoji: '🏆' },
    { key: 'report', label: '리포트', emoji: '📊' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={styles.tabEmoji}>{t.emoji}</Text>
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ===== 칭찬 모아보기 ===== */}
      {activeTab === 'praise' && (
        <View style={styles.section}>
          <View style={styles.praiseHeader}>
            <Text style={styles.praiseHeaderEmoji}>💝</Text>
            <Text style={styles.praiseHeaderTitle}>받은 칭찬 {totalStickers}개</Text>
          </View>

          {allStickers
            .filter(s => s.memo)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 20)
            .map((sticker, idx) => {
              const board = allBoards.find(b => b.id === sticker.board_id);
              const stickerEmoji = StickerPresets.find(s => s.id === board?.sticker_preset)?.emoji ?? '⭐';
              return (
                <View key={sticker.id} style={styles.praiseCard}>
                  <View style={styles.praiseCardLeft}>
                    <Text style={styles.praiseCardEmoji}>{stickerEmoji}</Text>
                  </View>
                  <View style={styles.praiseCardRight}>
                    <Text style={styles.praiseCardMemo}>"{sticker.memo}"</Text>
                    <Text style={styles.praiseCardDate}>
                      {new Date(sticker.created_at).toLocaleDateString('ko-KR')} · {board?.title}
                    </Text>
                  </View>
                </View>
              );
            })}

          {allStickers.filter(s => s.memo).length === 0 && (
            <View style={styles.emptySection}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyText}>아직 칭찬 기록이 없어요</Text>
            </View>
          )}
        </View>
      )}

      {/* ===== 뱃지 ===== */}
      {activeTab === 'badges' && (
        <View style={styles.section}>
          <View style={styles.badgeHeader}>
            <Text style={styles.badgeHeaderText}>획득한 뱃지 {earnedBadges.length}/{badges.length}</Text>
          </View>
          <View style={styles.badgeGrid}>
            {badges.map(badge => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </View>
        </View>
      )}

      {/* ===== 월간 리포트 ===== */}
      {activeTab === 'report' && (
        <View style={styles.section}>
          {/* 커플 프로필 */}
          <View style={styles.coupleCard}>
            <Text style={styles.coupleEmoji}>💑</Text>
            <Text style={styles.coupleNames}>{DEMO_USER.nickname} & {DEMO_PARTNER.nickname}</Text>
            <Text style={styles.coupleDays}>함께한 지 {daysTogether}일</Text>
          </View>

          {/* 통계 그리드 */}
          <View style={styles.statGrid}>
            <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.statEmoji}>⭐</Text>
              <Text style={styles.statNumber}>{totalStickers}</Text>
              <Text style={styles.statLabel}>총 스티커</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.statEmoji}>🏆</Text>
              <Text style={styles.statNumber}>{successBoards}</Text>
              <Text style={styles.statLabel}>성공한 목표</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FCE4EC' }]}>
              <Text style={styles.statEmoji}>📋</Text>
              <Text style={styles.statNumber}>{totalBoards}</Text>
              <Text style={styles.statLabel}>전체 스티커판</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.statEmoji}>🏅</Text>
              <Text style={styles.statNumber}>{earnedBadges.length}</Text>
              <Text style={styles.statLabel}>획득 뱃지</Text>
            </View>
          </View>

          {/* 달성률 */}
          <View style={styles.rateCard}>
            <Text style={styles.rateTitle}>목표 달성률</Text>
            <View style={styles.rateBarBg}>
              <View style={[styles.rateBarFill, { width: totalBoards > 0 ? `${Math.round((successBoards / Math.max(successBoards + historyBoards.filter(b=>b.status==='failed').length, 1)) * 100)}%` : '0%' }]} />
            </View>
            <Text style={styles.rateText}>
              {totalBoards > 0 ? Math.round((successBoards / Math.max(successBoards + historyBoards.filter(b=>b.status==='failed').length, 1)) * 100) : 0}%
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },

  // Tabs
  tabBar: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 16, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, gap: 4 },
  tabActive: { backgroundColor: Colors.primary },
  tabEmoji: { fontSize: 16 },
  tabText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },

  section: { gap: 12 },

  // Praise
  praiseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  praiseHeaderEmoji: { fontSize: 24 },
  praiseHeaderTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  praiseCard: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 16, padding: 14,
    gap: 12, borderWidth: 1, borderColor: Colors.border,
  },
  praiseCardLeft: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.secondaryLight, alignItems: 'center', justifyContent: 'center' },
  praiseCardEmoji: { fontSize: 22 },
  praiseCardRight: { flex: 1, gap: 4, justifyContent: 'center' },
  praiseCardMemo: { fontSize: 15, fontWeight: '600', color: Colors.text, fontStyle: 'italic' },
  praiseCardDate: { fontSize: 12, color: Colors.textLight },

  // Badges
  badgeHeader: { marginBottom: 4 },
  badgeHeaderText: { fontSize: 18, fontWeight: '800', color: Colors.text },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },

  // Report - Couple
  coupleCard: {
    borderRadius: 20, padding: 24, alignItems: 'center', gap: 8,
    borderWidth: 2, borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  coupleEmoji: { fontSize: 48 },
  coupleNames: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  coupleDays: { fontSize: 15, color: Colors.primaryDark, fontWeight: '600' },

  // Stats
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  statCard: {
    width: '48%', borderRadius: 16, padding: 16, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  statEmoji: { fontSize: 28 },
  statNumber: { fontSize: 28, fontWeight: '900', color: Colors.text },
  statLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },

  // Rate
  rateCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 8, borderWidth: 1, borderColor: Colors.border },
  rateTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  rateBarBg: { height: 12, backgroundColor: Colors.border, borderRadius: 6, overflow: 'hidden' },
  rateBarFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 6 },
  rateText: { fontSize: 14, fontWeight: '700', color: Colors.success, textAlign: 'right' },

  // Empty
  emptySection: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
});
