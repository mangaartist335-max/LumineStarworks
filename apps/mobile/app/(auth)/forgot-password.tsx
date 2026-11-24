import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Banner } from "@/components/Misc";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { API_BASE_URL } from "@/lib/config";
import { feedback } from "@/lib/feedback";
import { supabase } from "@/lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!email.trim()) return setError("Enter your email.");
    setBusy(true);
    setError(null);
    // The link opens the website, where they choose a new password.
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${API_BASE_URL}/auth/callback?next=/settings/password`,
    });
    setBusy(false);
    setSent(true);
    feedback.success();
  }

  return (
    <Screen contentStyle={{ gap: 20 }}>
      <View style={{ gap: 6 }}>
        <AppText variant="title">Reset your password</AppText>
        <AppText color="muted">We’ll email you a link to choose a new one.</AppText>
      </View>
      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@example.com" onSubmitEditing={submit} />
      {error ? <Banner tone="danger" icon="alert-circle" text={error} /> : null}
      {sent ? <Banner tone="success" icon="mail" text="If there's an account for that email, a reset link is on its way. Open it, choose a new password, then sign in here." /> : null}
      <Button title="Send reset link" size="lg" fullWidth loading={busy} onPress={submit} />
      <Button title="Back to sign in" variant="ghost" fullWidth onPress={() => router.back()} />
    </Screen>
  );
}
