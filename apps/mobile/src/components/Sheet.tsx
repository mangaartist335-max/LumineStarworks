import { Ionicons } from "@expo/vector-icons";
import { useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { feedback } from "@/lib/feedback";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { TextField } from "./TextField";

/** Bottom sheet container (works the same on iOS and Android; back button closes it). */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const { colors, radius, reduceMotion } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType={reduceMotion ? "fade" : "slide"} onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: colors.overlay }} onPress={onClose} accessibilityLabel="Close" />
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: 20,
            paddingBottom: insets.bottom + 20,
            gap: 12,
            width: "100%",
            maxWidth: 640,
            alignSelf: "center",
          }}
        >
          <View style={{ alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong }} />
          {title ? <AppText variant="heading">{title}</AppText> : null}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export interface SheetAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
}

export function ActionSheet({ visible, onClose, title, actions }: { visible: boolean; onClose: () => void; title?: string; actions: SheetAction[] }) {
  const { colors, radius } = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {actions.map((a) => (
        <Pressable
          key={a.label}
          accessibilityRole="button"
          onPress={() => {
            feedback.tap();
            onClose();
            setTimeout(a.onPress, 250);
          }}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            padding: 14,
            borderRadius: radius.md,
            backgroundColor: pressed ? colors.surfaceAlt : "transparent",
          })}
        >
          <Ionicons name={a.icon} size={20} color={a.destructive ? colors.danger : colors.text} />
          <AppText variant="bodyStrong" style={{ color: a.destructive ? colors.danger : colors.text }}>
            {a.label}
          </AppText>
        </Pressable>
      ))}
    </Sheet>
  );
}

export function ConfirmSheet({
  visible,
  onClose,
  title,
  message,
  confirmLabel,
  destructive,
  onConfirm,
  confirmDisabled,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => Promise<void> | void;
  confirmDisabled?: boolean;
  children?: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Sheet visible={visible} onClose={() => !busy && onClose()} title={title}>
      <AppText color="muted">{message}</AppText>
      {children}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
        <Button title="Cancel" variant="secondary" style={{ flex: 1 }} fullWidth onPress={onClose} disabled={busy} />
        <Button
          title={confirmLabel}
          variant={destructive ? "danger" : "primary"}
          style={{ flex: 1 }}
          fullWidth
          loading={busy}
          disabled={confirmDisabled}
          onPress={async () => {
            setBusy(true);
            try {
              await onConfirm();
            } finally {
              setBusy(false);
            }
          }}
        />
      </View>
    </Sheet>
  );
}

export function PromptSheet({
  visible,
  onClose,
  title,
  initialValue,
  placeholder,
  confirmLabel = "Save",
  multiline,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  initialValue: string;
  placeholder?: string;
  confirmLabel?: string;
  multiline?: boolean;
  onSubmit: (value: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setValue(initialValue);
  }
  return (
    <Sheet visible={visible} onClose={() => !busy && onClose()} title={title}>
      <TextField value={value} onChangeText={setValue} placeholder={placeholder} autoFocus multiline={multiline} />
      <Button
        title={confirmLabel}
        fullWidth
        loading={busy}
        disabled={!value.trim()}
        onPress={async () => {
          setBusy(true);
          try {
            await onSubmit(value.trim());
            onClose();
          } finally {
            setBusy(false);
          }
        }}
      />
    </Sheet>
  );
}
