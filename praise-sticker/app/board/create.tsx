import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, StickerPresets } from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';
import { useRelationshipStore } from '@/stores/relationshipStore';
import { useBoardStore } from '@/stores/boardStore';
import { useDemoStore } from '@/stores/demoStore';
import { DEMO_USER, DEMO_PARTNER, DEMO_RELATIONSHIP } from '@/lib/demo-data';
import type { DemoBoardWithDetails } from '@/lib/demo-data';

export default function CreateBoardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { partner } = useRelationshipStore();
  const { createBoard } = useBoardStore();
  const { isDemoMode, addBoard } = useDemoStore();

  const [title, setTitle] = useState('');
  const [collectorIsMe, setCollectorIsMe] = useState(false);
  const [targetCount, setTargetCount] = useState('10');
  const [durationDays, setDurationDays] = useState('30');
  const [rewardDescription, setRewardDescription] = useState('');
  const [selectedSticker, setSelectedSticker] = useState('star_gold');
  const [customStickerUri, setCustomStickerUri] = useState<string | null>(null);
  const [hasPenalty, setHasPenalty] = useState(false);
  const [penaltyDescription, setPenaltyDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayUser = isDemoMode ? DEMO_USER : user;
  const displayPartner = isDemoMode ? DEMO_PARTNER : partner;
  const collectorName = collectorIsMe ? displayUser?.nickname : displayPartner?.nickname;
  const giverName = collectorIsMe ? displayPartner?.nickname : displayUser?.nickname;

  // 사진으로 커스텀 스티커 만들기
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      setCustomStickerUri(result.assets[0].uri);
      setSelectedSticker('custom');
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) { Alert.alert('알림', '스티커판 이름을 입력해주세요'); return; }
    if (!rewardDescription.trim()) { Alert.alert('알림', '보상을 입력해주세요'); return; }

    const target = parseInt(targetCount) || 10;
    const days = parseInt(durationDays) || 30;
    if (target < 5 || target > 100) { Alert.alert('알림', '목표는 5~100개 사이로 설정해주세요'); return; }
    if (days < 1 || days > 365) { Alert.alert('알림', '기간은 1~365일 사이로 설정해주세요'); return; }
    if (hasPenalty && !penaltyDescription.trim()) { Alert.alert('알림', '패널티 내용을 입력해주세요'); return; }

    if (isDemoMode) {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + days);
      const collectorId = collectorIsMe ? DEMO_USER.id : DEMO_PARTNER.id;
      const giverId = collectorIsMe ? DEMO_PARTNER.id : DEMO_USER.id;

      const newBoard: DemoBoardWithDetails = {
        id: `demo-board-${Date.now()}`,
        relationship_id: DEMO_RELATIONSHIP.id,
        creator_id: DEMO_USER.id,
        collector_id: collectorId,
        giver_id: giverId,
        title: title.trim(),
        target_count: target,
        current_count: 0,
        sticker_image_url: customStickerUri,
        sticker_preset: selectedSticker === 'custom' ? 'star_gold' : selectedSticker,
        start_date: today.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'active',
        has_penalty: hasPenalty,
        created_at: today.toISOString(),
        updated_at: today.toISOString(),
        rewards: [{ id: `demo-reward-${Date.now()}`, board_id: '', description: rewardDescription.trim(), reward_type: 'promise', reward_data: null, status: 'waiting', provider_id: giverId, completed_at: null, proof_image_url: null, created_at: today.toISOString(), updated_at: today.toISOString() }],
        penalties: hasPenalty ? [{ id: `demo-penalty-${Date.now()}`, board_id: '', description: penaltyDescription.trim(), status: 'inactive', responsible_id: collectorId, completed_at: null, proof_image_url: null, created_at: today.toISOString(), updated_at: today.toISOString() }] : [],
      };

      addBoard(newBoard);
      Alert.alert('완료!', `"${title.trim()}" 스티커판이 만들어졌어요!`);
      router.back();
      return;
    }

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    setIsSubmitting(true);
    const result = await createBoard({
      title: title.trim(),
      collector_id: collectorIsMe ? displayUser!.id : displayPartner!.id,
      target_count: target,
      start_date: today.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      sticker_preset: selectedSticker === 'custom' ? 'star_gold' : selectedSticker,
      reward_description: rewardDescription.trim(),
      reward_type: 'promise',
      has_penalty: hasPenalty,
      penalty_description: hasPenalty ? penaltyDescription.trim() : undefined,
    });
    setIsSubmitting(false);

    if (result.success) router.back();
    else Alert.alert('오류', result.error);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title */}
      <View style={styles.field}>
        <Text style={styles.label}>스티커판 이름</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 운동 챌린지"
          placeholderTextColor={Colors.textLight}
          value={title}
          onChangeText={setTitle}
          maxLength={50}
        />
      </View>

      {/* Collector */}
      <View style={styles.field}>
        <Text style={styles.label}>스티커를 모으는 사람</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, !collectorIsMe && styles.toggleActive]}
            onPress={() => setCollectorIsMe(false)}
          >
            <Text style={[styles.toggleText, !collectorIsMe && styles.toggleTextActive]}>
              {displayPartner?.nickname ?? '파트너'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, collectorIsMe && styles.toggleActive]}
            onPress={() => setCollectorIsMe(true)}
          >
            <Text style={[styles.toggleText, collectorIsMe && styles.toggleTextActive]}>
              {displayUser?.nickname ?? '나'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>{giverName}이(가) {collectorName}에게 스티커를 줍니다</Text>
      </View>

      {/* Target */}
      <View style={styles.field}>
        <Text style={styles.label}>목표 스티커 수</Text>
        <View style={styles.quickRow}>
          {['5', '10', '20', '30'].map(n => (
            <TouchableOpacity
              key={n}
              style={[styles.quickChip, targetCount === n && styles.quickChipActive]}
              onPress={() => setTargetCount(n)}
            >
              <Text style={[styles.quickChipText, targetCount === n && styles.quickChipTextActive]}>{n}개</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={styles.input} placeholder="직접 입력 (5~100)" placeholderTextColor={Colors.textLight}
          value={targetCount} onChangeText={setTargetCount} keyboardType="number-pad" maxLength={3} />
      </View>

      {/* Duration */}
      <View style={styles.field}>
        <Text style={styles.label}>기간 (일)</Text>
        <View style={styles.quickRow}>
          {['7', '14', '30', '60'].map(n => (
            <TouchableOpacity
              key={n}
              style={[styles.quickChip, durationDays === n && styles.quickChipActive]}
              onPress={() => setDurationDays(n)}
            >
              <Text style={[styles.quickChipText, durationDays === n && styles.quickChipTextActive]}>{n}일</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={styles.input} placeholder="직접 입력 (1~365)" placeholderTextColor={Colors.textLight}
          value={durationDays} onChangeText={setDurationDays} keyboardType="number-pad" maxLength={3} />
      </View>

      {/* ===== 스티커 선택 (기본 + 사진 업로드) ===== */}
      <View style={styles.field}>
        <Text style={styles.label}>스티커 모양</Text>
        <View style={styles.stickerRow}>
          {StickerPresets.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.stickerOption, selectedSticker === s.id && styles.stickerOptionActive]}
              onPress={() => { setSelectedSticker(s.id); setCustomStickerUri(null); }}
            >
              <Text style={styles.stickerEmoji}>{s.emoji}</Text>
              <Text style={styles.stickerLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}

          {/* 사진으로 만들기 버튼 */}
          <TouchableOpacity
            style={[styles.stickerOption, styles.stickerOptionUpload, selectedSticker === 'custom' && styles.stickerOptionActive]}
            onPress={handlePickImage}
          >
            {customStickerUri ? (
              <Image source={{ uri: customStickerUri }} style={styles.stickerUploadPreview} />
            ) : (
              <Text style={styles.stickerUploadIcon}>📷</Text>
            )}
            <Text style={styles.stickerLabel}>사진</Text>
          </TouchableOpacity>
        </View>
        {customStickerUri && (
          <Text style={styles.customStickerHint}>내 사진이 스티커가 돼요!</Text>
        )}
      </View>

      {/* Reward */}
      <View style={styles.field}>
        <Text style={styles.label}>성공 보상 🎁</Text>
        <TextInput style={styles.input} placeholder="예: 청담 오마카세" placeholderTextColor={Colors.textLight}
          value={rewardDescription} onChangeText={setRewardDescription} maxLength={200} />
      </View>

      {/* Penalty */}
      <View style={styles.field}>
        <View style={styles.penaltyHeader}>
          <Text style={styles.label}>실패 패널티 ⚡</Text>
          <TouchableOpacity
            style={[styles.penaltyToggle, hasPenalty && styles.penaltyToggleOn]}
            onPress={() => setHasPenalty(!hasPenalty)}
          >
            <View style={[styles.penaltyToggleDot, hasPenalty && styles.penaltyToggleDotOn]} />
          </TouchableOpacity>
        </View>
        {hasPenalty && (
          <TextInput style={styles.input} placeholder="예: 상대방에게 치킨 쏘기" placeholderTextColor={Colors.textLight}
            value={penaltyDescription} onChangeText={setPenaltyDescription} maxLength={200} />
        )}
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleCreate}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>{isSubmitting ? '생성 중...' : '스티커판 만들기'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40, gap: 24 },
  field: { gap: 8 },
  label: { fontSize: 16, fontWeight: '700', color: Colors.text },
  hint: { fontSize: 13, color: Colors.textSecondary },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: Colors.text },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  toggleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  toggleText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  toggleTextActive: { color: '#fff' },
  quickRow: { flexDirection: 'row', gap: 8 },
  quickChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  quickChipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  quickChipText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  quickChipTextActive: { color: Colors.primary },

  // 스티커 선택
  stickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stickerOption: {
    width: 68, height: 76, borderRadius: 14, backgroundColor: Colors.surface,
    borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  stickerOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  stickerOptionUpload: { borderStyle: 'dashed' },
  stickerEmoji: { fontSize: 30 },
  stickerLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  stickerUploadIcon: { fontSize: 28 },
  stickerUploadPreview: { width: 40, height: 40, borderRadius: 20 },
  customStickerHint: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  // 패널티
  penaltyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  penaltyToggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: Colors.border, justifyContent: 'center', paddingHorizontal: 3 },
  penaltyToggleOn: { backgroundColor: Colors.primary },
  penaltyToggleDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.surface },
  penaltyToggleDotOn: { alignSelf: 'flex-end' },

  submitButton: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  submitButtonDisabled: { backgroundColor: Colors.disabled },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
