import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';

export default function SetupNicknameScreen() {
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateNickname } = useAuthStore();

  const handleSubmit = async () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 1) {
      Alert.alert('알림', '닉네임을 입력해주세요');
      return;
    }
    if (trimmed.length > 30) {
      Alert.alert('알림', '닉네임은 30자 이내로 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateNickname(trimmed);
    } catch {
      Alert.alert('오류', '프로필 저장에 실패했어요');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.emoji}>👋</Text>
          <Text style={styles.title}>반가워요!</Text>
          <Text style={styles.subtitle}>앱에서 사용할 닉네임을 알려주세요</Text>

          <TextInput
            style={styles.input}
            placeholder="닉네임 입력 (예: 민수)"
            placeholderTextColor={Colors.textLight}
            value={nickname}
            onChangeText={setNickname}
            maxLength={30}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
          <Text style={styles.charCount}>{nickname.length}/30</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, (!nickname.trim() || isSubmitting) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!nickname.trim() || isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? '저장 중...' : '시작하기'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  content: {
    paddingTop: 80,
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
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: Colors.text,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: 8,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
