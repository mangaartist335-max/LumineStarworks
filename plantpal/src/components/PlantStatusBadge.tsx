import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../utils/theme";
import type { PlantStatus } from "../types/plant";

const STYLES: Record<PlantStatus, { label: string; color: string; background: string }> = {
  overdue: { label: "Overdue", color: colors.overdue, background: colors.overdueSoft },
  dueToday: { label: "Due Today", color: colors.dueToday, background: colors.dueTodaySoft },
  watered: { label: "Watered", color: colors.watered, background: colors.wateredSoft },
};

export function PlantStatusBadge({ status }: { status: PlantStatus }) {
  const style = STYLES[status];
  return (
    <View style={[styles.badge, { backgroundColor: style.background }]}>
      <View style={[styles.dot, { backgroundColor: style.color }]} />
      <Text style={[styles.label, { color: style.color }]}>{style.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { fontSize: 12, fontWeight: "700" },
});
