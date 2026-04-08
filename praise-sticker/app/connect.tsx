import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '@/constants/Colors';
import { useRelationshipStore } from '@/stores/relationshipStore';
import { useAuthStore } from '@/stores/authStore';

type Tab = 'invite' | 'enter';

export default function ConnectScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('invite');
  const [inputCode, setInputCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { inviteCode, inviteExpiresAt, createInviteCode, acceptInviteCode } = useRelationshipStore();
  const { signOut } = useAuthStore();

  useEffect(() => {
    if (activeTab === 'invite' && !inviteCode) {
      createInviteCode();
    }
  }, [activeTab]);

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert('복사 완료', '초대코드가 복사되었어요');
  };

  const handleShareCode = async () => {
    if (!inviteCode) return;
    try {
      await Share.share({
        message: `칭찬스티커 앱에서 함께해요! 초대코드: ${inviteCode}`,
      });
    } catch {}
  };

  const handleAcceptCode = async () => {
    const code = inputCode.trim().toUpperCase();
    if (code.length !== 6) {
      Alert.alert('알림', '6자리 코드를 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    const result = await acceptInviteCode(code);
    setIsSubmitting(false);

    if (!result.success) {
      Alert.alert('연결 실패', result.error ?? '다시 시도해주세요');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>💑</Text>
        <Text style={styles.title}>파트너 연결하기</Text>
        <Text style={styles.subtitle}>초대코드를 공유하거나 받은 코드를 입력하세요</Text>

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
              <Text style={styles.codeText}>{inviteCode ?? '생성 중...'}</Text>
              {inviteExpiresAt && (
                <Text style={styles.codeExpiry}>24시간 후 만료</Text>
              )}
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.actionButton} onPress={handleCopyCode}>
                <Text style={styles.actionButtonText}>코드 복사</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.actionButtonPrimary]} onPress={handleShareCode}>
                <Text style={styles.actionButtonTextPrimary}>공유하기</Text>
              </TouchableOpacity>
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
              onChangeText={(t) => setInputCode(t.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoFocus
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
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.border,
    borderRadius: 10,
    padding: 3,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.surface,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  tabContent: {
    gap: 16,
  },
  codeBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 6,
  },
  codeExpiry: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  actionButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 8,
    color: Colors.text,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  logoutButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 14,
    color: Colors.textLight,
  },
});
