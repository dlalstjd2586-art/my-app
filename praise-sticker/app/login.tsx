import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useDemoStore } from '@/stores/demoStore';
import ConfirmModal from '@/components/ConfirmModal';

export default function LoginScreen() {
  const router = useRouter();
  const { enableDemo } = useDemoStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : 'praisesticker://login',
        },
      });
      if (error) throw error;
    } catch (err: any) {
      const msg = err?.message || '로그인 중 문제가 발생했어요';
      if (msg.includes('placeholder') || msg.includes('supabaseUrl')) {
        setErrorMsg('.env 파일에 Supabase 설정이 필요해요.\nSETUP.md를 참고하세요!');
      } else {
        setErrorMsg(msg);
      }
      setShowError(true);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>⭐</Text>
          </View>
          <Text style={styles.title}>칭찬스티커</Text>
          <Text style={styles.subtitle}>소중한 사람과 함께{'\n'}칭찬으로 목표를 달성하세요</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonArea}>
          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <View style={styles.googleIconWrap}>
                  <Text style={styles.googleIcon}>G</Text>
                </View>
                <Text style={styles.googleText}>Google로 시작하기</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.demoLink} onPress={() => { enableDemo(); router.replace('/(tabs)/home'); }}>
            <Text style={styles.demoLinkText}>체험해보기 (데모 모드)</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            시작하면 이용약관 및 개인정보처리방침에{'\n'}동의하는 것으로 간주됩니다
          </Text>
        </View>
      </View>

      <ConfirmModal
        visible={showError} title="안내" message={errorMsg}
        confirmText="확인" cancelText=""
        onConfirm={() => setShowError(false)} onCancel={() => setShowError(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 28, paddingBottom: 36 },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  logoEmoji: { fontSize: 52 },
  title: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 24 },
  buttonArea: { gap: 14, alignItems: 'center' },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, gap: 12,
    width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  googleIconWrap: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#4285F4',
    alignItems: 'center', justifyContent: 'center',
  },
  googleIcon: { fontSize: 16, fontWeight: '800', color: '#fff' },
  googleText: { fontSize: 17, fontWeight: '700', color: Colors.text },
  demoLink: { paddingVertical: 8 },
  demoLinkText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textDecorationLine: 'underline' },
  terms: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 16 },
});
