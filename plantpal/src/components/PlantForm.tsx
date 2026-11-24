import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PhotoPicker } from "./PhotoPicker";
import { colors, radius } from "../utils/theme";
import type { PlantInput } from "../types/plant";

const MAX_INTERVAL_DAYS = 365;

interface Props {
  initial?: PlantInput;
  submitLabel: string;
  onSubmit: (input: PlantInput) => Promise<void>;
}

/** Shared by Add Plant and Edit Plant. */
export function PlantForm({ initial, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [intervalText, setIntervalText] = useState(
    initial ? String(initial.wateringIntervalDays) : ""
  );
  const [photoUri, setPhotoUri] = useState<string | null>(initial?.photoUri ?? null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const trimmedName = name.trim();
    const days = Number(intervalText);

    if (!trimmedName) {
      setError("Give your plant a name.");
      return;
    }
    if (!Number.isInteger(days) || days < 1 || days > MAX_INTERVAL_DAYS) {
      setError(`Watering interval should be a whole number from 1 to ${MAX_INTERVAL_DAYS} days.`);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSubmit({ name: trimmedName, wateringIntervalDays: days, photoUri });
    } catch (err) {
      console.warn("[PlantForm] Save failed", err);
      setError("Couldn't save your plant. Please try again.");
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PhotoPicker uri={photoUri} onChange={setPhotoUri} />

        <View style={styles.field}>
          <Text style={styles.label}>Plant name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Monstera in the living room"
            placeholderTextColor={colors.muted}
            style={styles.input}
            maxLength={60}
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Water every (days)</Text>
          <TextInput
            value={intervalText}
            onChangeText={(text) => setIntervalText(text.replace(/[^0-9]/g, ""))}
            placeholder="e.g. 7"
            placeholderTextColor={colors.muted}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={handleSubmit}
          disabled={saving}
          style={({ pressed }) => [styles.submit, (pressed || saving) && styles.submitPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.submitText}>{saving ? "Saving…" : submitLabel}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "600", color: colors.text },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  error: { color: colors.overdue, fontSize: 14 },
  submit: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  submitPressed: { backgroundColor: colors.primaryPressed },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
