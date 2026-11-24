import { Pressable, StyleSheet, Text, View } from "react-native";
import { PlantPhoto } from "./PlantPhoto";
import { PlantStatusBadge } from "./PlantStatusBadge";
import { describeNextWater, formatInterval, getPlantStatus } from "../utils/dateHelper";
import { colors, radius } from "../utils/theme";
import type { Plant } from "../types/plant";

interface Props {
  plant: Plant;
  onPress: () => void;
}

export function PlantCard({ plant, onPress }: Props) {
  const status = getPlantStatus(plant);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${plant.name}, ${describeNextWater(plant)}`}
    >
      <PlantPhoto uri={plant.photo_uri} size={64} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {plant.name}
        </Text>
        <Text style={styles.meta}>
          {formatInterval(plant.watering_interval_days)} · {describeNextWater(plant)}
        </Text>
        <PlantStatusBadge status={status} />
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85 },
  body: { flex: 1, gap: 4 },
  name: { fontSize: 17, fontWeight: "700", color: colors.text },
  meta: { fontSize: 13, color: colors.muted },
  chevron: { fontSize: 26, color: colors.muted, marginLeft: 4 },
});
