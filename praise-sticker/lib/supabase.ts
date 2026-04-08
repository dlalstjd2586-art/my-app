import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Use SecureStore on native, localStorage on web
const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => {
        if (typeof window !== 'undefined') return window.localStorage.getItem(key);
        return null;
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') window.localStorage.removeItem(key);
      },
    };
  }

  // Lazy import to avoid SSR issues
  const SecureStore = require('expo-secure-store');
  return {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  };
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
