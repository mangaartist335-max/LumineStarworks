import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { PlantForm } from "../components/PlantForm";
import { getPlant, updatePlant } from "../services/plantService";
import { colors } from "../utils/theme";
import type { Plant } from "../types/plant";
import type { ScreenProps } from "../navigation/types";

export function EditPlantScreen({ navigation, route }: ScreenProps<"EditPlant">) {
  const { plantId } = route.params;
  const [plant, setPlant] = useState<Plant | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    getPlant(plantId)
      .then((row) => active && setPlant(row))
      .catch((err) => {
        console.warn("[EditPlantScreen] Couldn't load plant", err);
        if (active) setPlant(null);
      });
    return () => {
      active = false;
    };
  }, [plantId]);

  if (plant === undefined) {
    return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  }
  if (plant === null) {
    return <Text style={styles.missing}>This plant couldn’t be found.</Text>;
  }

  return (
    <PlantForm
      submitLabel="Save changes"
      initial={{
        name: plant.name,
        wateringIntervalDays: plant.watering_interval_days,
        photoUri: plant.photo_uri,
      }}
      onSubmit={async (input) => {
        await updatePlant(plantId, input);
        navigation.goBack();
      }}
    />
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: 48 },
  missing: { margin: 24, fontSize: 15, color: colors.muted, textAlign: "center" },
});
