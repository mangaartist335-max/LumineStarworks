import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "../screens/HomeScreen";
import { AddPlantScreen } from "../screens/AddPlantScreen";
import { PlantDetailScreen } from "../screens/PlantDetailScreen";
import { EditPlantScreen } from "../screens/EditPlantScreen";
import { colors } from "../utils/theme";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: "700" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "PlantPal" }} />
      <Stack.Screen
        name="AddPlant"
        component={AddPlantScreen}
        options={{ title: "Add Plant", presentation: "modal" }}
      />
      <Stack.Screen name="PlantDetail" component={PlantDetailScreen} options={{ title: "" }} />
      <Stack.Screen name="EditPlant" component={EditPlantScreen} options={{ title: "Edit Plant" }} />
    </Stack.Navigator>
  );
}
