import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useDemoStore } from '@/stores/demoStore';

export default function LoginScreen() {
  const router = useRouter();
  const { enableDemo } = useDemoStore();

  const handleGoogleLogin = () => {
    Alert.alert(
      'Supabase 연결 필요',
      'Google 로그인을 사용하려면 Supabase 프로젝트를 먼저 설정해야 해요.\n\n지금은 "데모 모드"로 앱을 체험해보세요!',
    );
  };

  const handleDemoMode = () => {
    enableDemo();
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Area */}
        <View style={styles.logoArea}>
          <Text style={styles.logoEmoji}>⭐</Text>
          <Text style={styles.title}>칭찬스티커</Text>
          <Text style={styles.subtitle}>서로에게 칭찬 스티커를 주고{'\n'}목표를 달성해보세요</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonArea}>
          {/* Demo Mode - 가장 눈에 띄게 */}
          <TouchableOpacity style={styles.demoButton} onPress={handleDemoMode}>
            <Text style={styles.demoButtonText}>데모 모드로 체험하기</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>Google로 시작하기</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            시작하면 이용약관 및 개인정보처리방침에 동의하게 됩니다
          </Text>
        </View>
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonArea: {
    gap: 16,
  },
  demoButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: Colors.textLight,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 12,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  terms: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
  },
});
