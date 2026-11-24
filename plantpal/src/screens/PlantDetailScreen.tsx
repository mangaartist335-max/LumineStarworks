import { useCallback, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PlantPhoto } from "../components/PlantPhoto";
import { PlantStatusBadge } from "../components/PlantStatusBadge";
import {
  deletePlant,
  getPlant,
  getWateringLog,
  markWatered,
} from "../services/plantService";
import {
  daysUntilNextWater,
  describeNextWater,
  formatFriendlyDate,
  formatInterval,
  getPlantStatus,
  todayString,
} from "../utils/dateHelper";
import { colors, radius } from "../utils/theme";
import type { Plant, WateringLogEntry } from "../types/plant";
import type { ScreenProps } from "../navigation/types";

export function PlantDetailScreen({ navigation, route }: ScreenProps<"PlantDetail">) {
  const { plantId } = route.params;
  const [plant, setPlant] = useState<Plant | null | undefined>(undefined);
  const [log, setLog] = useState<WateringLogEntry[]>([]);
  const [watering, setWatering] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [row, entries] = await Promise.all([getPlant(plantId), getWateringLog(plantId)]);
      setPlant(row);
      setLog(entries);
    } catch (err) {
      console.warn("[PlantDetailScreen] Couldn't load plant", err);
      setPlant(null);
    }
  }, [plantId]);

  // Refresh when coming back from the Edit screen.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        plant ? (
          <Pressable
            onPress={() => navigation.navigate("EditPlant", { plantId })}
            hitSlop={10}
            accessibilityRole="button"
          >
            <Text style={styles.headerAction}>Edit</Text>
          </Pressable>
        ) : null,
    });
  }, [navigation, plant, plantId]);

  async function handleWatered() {
    setWatering(true);
    setMessage(null);
    try {
      await markWatered(plantId);
      await load();
      setMessage("Nice! Watering logged 💧");
    } catch (err) {
      console.warn("[PlantDetailScreen] Couldn't log watering", err);
      setMessage("Couldn't log that watering. Please try again.");
    } finally {
      setWatering(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deletePlant(plantId);
      setConfirmDelete(false);
      navigation.popToTop();
    } catch (err) {
      console.warn("[PlantDetailScreen] Couldn't delete plant", err);
      setDeleting(false);
      setConfirmDelete(false);
      setMessage("Couldn't delete this plant. Please try again.");
    }
  }

  if (plant === undefined) {
    return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  }
  if (plant === null) {
    return <Text style={styles.missing}>This plant couldn’t be found.</Text>;
  }

  const status = getPlantStatus(plant);
  const daysLeft = daysUntilNextWater(plant);
  const wateredToday = plant.last_watered_date === todayString();

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <PlantPhoto uri={plant.photo_uri} size={200} rounded={radius.lg} />
          <Text style={styles.name}>{plant.name}</Text>
          <PlantStatusBadge status={status} />
        </View>

        <View style={styles.countdown}>
          <Text style={styles.countdownNumber}>{Math.max(daysLeft, 0)}</Text>
          <Text style={styles.countdownLabel}>
            {daysLeft > 0
              ? `day${daysLeft === 1 ? "" : "s"} until next watering`
              : describeNextWater(plant)}
          </Text>
        </View>

        <View style={styles.stats}>
          <Stat label="Schedule" value={formatInterval(plant.watering_interval_days)} />
          <Stat label="Last watered" value={formatFriendlyDate(plant.last_watered_date)} />
        </View>

        <Pressable
          onPress={handleWatered}
          disabled={watering}
          style={({ pressed }) => [styles.water, (pressed || watering) && styles.waterPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.waterText}>
            {watering ? "Logging…" : wateredToday ? "💧 Watered again" : "💧 Watered"}
          </Text>
        </Pressable>
        {message ? <Text style={styles.message}>{message}</Text> : null}

        {log.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent waterings</Text>
            {log.map((entry) => (
              <Text key={entry.id} style={styles.logItem}>
                • {formatFriendlyDate(entry.watered_date)}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            onPress={() => navigation.navigate("EditPlant", { plantId })}
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>Edit plant</Text>
          </Pressable>
          <Pressable
            onPress={() => setConfirmDelete(true)}
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={[styles.secondaryText, { color: colors.overdue }]}>Delete plant</Text>
          </Pressable>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmDelete}
        title={`Delete ${plant.name}?`}
        message="This removes the plant and its watering history from this device."
        confirmLabel="Delete"
        destructive
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  loading: { marginTop: 48 },
  missing: { margin: 24, fontSize: 15, color: colors.muted, textAlign: "center" },
  content: { padding: 20, paddingBottom: 48, gap: 18 },
  headerAction: { color: colors.primary, fontSize: 17, fontWeight: "600" },
  hero: { alignItems: "center", gap: 10 },
  name: { fontSize: 26, fontWeight: "800", color: colors.text, textAlign: "center" },
  countdown: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 18,
  },
  countdownNumber: { fontSize: 44, fontWeight: "800", color: colors.primary },
  countdownLabel: { fontSize: 15, color: colors.muted },
  stats: { flexDirection: "row", gap: 12 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 4,
  },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: "600", textTransform: "uppercase" },
  statValue: { fontSize: 16, color: colors.text, fontWeight: "700" },
  water: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 20,
    alignItems: "center",
  },
  waterPressed: { backgroundColor: colors.primaryPressed },
  waterText: { color: "#FFFFFF", fontSize: 19, fontWeight: "800" },
  message: { textAlign: "center", color: colors.muted, fontSize: 14 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  logItem: { fontSize: 15, color: colors.muted },
  actions: { flexDirection: "row", gap: 12, marginTop: 4 },
  secondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  secondaryText: { fontSize: 15, fontWeight: "600", color: colors.text },
  pressed: { opacity: 0.8 },
});
