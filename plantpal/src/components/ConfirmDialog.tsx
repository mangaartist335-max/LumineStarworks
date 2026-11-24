import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../utils/theme";

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityRole="alert">
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              disabled={busy}
              style={({ pressed }) => [styles.button, styles.cancel, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={busy}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: destructive ? colors.overdue : colors.primary },
                (pressed || busy) && styles.pressed,
              ]}
            >
              <Text style={styles.confirmText}>{busy ? "Working…" : confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 22,
  },
  title: { fontSize: 19, fontWeight: "700", color: colors.text },
  message: { fontSize: 15, color: colors.muted, marginTop: 8, lineHeight: 21 },
  actions: { flexDirection: "row", gap: 10, marginTop: 22 },
  button: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.md,
    alignItems: "center",
  },
  cancel: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  cancelText: { fontSize: 15, fontWeight: "600", color: colors.text },
  confirmText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  pressed: { opacity: 0.8 },
});
