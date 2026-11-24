import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { Banner } from "@/components/Misc";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { feedback } from "@/lib/feedback";
import { createProject } from "@/lib/projects";
import { CATEGORIES, TEMPLATES } from "@/lib/templates";
import type { ProjectType } from "@/shared/types";
import { useTheme } from "@/theme";

const EXPERIENCE = ["Beginner", "Some experience", "Experienced developer"];
const BUDGET = ["Free tools only", "Small budget", "Flexible budget"];
const PLATFORMS = ["iPhone", "Android", "Web", "Windows", "Mac"];
const TIMEFRAME = ["A weekend", "1–2 weeks", "About a month", "Longer"];

function SingleChoice({ options, value, onChange }: { options: string[]; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => (
        <Chip key={o} label={o} selected={value === o} onPress={() => onChange(value === o ? null : o)} />
      ))}
    </View>
  );
}

export default function Create() {
  const { colors, reduceMotion } = useTheme();
  const params = useLocalSearchParams<{ template?: string; idea?: string; t?: string }>();
  const [name, setName] = useState("");
  const [type, setType] = useState<ProjectType>("Mobile App");
  const [idea, setIdea] = useState("");
  const [targetUser, setTargetUser] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [experience, setExperience] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [timeframe, setTimeframe] = useState<string | null>(null);
  const [tech, setTech] = useState("");
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateTitle, setTemplateTitle] = useState<string | null>(null);

  // Prefill from a template or the Home screen's quick idea. Each visit
  // carries a unique "t" so picking the same template twice still applies.
  const prefillKey = params.template || params.idea ? `${params.t ?? ""}|${params.template ?? ""}|${params.idea ?? ""}` : null;
  const [appliedKey, setAppliedKey] = useState<string | null>(null);
  if (prefillKey && prefillKey !== appliedKey) {
    setAppliedKey(prefillKey);
    const t = TEMPLATES.find((x) => x.id === params.template);
    if (t) {
      setName(t.title === "MMORPG" ? "My MMORPG" : `My ${t.title}`);
      setType(t.type);
      setIdea(t.idea);
      setTargetUser(t.targetUser);
      setTemplateTitle(t.title);
    } else if (params.idea) {
      setIdea(params.idea);
      setTemplateTitle(null);
    }
  }

  function reset() {
    setName("");
    setIdea("");
    setTargetUser("");
    setExperience(null);
    setBudget(null);
    setPlatforms([]);
    setTimeframe(null);
    setTech("");
    setExtra("");
    setTemplateTitle(null);
    setShowMore(false);
  }

  async function generate() {
    setError(null);
    if (idea.trim().length < 20) {
      feedback.error();
      setError("Tell us a bit more about your idea (at least a sentence or two).");
      return;
    }
    const details = [
      experience && `Builder's experience level: ${experience}.`,
      budget && `Budget: ${budget}.`,
      platforms.length ? `Target platforms: ${platforms.join(", ")}.` : null,
      timeframe && `Timeframe to build it: ${timeframe}.`,
      extra.trim() || null,
    ].filter(Boolean);

    setBusy(true);
    feedback.start();
    try {
      const project = await createProject({
        name: name.trim() || "Untitled project",
        projectType: type,
        idea: idea.trim(),
        targetUser: targetUser.trim() || "General users",
        preferredTech: tech.trim() || null,
        extraRequirements: details.length ? details.join(" ").slice(0, 2000) : null,
      });
      reset();
      router.push(`/project/${project.id}`);
    } catch (e) {
      feedback.error();
      setError(e instanceof Error ? e.message : "Couldn't start your blueprint. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <AppText variant="title" accessibilityRole="header">Create a project</AppText>
        <AppText color="muted">Describe anything you want to build, in your own words.</AppText>
      </View>

      {templateTitle ? <Banner tone="success" icon="sparkles" text={`Started from the ${templateTitle} template. Make it yours: change anything below.`} /> : null}

      <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Bubble Pop Garden" maxLength={80} />

      <View style={{ gap: 8 }}>
        <AppText variant="bodyStrong">What kind of thing is it?</AppText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {CATEGORIES.map((c) => (
            <Chip key={c.type} label={c.label} emoji={c.emoji} selected={type === c.type} onPress={() => setType(c.type)} />
          ))}
        </View>
      </View>

      <TextField
        label="Describe your idea"
        hint={`${idea.trim().length} characters`}
        value={idea}
        onChangeText={setIdea}
        multiline
        placeholder="What does it do? Who taps what? What makes it fun or useful?"
        style={{ minHeight: 150 }}
      />
      <TextField label="Who is it for?" value={targetUser} onChangeText={setTargetUser} placeholder="e.g. Casual players who want a calm game" />

      <Pressable
        onPress={() => {
          feedback.select();
          setShowMore((s) => !s);
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: showMore }}
        style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 }}
      >
        <Ionicons name={showMore ? "chevron-up" : "options-outline"} size={18} color={colors.accent} />
        <AppText variant="bodyStrong" style={{ color: colors.accent }}>
          {showMore ? "Hide extra details" : "Add more details (optional)"}
        </AppText>
      </Pressable>

      {showMore ? (
        <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(200)}>
          <Card style={{ gap: 16 }}>
            <View style={{ gap: 8 }}>
              <AppText variant="bodyStrong">Your experience</AppText>
              <SingleChoice options={EXPERIENCE} value={experience} onChange={setExperience} />
            </View>
            <View style={{ gap: 8 }}>
              <AppText variant="bodyStrong">Budget</AppText>
              <SingleChoice options={BUDGET} value={budget} onChange={setBudget} />
            </View>
            <View style={{ gap: 8 }}>
              <AppText variant="bodyStrong">Platforms</AppText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {PLATFORMS.map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    selected={platforms.includes(p)}
                    onPress={() => setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]))}
                  />
                ))}
              </View>
            </View>
            <View style={{ gap: 8 }}>
              <AppText variant="bodyStrong">Timeframe</AppText>
              <SingleChoice options={TIMEFRAME} value={timeframe} onChange={setTimeframe} />
            </View>
            <TextField label="Preferred technology" hint="Optional" value={tech} onChangeText={setTech} placeholder="e.g. React Native, or leave empty and we'll choose" />
            <TextField label="Anything else?" hint="Optional" value={extra} onChangeText={setExtra} placeholder="e.g. dark mode, pixel-art style, works offline" />
          </Card>
        </Animated.View>
      ) : null}

      {error ? <Banner tone="danger" icon="alert-circle" text={error} /> : null}

      <Button title="Generate Blueprint" icon="sparkles" size="lg" fullWidth loading={busy} onPress={generate} withFeedback={false} />
      <AppText variant="caption" align="center" color="faint">
        Takes about a minute. You’ll get a notification when it’s ready.
      </AppText>
    </Screen>
  );
}
