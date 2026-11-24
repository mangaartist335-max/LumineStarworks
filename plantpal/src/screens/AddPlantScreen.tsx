import { PlantForm } from "../components/PlantForm";
import { addPlant } from "../services/plantService";
import type { ScreenProps } from "../navigation/types";

export function AddPlantScreen({ navigation }: ScreenProps<"AddPlant">) {
  return (
    <PlantForm
      submitLabel="Save plant"
      onSubmit={async (input) => {
        await addPlant(input);
        navigation.goBack();
      }}
    />
  );
}
