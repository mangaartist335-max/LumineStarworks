import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { PlantPhoto } from "./PlantPhoto";
import { colors, radius } from "../utils/theme";

interface Props {
  uri: string | null;
  onChange: (uri: string | null) => void;
}

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.7,
};

export function PhotoPicker({ uri, onChange }: Props) {
  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Camera access needed",
        "Allow camera access in Settings to snap a photo of your plant."
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!result.canceled && result.assets[0]) onChange(result.assets[0].uri);
  }

  async function chooseFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Photo access needed",
        "Allow photo library access in Settings to pick a picture of your plant."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled && result.assets[0]) onChange(result.assets[0].uri);
  }

  return (
    <View style={styles.container}>
      <PlantPhoto uri={uri} size={140} rounded={radius.lg} />
      <View style={styles.buttons}>
        <PickerButton label="📷  Take photo" onPress={takePhoto} />
        <PickerButton label="🖼️  Choose photo" onPress={chooseFromLibrary} />
        {uri ? <PickerButton label="Remove photo" onPress={() => onChange(null)} subtle /> : null}
      </View>
    </View>
  );
}

function PickerButton({
  label,
  onPress,
  subtle = false,
}: {
  label: string;
  onPress: () => void;
  subtle?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, subtle && styles.subtle, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Text style={[styles.buttonText, subtle && styles.subtleText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 14 },
  buttons: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.wateredSoft,
  },
  buttonText: { fontSize: 14, fontWeight: "600", color: colors.primary },
  subtle: { backgroundColor: "transparent" },
  subtleText: { color: colors.muted },
  pressed: { opacity: 0.75 },
});
