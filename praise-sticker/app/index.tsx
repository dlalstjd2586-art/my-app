import { Redirect } from 'expo-router';
import { useDemoStore } from '@/stores/demoStore';

export default function Index() {
  const { isDemoMode } = useDemoStore();

  if (isDemoMode) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/login" />;
}
