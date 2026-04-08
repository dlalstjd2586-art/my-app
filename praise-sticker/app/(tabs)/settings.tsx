import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';
import { useRelationshipStore } from '@/stores/relationshipStore';
import { useDemoStore } from '@/stores/demoStore';
import { DEMO_USER, DEMO_PARTNER } from '@/lib/demo-data';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { partner } = useRelationshipStore();
  const { isDemoMode, disableDemo } = useDemoStore();

  const displayUser = isDemoMode ? DEMO_USER : user;
  const displayPartner = isDemoMode ? DEMO_PARTNER : partner;

  const handleSignOut = () => {
    if (isDemoMode) {
      disableDemo();
      router.replace('/login');
      return;
    }
    Alert.alert('로그아웃', '정말 로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isDemoMode && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>데모 모드 - 가짜 데이터로 체험 중</Text>
        </View>
      )}

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>프로필</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>닉네임</Text>
            <Text style={styles.value}>{displayUser?.nickname ?? '-'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>로그인 방식</Text>
            <Text style={styles.value}>{isDemoMode ? '데모' : displayUser?.auth_provider ?? '-'}</Text>
          </View>
        </View>
      </View>

      {/* Relationship Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>관계</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>파트너</Text>
            <Text style={styles.value}>{displayPartner?.nickname ?? '-'}</Text>
          </View>
        </View>
      </View>

      {/* App Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>앱 정보</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>버전</Text>
            <Text style={styles.value}>1.0.0 (MVP)</Text>
          </View>
        </View>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Text style={styles.logoutText}>
            {isDemoMode ? '데모 모드 종료' : '로그아웃'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, gap: 24, paddingBottom: 40 },
  demoBanner: { backgroundColor: '#FFF3E0', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' },
  demoBannerText: { fontSize: 13, fontWeight: '600', color: '#E65100' },
  section: { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, paddingLeft: 4 },
  card: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },
  label: { fontSize: 15, color: Colors.text },
  value: { fontSize: 15, color: Colors.textSecondary },
  logoutButton: { backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, paddingVertical: 14, alignItems: 'center' },
  logoutText: { fontSize: 15, fontWeight: '600', color: Colors.error },
});
