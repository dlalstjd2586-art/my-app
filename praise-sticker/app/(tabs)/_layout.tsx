import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Text, View, StyleSheet } from 'react-native';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={tabStyles.iconWrap}>
      <Text style={[tabStyles.emoji, focused && tabStyles.emojiFocused]}>{emoji}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22 },
  emojiFocused: { fontSize: 24 },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 6,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '800',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: '홈',
          headerTitle: '⭐ 칭찬스티커',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="홈" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="praise"
        options={{
          title: '칭찬',
          headerTitle: '💝 칭찬 모아보기',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💝" label="칭찬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '기록',
          headerTitle: '📋 지난 기록',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="기록" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          headerTitle: '⚙️ 설정',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" label="설정" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
