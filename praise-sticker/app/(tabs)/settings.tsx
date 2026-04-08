import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';
import { useRelationshipStore } from '@/stores/relationshipStore';

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();
  const { partner, relationship } = useRelationshipStore();

  const handleSignOut = () => {
    Alert.alert('로그아웃', '정말 로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleDisconnect = () => {
    Alert.alert(
      '관계 해제',
      '정말 파트너와의 연결을 끊을까요?\n진행 중인 모든 스티커판이 종료됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '해제',
          style: 'destructive',
          onPress: () => {
            // TODO: implement end-relationship edge function
            Alert.alert('알림', '관계 해제 기능은 준비 중이에요');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>프로필</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>닉네임</Text>
            <Text style={styles.value}>{user?.nickname ?? '-'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>로그인 방식</Text>
            <Text style={styles.value}>{user?.auth_provider ?? '-'}</Text>
          </View>
        </View>
      </View>

      {/* Relationship Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>관계</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>파트너</Text>
            <Text style={styles.value}>{partner?.nickname ?? '-'}</Text>
          </View>
          {relationship && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.row} onPress={handleDisconnect}>
                <Text style={[styles.label, { color: Colors.error }]}>관계 해제</Text>
              </TouchableOpacity>
            </>
          )}
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
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    gap: 24,
    paddingBottom: 40,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  label: {
    fontSize: 15,
    color: Colors.text,
  },
  value: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  logoutButton: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.error,
  },
});
