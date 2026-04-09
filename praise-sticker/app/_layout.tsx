import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/stores/authStore';
import { useRelationshipStore } from '@/stores/relationshipStore';
import { useBoardStore } from '@/stores/boardStore';
import { useDemoStore } from '@/stores/demoStore';
import { supabase } from '@/lib/supabase';
import { StatusBar } from 'expo-status-bar';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, isLoading, isProfileComplete, initialize } = useAuthStore();
  const { relationship, fetchRelationship } = useRelationshipStore();
  const { checkExpiredBoards } = useBoardStore();
  const { isDemoMode } = useDemoStore();
  const [initialized, setInitialized] = useState(false);

  // 웹: Google 로그인 후 URL 해시에서 토큰 복원
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken && refreshToken) {
          supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
            .then(() => {
              // URL에서 해시 제거
              window.history.replaceState(null, '', window.location.pathname);
            });
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isDemoMode) {
      setInitialized(true);
      SplashScreen.hideAsync();
      return;
    }
    initialize()
      .catch(() => {})
      .finally(() => setInitialized(true));
  }, [isDemoMode]);

  useEffect(() => {
    if (!isDemoMode && session && isProfileComplete) {
      fetchRelationship();
      checkExpiredBoards();
    }
  }, [isDemoMode, session, isProfileComplete]);

  // Navigation guard
  useEffect(() => {
    if (!initialized) return;
    if (isDemoMode) return;
    if (isLoading) return;

    const inLogin = segments[0] === 'login';
    const inSetup = segments[0] === 'setup-nickname';
    const inConnect = segments[0] === 'connect';

    if (!session) {
      if (!inLogin) router.replace('/login');
    } else if (!isProfileComplete) {
      if (!inSetup) router.replace('/setup-nickname');
    } else if (!relationship) {
      if (!inConnect && !inLogin) router.replace('/connect');
    } else {
      if (inLogin || inSetup || inConnect) {
        router.replace('/(tabs)/home');
      }
    }
  }, [initialized, isLoading, session, isProfileComplete, relationship, segments, isDemoMode]);

  useEffect(() => {
    if (initialized && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [initialized, isLoading]);

  if (!initialized || (!isDemoMode && isLoading)) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="setup-nickname" />
        <Stack.Screen name="connect" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="board/create" options={{ headerShown: true, title: '스티커판 만들기', headerBackTitle: '뒤로' }} />
        <Stack.Screen name="board/[id]" options={{ headerShown: true, title: '스티커판', headerBackTitle: '뒤로' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}
