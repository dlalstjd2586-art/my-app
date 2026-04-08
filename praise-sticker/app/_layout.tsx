import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/stores/authStore';
import { useRelationshipStore } from '@/stores/relationshipStore';
import { useBoardStore } from '@/stores/boardStore';
import { useDemoStore } from '@/stores/demoStore';
import { StatusBar } from 'expo-status-bar';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, user, isLoading, isProfileComplete, initialize } = useAuthStore();
  const { relationship, fetchRelationship } = useRelationshipStore();
  const { checkExpiredBoards } = useBoardStore();
  const { isDemoMode } = useDemoStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (isDemoMode) {
      setInitialized(true);
      SplashScreen.hideAsync();
      return;
    }
    initialize().then(() => setInitialized(true));
  }, [isDemoMode]);

  // Fetch relationship when user is ready (non-demo)
  useEffect(() => {
    if (!isDemoMode && session && isProfileComplete) {
      fetchRelationship();
      checkExpiredBoards();
    }
  }, [isDemoMode, session, isProfileComplete]);

  // Navigation guard
  useEffect(() => {
    if (!initialized) return;
    if (isDemoMode) return; // 데모 모드에서는 가드 안 함
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login';
    const inSetup = segments[0] === 'setup-nickname';
    const inConnect = segments[0] === 'connect';

    if (!session) {
      router.replace('/login');
    } else if (!isProfileComplete) {
      if (!inSetup) router.replace('/setup-nickname');
    } else if (!relationship) {
      if (!inConnect && !inAuthGroup) router.replace('/connect');
    } else {
      if (inAuthGroup || inSetup || inConnect) {
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
        <Stack.Screen name="login" />
        <Stack.Screen name="setup-nickname" />
        <Stack.Screen name="connect" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="board/create" options={{ headerShown: true, title: '스티커판 만들기', headerBackTitle: '뒤로' }} />
        <Stack.Screen name="board/[id]" options={{ headerShown: true, title: '스티커판', headerBackTitle: '뒤로' }} />
      </Stack>
    </>
  );
}
