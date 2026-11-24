import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlantCard } from "../components/PlantCard";
import { getPlants } from "../services/plantService";
import { getPlantStatus, sortByUrgency } from "../utils/dateHelper";
import { colors, radius } from "../utils/theme";
import type { Plant } from "../types/plant";
import type { ScreenProps } from "../navigation/types";

export function HomeScreen({ navigation }: ScreenProps<"Home">) {
  const insets = useSafeAreaInsets();
  const [plants, setPlants] = useState<Plant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reload every time the screen comes back into view, so a watering or edit
  // made on another screen shows up immediately.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getPlants()
        .then((rows) => {
          if (!active) return;
          setPlants(sortByUrgency(rows));
          setError(null);
        })
        .catch((err) => {
          console.warn("[HomeScreen] Couldn't load plants", err);
          if (active) setError("Couldn't load your plants. Please reopen the app.");
        });
      return () => {
        active = false;
      };
    }, [])
  );

  const needsWater = plants?.filter((p) => getPlantStatus(p) !== "watered").length ?? 0;

  return (
    <View style={styles.container}>
      {plants === null && !error ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={plants ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 110 },
            plants?.length === 0 && styles.emptyList,
          ]}
          ItemSeparatorComponent={Separator}
          ListHeaderComponent={
            plants && plants.length > 0 ? (
              <Text style={styles.summary}>
                {needsWater === 0
                  ? "All your plants are happy today 🌿"
                  : `${needsWater} plant${needsWater === 1 ? " needs" : "s need"} some love today`}
              </Text>
            ) : undefined
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🪴</Text>
              <Text style={styles.emptyTitle}>No plants yet</Text>
              <Text style={styles.emptyText}>
                Tap the + button to add your first plant and we’ll remind you when it’s thirsty.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <PlantCard
              plant={item}
              onPress={() => navigation.navigate("PlantDetail", { plantId: item.id })}
            />
          )}
        />
      )}

      <Pressable
        onPress={() => navigation.navigate("AddPlant")}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + 24 },
          pressed && styles.fabPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add a plant"
      >
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { marginTop: 48 },
  error: { margin: 24, color: colors.overdue, fontSize: 15, textAlign: "center" },
  list: { padding: 16 },
  emptyList: { flexGrow: 1, justifyContent: "center" },
  separator: { height: 10 },
  summary: { fontSize: 15, color: colors.muted, marginBottom: 14, marginLeft: 2 },
  empty: { alignItems: "center", paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: colors.text, marginTop: 12 },
  emptyText: {
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 21,
  },
  fab: {
    position: "absolute",
    right: 24,
    width: 62,
    height: 62,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabPressed: { backgroundColor: colors.primaryPressed },
  fabIcon: { color: "#FFFFFF", fontSize: 34, lineHeight: 38, fontWeight: "400" },
});
