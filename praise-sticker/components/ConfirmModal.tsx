// 웹 + 네이티브 모두 호환되는 확인 모달
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Colors } from '@/constants/Colors';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible, title, message, confirmText = '확인', cancelText = '취소',
  confirmColor = Colors.primary, onConfirm, onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: confirmColor }]} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, marginHorizontal: 32, width: '85%', maxWidth: 340, gap: 12 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  message: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F0F0F0', alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  confirmText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
