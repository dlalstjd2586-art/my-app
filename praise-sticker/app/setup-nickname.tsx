import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';

export default function SetupNicknameScreen() {
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateNickname } = useAuthStore();

  const handleSubmit = async () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 1 || trimmed.length > 30) return;

    setIsSubmitting(true);
    try {
      await updateNickname(trimmed);
    } catch {}
    setIsSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.inner} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          <View style={styles.emojiCircle}>
            <Text style={styles.emoji}>👋</Text>
          </View>
          <Text style={styles.title}>반가워요!</Text>
          <Text style={styles.subtitle}>앱에서 사용할 닉네임을 정해주세요</Text>

          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="닉네임 입력"
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
        </View>

        <TouchableOpacity
          style={[styles.button, (!nickname.trim() || isSubmitting) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!nickname.trim() || isSubmitting}
        >
          <Text style={styles.buttonText}>{isSubmitting ? '저장 중...' : '시작하기 →'}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: 28, paddingBottom: 36, justifyContent: 'space-between' },
  content: { paddingTop: 80, gap: 12 },
  emojiCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emoji: { fontSize: 36 },
  title: { fontSize: 30, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 16, color: Colors.textSecondary, marginBottom: 20 },
  inputWrap: { gap: 6 },
  input: {
    backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.primary,
    borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, fontSize: 20,
    fontWeight: '600', color: Colors.text,
  },
  charCount: { fontSize: 12, color: Colors.textLight, textAlign: 'right', paddingRight: 4 },
  button: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  buttonDisabled: { backgroundColor: Colors.disabled },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
