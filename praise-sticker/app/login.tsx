import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useDemoStore } from '@/stores/demoStore';
import ConfirmModal from '@/components/ConfirmModal';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { enableDemo } = useDemoStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const redirectUrl = makeRedirectUri({ path: 'auth/callback' });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (result.type === 'success' && result.url) {
          // URL에서 토큰 추출
          const url = new URL(result.url);
          const hashParams = new URLSearchParams(url.hash.substring(1));
          const queryParams = new URLSearchParams(url.search);

          const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            // auth state change listener가 자동으로 라우팅 처리
          }
        }
      }
    } catch (err: any) {
      const msg = err?.message || '로그인 중 문제가 발생했어요';
      if (msg.includes('placeholder') || msg.includes('supabaseUrl')) {
        setErrorMsg('Supabase 프로젝트가 아직 연결되지 않았어요.\n\n.env 파일에 EXPO_PUBLIC_SUPABASE_URL과\nEXPO_PUBLIC_SUPABASE_ANON_KEY를 설정해주세요.\n\n자세한 방법은 SETUP.md를 참고하세요!');
      } else {
        setErrorMsg(msg);
      }
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoMode = () => {
    enableDemo();
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoArea}>
          <Text style={styles.logoEmoji}>⭐</Text>
          <Text style={styles.title}>칭찬스티커</Text>
          <Text style={styles.subtitle}>서로에게 칭찬 스티커를 주고{'\n'}목표를 달성해보세요</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonArea}>
          {/* Google 로그인 */}
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#4285F4" />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleText}>Google로 시작하기</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>체험해보기</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.demoButton} onPress={handleDemoMode}>
            <Text style={styles.demoButtonText}>⭐ 데모 모드로 체험하기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.inviteButton} onPress={() => {
            enableDemo();
            router.replace('/connect');
          }}>
            <Text style={styles.inviteButtonText}>💌 초대코드 연결 체험하기</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            시작하면 이용약관 및 개인정보처리방침에 동의하게 됩니다
          </Text>
        </View>
      </View>

      <ConfirmModal
        visible={showError}
        title="로그인 안내"
        message={errorMsg}
        confirmText="확인"
        cancelText=""
        onConfirm={() => setShowError(false)}
        onCancel={() => setShowError(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 40 },
  logoArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoEmoji: { fontSize: 80, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '800', color: Colors.primary, marginBottom: 12 },
  subtitle: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  buttonArea: { gap: 12 },
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#dadce0', borderRadius: 12,
    paddingVertical: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  googleIcon: { fontSize: 20, fontWeight: '700', color: '#4285F4' },
  googleText: { fontSize: 16, fontWeight: '600', color: '#3c4043' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 13, color: Colors.textLight },
  demoButton: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  demoButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  inviteButton: { backgroundColor: Colors.surface, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.primary },
  inviteButtonText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  terms: { fontSize: 11, color: Colors.textLight, textAlign: 'center', marginTop: 4 },
});
