import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[s.iconWrap, focused && s.iconFocused]}>
      <Text style={s.emoji}>{emoji}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  iconFocused: { backgroundColor: Colors.primaryLight },
  emoji: { fontSize: 20 },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border, height: 58, paddingBottom: 4, paddingTop: 4 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        headerStyle: { backgroundColor: Colors.surface, shadowColor: 'transparent', elevation: 0 },
        headerTitleStyle: { fontSize: 18, fontWeight: '800', color: Colors.text },
      }}
    >
      <Tabs.Screen name="home" options={{ title: '홈', headerTitle: '칭찬스티커', tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }} />
      <Tabs.Screen name="praise" options={{ title: '칭찬', headerTitle: '칭찬 모아보기', tabBarIcon: ({ focused }) => <TabIcon emoji="💝" focused={focused} /> }} />
      <Tabs.Screen name="history" options={{ title: '기록', headerTitle: '지난 기록', tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} /> }} />
      <Tabs.Screen name="settings" options={{ title: '설정', headerTitle: '설정', tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} /> }} />
    </Tabs>
  );
}
