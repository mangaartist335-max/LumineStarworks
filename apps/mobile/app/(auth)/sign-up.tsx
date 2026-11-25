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
import { API_BASE_URL } from "@/lib/config";
import { feedback } from "@/lib/feedback";
import { supabase } from "@/lib/supabase";
import * as WebBrowser from "expo-web-browser";
import { useTheme } from "@/theme";

export default function SignUp() {
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) return setError("Enter your email and a password.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    setBusy(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: name.trim() || email.trim().split("@")[0] },
        // Email confirmation links open the website, which signs the user in.
        emailRedirectTo: `${API_BASE_URL}/auth/callback`,
      },
    });
    setBusy(false);
    if (err) {
      feedback.error();
      return setError(friendlyAuthError(err.message));
    }
    if (!data.session) {
      feedback.success();
      return setInfo("Check your inbox to confirm your email, then come back and sign in.");
    }
    feedback.complete();
    router.replace("/(tabs)");
  }

  return (
    <Screen contentStyle={{ gap: 20 }}>
      <Wordmark />
      <View style={{ gap: 6 }}>
        <AppText variant="title">Create your account</AppText>
        <AppText color="muted">Free to start. Your projects sync between your phone and computer.</AppText>
      </View>
      <TextField label="Your name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" placeholder="Ada Lovelace" />
      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" placeholder="you@example.com" />
      <TextField label="Password" hint="8+ characters" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" placeholder="••••••••" onSubmitEditing={submit} />
      {error ? <Banner tone="danger" icon="alert-circle" text={error} /> : null}
      {info ? <Banner tone="success" icon="mail" text={info} /> : null}
      <Button title="Create account" size="lg" fullWidth loading={busy} onPress={submit} icon="sparkles" />
      <AppText variant="caption" align="center" color="faint">
        By creating an account you agree to our{" "}
        <AppText variant="caption" style={{ color: colors.accent }} onPress={() => WebBrowser.openBrowserAsync(`${API_BASE_URL}/privacy`)} accessibilityRole="link">
          Privacy Policy
        </AppText>
        .
      </AppText>
      <Link href="/(auth)/sign-in" replace style={{ alignSelf: "center" }}>
        <AppText color="muted">Already have an account? <AppText variant="bodyStrong" style={{ color: colors.accent }}>Sign in</AppText></AppText>
      </Link>
    </Screen>
  );
}
