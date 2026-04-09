import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';
import { useRelationshipStore } from '@/stores/relationshipStore';
import { useDemoStore } from '@/stores/demoStore';
import { DEMO_USER, DEMO_PARTNER } from '@/lib/demo-data';
import ConfirmModal from '@/components/ConfirmModal';
import { useState } from 'react';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { partner } = useRelationshipStore();
  const { isDemoMode, disableDemo } = useDemoStore();
  const [showLogout, setShowLogout] = useState(false);

  const displayUser = isDemoMode ? DEMO_USER : user;
  const displayPartner = isDemoMode ? DEMO_PARTNER : partner;

  const handleSignOut = () => {
    if (isDemoMode) {
      disableDemo();
      router.replace('/login');
    } else {
      signOut();
    }
    setShowLogout(false);
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* 프로필 카드 */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{displayUser?.nickname?.[0] ?? '?'}</Text>
          </View>
          <Text style={styles.profileName}>{displayUser?.nickname ?? '-'}</Text>
          <Text style={styles.profileProvider}>
            {isDemoMode ? '데모 모드' : displayUser?.auth_provider === 'google' ? 'Google 계정' : displayUser?.auth_provider ?? '-'}
          </Text>
        </View>

        {/* 관계 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>파트너</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.partnerAvatar}><Text style={styles.partnerAvatarText}>{displayPartner?.nickname?.[0] ?? '?'}</Text></View>
              <Text style={styles.rowValue}>{displayPartner?.nickname ?? '연결 안 됨'}</Text>
            </View>
          </View>
        </View>

        {/* 앱 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>앱 정보</Text>
          <View style={styles.card}>
            <View style={styles.simpleRow}>
              <Text style={styles.rowLabel}>버전</Text>
              <Text style={styles.rowValue}>1.0.0</Text>
            </View>
          </View>
        </View>

        {/* 로그아웃 */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogout(true)}>
          <Text style={styles.logoutText}>{isDemoMode ? '데모 모드 종료' : '로그아웃'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmModal
        visible={showLogout}
        title={isDemoMode ? '데모 종료' : '로그아웃'}
        message={isDemoMode ? '데모 모드를 종료할까요?' : '정말 로그아웃할까요?'}
        confirmText={isDemoMode ? '종료' : '로그아웃'}
        confirmColor={Colors.error}
        onConfirm={handleSignOut}
        onCancel={() => setShowLogout(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, gap: 20, paddingBottom: 40 },

  profileCard: {
    backgroundColor: Colors.primary, borderRadius: 20, padding: 28, alignItems: 'center', gap: 8,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
  },
  profileAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  profileAvatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  profileName: { fontSize: 22, fontWeight: '800', color: '#fff' },
  profileProvider: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  section: { gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, paddingLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  simpleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  partnerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  partnerAvatarText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  rowLabel: { fontSize: 15, color: Colors.text },
  rowValue: { fontSize: 15, color: Colors.textSecondary, fontWeight: '600' },

  logoutBtn: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, paddingVertical: 14, alignItems: 'center' },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.error },
});
