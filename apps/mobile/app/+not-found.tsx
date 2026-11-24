import { router } from "expo-router";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";

export default function NotFound() {
  return (
    <Screen contentStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", gap: 14 }}>
      <AppText style={{ fontSize: 48 }}>🧭</AppText>
      <AppText variant="heading" align="center">That page wandered off</AppText>
      <Button title="Go home" onPress={() => router.replace("/")} />
    </Screen>
  );
}
