import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import Constants from "expo-constants";
import { useFocusEffect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import { Switch, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { Banner } from "@/components/Misc";
import { Screen } from "@/components/Screen";
import { ConfirmSheet, PromptSheet } from "@/components/Sheet";
import { TextField } from "@/components/TextField";
import { useAuth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";
import { feedback, haptic, playSound } from "@/lib/feedback";
import { registerForPushNotifications, unregisterPushNotifications } from "@/lib/notifications";
import { deleteMyAccount, getProfile, updateDisplayName } from "@/lib/projects";
import { useSettings, type MotionMode, type Settings, type ThemeMode } from "@/lib/settings";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";

function Row({ icon, label, detail, children }: { icon: keyof typeof Ionicons.glyphMap; label: string; detail?: string; children?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44 }}>
      <Ionicons name={icon} size={20} color={colors.accent} />
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{label}</AppText>
        {detail ? <AppText variant="caption">{detail}</AppText> : null}
      </View>
      {children}
    </View>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const { colors } = useTheme();
  return (
    <Switch
      accessibilityLabel={label}
      value={value}
      onValueChange={(v) => {
        haptic("selection");
        onChange(v);
      }}
      trackColor={{ true: colors.accent, false: colors.surfaceAlt }}
      thumbColor="#fff"
    />
  );
}

function Choice<T extends string | number>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => (
        <Chip key={String(o.value)} label={o.label} selected={value === o.value} onPress={() => onChange(o.value)} />
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { session, signOut } = useAuth();
  const { settings, update } = useSettings();
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      getProfile().then((p) => setName(p?.display_name ?? "")).catch(() => {});
    }, [])
  );

  const flash = (tone: "success" | "danger", text: string) => {
    setMessage({ tone, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => update({ [key]: value } as Partial<Settings>);

  async function sendPasswordReset() {
    const email = session?.user.email;
    if (!email) return;
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${API_BASE_URL}/auth/callback?next=/settings/password` });
    feedback.success();
    flash("success", `We sent a password reset link to ${email}.`);
  }

  async function toggleNotifications(on: boolean) {
    set("notificationsEnabled", on);
    if (on) {
      const ok = await registerForPushNotifications();
      if (!ok) flash("danger", "Notifications aren't available. Check your phone's settings for BuildBrief.");
    } else {
      await unregisterPushNotifications();
    }
  }

  return (
    <Screen>
      <AppText variant="title" accessibilityRole="header">Settings</AppText>
      {message ? <Banner tone={message.tone} icon={message.tone === "success" ? "checkmark-circle" : "alert-circle"} text={message.text} /> : null}

      <AppText variant="label">Account</AppText>
      <Card style={{ gap: 14 }}>
        <Row icon="person-circle-outline" label={name || "Your name"} detail={session?.user.email ?? ""}>
          <Button title="Edit" size="sm" variant="secondary" onPress={() => setEditingName(true)} />
        </Row>
        <Row icon="sync-outline" label="Synced everywhere" detail="Your projects are the same on this phone and on the website." />
      </Card>

      <AppText variant="label">Appearance</AppText>
      <Card style={{ gap: 16 }}>
        <View style={{ gap: 8 }}>
          <AppText variant="bodyStrong">Theme</AppText>
          <Choice<ThemeMode>
            options={[
              { value: "system", label: "Automatic" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
            value={settings.themeMode}
            onChange={(v) => set("themeMode", v)}
          />
        </View>
        <View style={{ gap: 8 }}>
          <AppText variant="bodyStrong">Text size</AppText>
          <Choice<Settings["textScale"]>
            options={[
              { value: 1, label: "Default" },
              { value: 1.15, label: "Large" },
              { value: 1.3, label: "Extra large" },
            ]}
            value={settings.textScale}
            onChange={(v) => set("textScale", v)}
          />
        </View>
        <View style={{ gap: 8 }}>
          <AppText variant="bodyStrong">Motion</AppText>
          <Choice<MotionMode>
            options={[
              { value: "system", label: "Match my phone" },
              { value: "reduced", label: "Reduced" },
              { value: "full", label: "Full" },
            ]}
            value={settings.motion}
            onChange={(v) => set("motion", v)}
          />
        </View>
      </Card>

      <AppText variant="label">Sound & feel</AppText>
      <Card style={{ gap: 14 }}>
        <Row icon="volume-high-outline" label="Sound effects" detail="Follows your phone's silent switch">
          <Toggle label="Sound effects" value={settings.soundEnabled} onChange={(v) => set("soundEnabled", v)} />
        </Row>
        {settings.soundEnabled ? (
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <AppText variant="caption">Volume</AppText>
              <AppText variant="caption">{Math.round(settings.soundVolume * 100)}%</AppText>
            </View>
            <Slider
              accessibilityLabel="Sound volume"
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              value={settings.soundVolume}
              onSlidingComplete={(v) => {
                set("soundVolume", v);
                setTimeout(() => playSound("complete"), 50);
              }}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.surfaceAlt}
              thumbTintColor={colors.accent}
            />
            <Button title="Play a test sound" size="sm" variant="secondary" icon="musical-notes-outline" onPress={() => playSound("fanfare")} withFeedback={false} />
          </View>
        ) : null}
        <Row icon="phone-portrait-outline" label="Haptic feedback" detail="Gentle taps when you press things">
          <Toggle label="Haptic feedback" value={settings.hapticsEnabled} onChange={(v) => set("hapticsEnabled", v)} />
        </Row>
        <Row icon="notifications-outline" label="Notifications" detail="When a blueprint or app finishes">
          <Toggle label="Notifications" value={settings.notificationsEnabled} onChange={toggleNotifications} />
        </Row>
      </Card>

      <AppText variant="label">Security</AppText>
      <Card style={{ gap: 12 }}>
        <Button title="Send password reset email" variant="secondary" icon="key-outline" fullWidth onPress={sendPasswordReset} />
        <Button
          title="Sign out"
          variant="secondary"
          icon="log-out-outline"
          fullWidth
          onPress={async () => {
            await unregisterPushNotifications();
            await signOut();
          }}
        />
        <Button title="Delete account" variant="danger" icon="trash-outline" fullWidth onPress={() => setConfirmDelete(true)} />
      </Card>

      <AppText variant="label">About</AppText>
      <Card style={{ gap: 12 }}>
        <Row icon="information-circle-outline" label="BuildBrief" detail={`Version ${Constants.expoConfig?.version ?? "1.0.0"} · From idea to application.`} />
        <Button title="Help & Support" variant="ghost" icon="help-buoy-outline" fullWidth onPress={() => WebBrowser.openBrowserAsync(`${API_BASE_URL}/support`)} />
        <Button title="Privacy Policy" variant="ghost" icon="shield-checkmark-outline" fullWidth onPress={() => WebBrowser.openBrowserAsync(`${API_BASE_URL}/privacy`)} />
        <Button title="Open BuildBrief on the web" variant="ghost" icon="globe-outline" fullWidth onPress={() => WebBrowser.openBrowserAsync(API_BASE_URL)} />
      </Card>

      <PromptSheet
        visible={editingName}
        onClose={() => setEditingName(false)}
        title="Your name"
        initialValue={name}
        placeholder="Your name"
        onSubmit={async (v) => {
          try {
            await updateDisplayName(v);
            setName(v);
            feedback.success();
          } catch (e) {
            feedback.error();
            flash("danger", e instanceof Error ? e.message : "Couldn't save.");
          }
        }}
      />

      <ConfirmSheet
        visible={confirmDelete}
        onClose={() => {
          setConfirmDelete(false);
          setDeleteText("");
        }}
        title="Delete your account?"
        message="This permanently deletes your account and every project, blueprint and built app, on this phone and on the website."
        confirmLabel="Delete forever"
        destructive
        confirmDisabled={deleteText !== "DELETE"}
        onConfirm={async () => {
          try {
            await deleteMyAccount();
            await signOut();
          } catch (e) {
            feedback.error();
            setConfirmDelete(false);
            flash("danger", e instanceof Error ? e.message : "Couldn't delete your account.");
          }
        }}
      >
        <TextField label="Type DELETE to confirm" value={deleteText} onChangeText={setDeleteText} autoCapitalize="characters" autoCorrect={false} />
      </ConfirmSheet>
    </Screen>
  );
}
