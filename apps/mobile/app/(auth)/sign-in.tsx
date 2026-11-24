import { Link, router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { Wordmark } from "@/components/Brand";
import { Button } from "@/components/Button";
import { Banner } from "@/components/Misc";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { friendlyAuthError } from "@/lib/auth";
import { feedback } from "@/lib/feedback";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";

export default function SignIn() {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) {
      feedback.error();
      setError(friendlyAuthError(err.message));
      return;
    }
    feedback.success();
    router.replace("/(tabs)");
  }

  return (
    <Screen contentStyle={{ gap: 22 }}>
      <Wordmark />
      <View style={{ gap: 6 }}>
        <AppText variant="title">Welcome back</AppText>
        <AppText color="muted">Sign in to pick up where you left off, on any device.</AppText>
      </View>
      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" placeholder="you@example.com" returnKeyType="next" />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" placeholder="••••••••" returnKeyType="go" onSubmitEditing={submit} />
      {error ? <Banner tone="danger" icon="alert-circle" text={error} /> : null}
      <Button title="Sign in" size="lg" fullWidth loading={busy} onPress={submit} />
      <Link href="/(auth)/forgot-password" style={{ alignSelf: "center" }}>
        <AppText variant="bodyStrong" style={{ color: colors.accent }}>Forgot password?</AppText>
      </Link>
      <Link href="/(auth)/sign-up" replace style={{ alignSelf: "center" }}>
        <AppText color="muted">New here? <AppText variant="bodyStrong" style={{ color: colors.accent }}>Create an account</AppText></AppText>
      </Link>
    </Screen>
  );
}
