import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, StickerPresets } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import type { StickerBoard, Reward } from '@/types/database';

interface BoardWithReward extends StickerBoard {
  rewards?: Reward[];
}

type FilterType = 'all' | 'success' | 'failed' | 'cancelled';

export default function HistoryScreen() {
  const router = useRouter();
  const [boards, setBoards] = useState<BoardWithReward[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) { setIsLoading(false); return; }

    let query = supabase
      .from('sticker_boards')
      .select('*, rewards(*)')
      .or(`collector_id.eq.${session.user.id},giver_id.eq.${session.user.id}`)
      .in('status', ['success', 'failed', 'cancelled'])
      .order('updated_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setBoards((data as BoardWithReward[]) ?? []);
    setIsLoading(false);
  };

  useEffect(() => { fetchHistory(); }, [filter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return { label: '성공', color: Colors.success, bg: '#E8F5E9' };
      case 'failed': return { label: '실패', color: Colors.error, bg: '#FFEBEE' };
      case 'cancelled': return { label: '취소', color: Colors.textLight, bg: '#F5F5F5' };
      default: return { label: status, color: Colors.textLight, bg: '#F5F5F5' };
    }
  };

  const getStickerEmoji = (preset: string) => {
    return StickerPresets.find(s => s.id === preset)?.emoji ?? '⭐';
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'success', label: '성공' },
    { key: 'failed', label: '실패' },
    { key: 'cancelled', label: '취소' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchHistory} />}
    >
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {boards.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>아직 완료된 기록이 없어요</Text>
        </View>
      ) : (
        boards.map(board => {
          const badge = getStatusBadge(board.status);
          const percent = Math.round((board.current_count / board.target_count) * 100);

          return (
            <TouchableOpacity
              key={board.id}
              style={styles.card}
              onPress={() => router.push(`/board/${board.id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{board.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              </View>

              <View style={styles.cardMeta}>
                <Text style={styles.metaText}>
                  {getStickerEmoji(board.sticker_preset)} {board.current_count}/{board.target_count} ({percent}%)
                </Text>
                <Text style={styles.metaText}>
                  {board.start_date} ~ {board.end_date}
                </Text>
              </View>

              {board.rewards && board.rewards.length > 0 && (
                <Text style={styles.rewardText}>
                  🎁 {board.rewards[0].description}
                  {board.rewards[0].status === 'completed' ? ' ✅' : ''}
                </Text>
              )}
            </TouchableOpacity>
          );
        })
      )}
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
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardMeta: {
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  rewardText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
