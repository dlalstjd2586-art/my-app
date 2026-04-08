import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, Share, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '@/constants/Colors';
import { useRelationshipStore } from '@/stores/relationshipStore';
import { useAuthStore } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';
import ConfirmModal from '@/components/ConfirmModal';

type Tab = 'invite' | 'enter';

// 데모용 초대코드 생성
function generateDemoCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function ConnectScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('invite');
  const [inputCode, setInputCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoCode, setDemoCode] = useState('');
  const [showCopied, setShowCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { inviteCode, inviteExpiresAt, createInviteCode, acceptInviteCode } = useRelationshipStore();
  const { signOut } = useAuthStore();
  const { isDemoMode, enableDemo } = useDemoStore();

  useEffect(() => {
    if (activeTab === 'invite') {
      if (isDemoMode) {
        if (!demoCode) setDemoCode(generateDemoCode());
      } else {
        if (!inviteCode) createInviteCode();
      }
    }
  }, [activeTab]);

  const displayCode = isDemoMode ? demoCode : inviteCode;

  const handleCopyCode = async () => {
    if (!displayCode) return;
    if (Platform.OS === 'web') {
      try { await navigator.clipboard.writeText(displayCode); } catch {}
    } else {
      await Clipboard.setStringAsync(displayCode);
    }
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleShareCode = async () => {
    if (!displayCode) return;
    try {
      await Share.share({
        message: `칭찬스티커 앱에서 함께해요! 초대코드: ${displayCode}`,
      });
    } catch {}
  };

  const handleAcceptCode = async () => {
    const code = inputCode.trim().toUpperCase();
    if (code.length !== 6) return;

    setIsSubmitting(true);

    if (isDemoMode) {
      // 데모: 아무 코드나 입력하면 연결 성공
      await new Promise(r => setTimeout(r, 800));
      setIsSubmitting(false);
      setShowSuccess(true);
      return;
    }

    const result = await acceptInviteCode(code);
    setIsSubmitting(false);
    if (!result.success) {
      // 웹에서도 동작하는 에러 표시
      setShowSuccess(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccess(false);
    if (isDemoMode) {
      enableDemo(); // 관계 연동 상태로 전환
      router.replace('/(tabs)/home');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 뒤로가기 */}
      <TouchableOpacity style={styles.backBtn} onPress={() => {
        if (isDemoMode) { router.replace('/login'); }
        else { signOut(); }
      }}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.emoji}>💑</Text>
        <Text style={styles.title}>파트너 연결하기</Text>
        <Text style={styles.subtitle}>초대코드를 공유하거나{'\n'}받은 코드를 입력하세요</Text>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'invite' && styles.tabActive]}
            onPress={() => setActiveTab('invite')}
          >
            <Text style={[styles.tabText, activeTab === 'invite' && styles.tabTextActive]}>
              초대하기
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'enter' && styles.tabActive]}
            onPress={() => setActiveTab('enter')}
          >
            <Text style={[styles.tabText, activeTab === 'enter' && styles.tabTextActive]}>
              코드 입력
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'invite' ? (
          <View style={styles.tabContent}>
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>내 초대코드</Text>
              <Text style={styles.codeText}>{displayCode || '생성 중...'}</Text>
              <Text style={styles.codeExpiry}>24시간 후 만료</Text>
            </View>

            {showCopied && (
              <View style={styles.copiedBanner}>
                <Text style={styles.copiedText}>✅ 복사되었어요!</Text>
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.actionButton} onPress={handleCopyCode}>
                <Text style={styles.actionButtonText}>📋 코드 복사</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.actionButtonPrimary]} onPress={handleShareCode}>
                <Text style={styles.actionButtonTextPrimary}>📤 공유하기</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.howToBox}>
              <Text style={styles.howToTitle}>이렇게 하세요!</Text>
              <Text style={styles.howToStep}>1. 위 코드를 복사하세요</Text>
              <Text style={styles.howToStep}>2. 카카오톡으로 파트너에게 보내세요</Text>
              <Text style={styles.howToStep}>3. 파트너가 앱 설치 후 코드를 입력하면 연결!</Text>
            </View>
          </View>
        ) : (
          <View style={styles.tabContent}>
            <Text style={styles.inputLabel}>받은 초대코드 입력</Text>
            <TextInput
              style={styles.input}
              placeholder="6자리 코드"
              placeholderTextColor={Colors.textLight}
              value={inputCode}
              onChangeText={(t) => setInputCode(t.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={6}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.submitButton, (inputCode.trim().length !== 6 || isSubmitting) && styles.submitButtonDisabled]}
              onPress={handleAcceptCode}
              disabled={inputCode.trim().length !== 6 || isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? '연결 중...' : '연결하기'}
              </Text>
            </TouchableOpacity>

            {isDemoMode && (
              <Text style={styles.demoHint}>💡 데모 모드: 아무 6자리를 입력해보세요!</Text>
            )}
          </View>
        )}
      </View>

      {/* 연결 성공 모달 */}
      <ConfirmModal
        visible={showSuccess}
        title="🎉 연결 완료!"
        message={isDemoMode ? '"지은"님과 연결되었어요!\n이제 스티커판을 만들어보세요.' : '파트너와 연결되었어요!'}
        confirmText="시작하기"
        cancelText=""
        onConfirm={handleSuccessConfirm}
        onCancel={handleSuccessConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  backBtn: { paddingTop: 16, paddingLeft: 20, paddingBottom: 0, alignSelf: 'flex-start' },
  backArrow: { fontSize: 28, color: Colors.text },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  emoji: { fontSize: 60, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginBottom: 28, lineHeight: 22 },

  tabBar: { flexDirection: 'row', backgroundColor: Colors.border, borderRadius: 12, padding: 3, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: Colors.surface },
  tabText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },

  tabContent: { gap: 16 },
  codeBox: { backgroundColor: Colors.surface, borderRadius: 20, padding: 28, alignItems: 'center', borderWidth: 2, borderColor: Colors.primary },
  codeLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  codeText: { fontSize: 40, fontWeight: '900', color: Colors.primary, letterSpacing: 8 },
  codeExpiry: { fontSize: 12, color: Colors.textLight, marginTop: 8 },

  copiedBanner: { backgroundColor: '#E8F5E9', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  copiedText: { fontSize: 14, fontWeight: '600', color: Colors.success },

  buttonRow: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.primary },
  actionButtonPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  actionButtonText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  actionButtonTextPrimary: { fontSize: 15, fontWeight: '700', color: '#fff' },

  howToBox: { backgroundColor: '#F5F5FF', borderRadius: 14, padding: 16, gap: 6 },
  howToTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  howToStep: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

  inputLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  input: { backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, fontSize: 28, fontWeight: '800', textAlign: 'center', letterSpacing: 10, color: Colors.text },
  submitButton: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: Colors.disabled },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  demoHint: { fontSize: 13, color: Colors.primary, fontWeight: '600', textAlign: 'center' },

  logoutButton: { paddingVertical: 16, alignItems: 'center' },
  logoutText: { fontSize: 14, color: Colors.textLight },
});
