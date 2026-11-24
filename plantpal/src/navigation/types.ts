import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Home: undefined;
  AddPlant: undefined;
  PlantDetail: { plantId: number };
  EditPlant: { plantId: number };
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
