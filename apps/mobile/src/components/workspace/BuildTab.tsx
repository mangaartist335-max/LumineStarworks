import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { feedback } from "@/lib/feedback";
import { shareFile } from "@/lib/exporter";
import { getAppHtml, startAppBuild, type ProjectDetail } from "@/lib/projects";
import { useJobPoll } from "@/lib/useJobPoll";
import { withAudioBoost } from "@/shared/audioBoost";
import { useTheme } from "@/theme";
import { AppText } from "../AppText";
import { Button } from "../Button";
import { Card } from "../Card";
import { Banner } from "../Misc";
import { JobProgress } from "./JobProgress";

const STEPS = [
  "Reading your blueprint…",
  "Sketching the screens…",
  "Picking colours and layout…",
  "Wiring up the features…",
  "Adding sounds and sample content…",
  "Polishing the details…",
  "Almost there…",
];

/**
 * Build App: turns the saved blueprint into a working, playable web version
 * of the idea using BuildBrief's existing builder on the server. The result
 * is saved to the project and opens here, on the website, or as a file.
 */
export function BuildTab({ project, onChanged }: { project: ProjectDetail; onChanged: () => void }) {
  const { colors, radius } = useTheme();
  const poll = useJobPoll(project.id, "app");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(project.app_status === "failed" ? project.app_error : null);
  const building = poll.phase === "running";
  const ready = project.app_status === "done" && !building;

  useEffect(() => {
    if (project.app_status === "building" && poll.phase === "idle") {
      poll.start({ onDone: done, onFailed: failed });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.app_status]);

  function done() {
    feedback.fanfare();
    setError(null);
    onChanged();
  }
  function failed(message: string) {
    feedback.error();
    setError(message);
    onChanged();
  }

  async function build() {
    setStarting(true);
    setError(null);
    feedback.start();
    try {
      await startAppBuild(project.id);
      poll.start({ onDone: done, onFailed: failed });
    } catch (e) {
      feedback.error();
      setError(e instanceof Error ? e.message : "Couldn't start the build.");
    } finally {
      setStarting(false);
    }
  }

  async function shareApp() {
    const html = await getAppHtml(project.id);
    if (!html) return setError("Couldn't load the app file. Please try again.");
    const name = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "app";
    await shareFile(`${name}.html`, withAudioBoost(html), "text/html", "public.html");
    feedback.success();
  }

  if (building) {
    return <JobProgress title="Building your app" steps={STEPS} startedAt={poll.startedAt} typicalSeconds={110} />;
  }

  return (
    <View style={{ gap: 14 }}>
      <Card style={{ gap: 12, backgroundColor: colors.accentSoft, borderColor: colors.accent + "44" }}>
        <AppText variant="heading">{ready ? `${project.name} is ready to play 🎉` : `Bring ${project.name} to life`}</AppText>
        <AppText color="muted">
          {ready
            ? "Open it, tap around, and share it with friends. Rebuild any time for a fresh take."
            : "One tap turns your blueprint into a working version you can try right on your phone, complete with sounds and sample content."}
        </AppText>
        {ready ? (
          <>
            <Button title="Open my app" icon="play" size="lg" fullWidth onPress={() => router.push(`/project/${project.id}/preview`)} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button title="Share" icon="share-outline" variant="secondary" style={{ flex: 1 }} fullWidth onPress={shareApp} />
              <Button title="Rebuild" icon="refresh" variant="secondary" style={{ flex: 1 }} fullWidth loading={starting} onPress={build} withFeedback={false} />
            </View>
          </>
        ) : (
          <Button title={error ? "Try again" : "Build my app"} icon="hammer" size="lg" fullWidth loading={starting} onPress={build} withFeedback={false} />
        )}
      </Card>
      {error ? <Banner tone="danger" icon="alert-circle" text={error} /> : null}
      <Card style={{ gap: 8, borderRadius: radius.lg }}>
        <AppText variant="subheading">What you get</AppText>
        <AppText variant="caption">
          • A playable web version of your idea that works on phones and computers{"\n"}
          • Your main features working for real, with sample content and sound{"\n"}
          • Saved to your account: open it here or on the website any time{"\n"}
          • A single file you can share or keep building on
        </AppText>
        <AppText variant="caption" color="faint">
          This is a working prototype built from your blueprint. To turn it into a full production app, use the AI coding prompt and files in the Dev and Export tabs.
        </AppText>
      </Card>
    </View>
  );
}
