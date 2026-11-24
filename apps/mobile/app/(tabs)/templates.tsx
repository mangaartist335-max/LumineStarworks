import { useMemo, useState } from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
import { AppText } from "@/components/AppText";
import { Chip } from "@/components/Chip";
import { EmptyState } from "@/components/Misc";
import { Screen } from "@/components/Screen";
import { TemplateTile } from "@/components/TemplateTile";
import { TextField } from "@/components/TextField";
import { CATEGORIES, TEMPLATES } from "@/lib/templates";
import type { ProjectType } from "@/shared/types";

export default function Templates() {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ProjectType | null>(null);
  const columns = width >= 900 ? 4 : width >= 600 ? 3 : 2;

  const usedTypes = useMemo(() => CATEGORIES.filter((c) => TEMPLATES.some((t) => t.type === c.type)), []);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATES.filter(
      (t) =>
        (!type || t.type === type) &&
        (!q || t.title.toLowerCase().includes(q) || t.tagline.toLowerCase().includes(q) || t.idea.toLowerCase().includes(q))
    );
  }, [query, type]);

  const rows: (typeof TEMPLATES)[] = [];
  for (let i = 0; i < results.length; i += columns) rows.push(results.slice(i, i + columns));

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <AppText variant="title" accessibilityRole="header">Templates</AppText>
        <AppText color="muted">Pick a starting point, then make it your own before generating.</AppText>
      </View>
      <TextField value={query} onChangeText={setQuery} placeholder="Search templates" accessibilityLabel="Search templates" returnKeyType="search" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }} style={{ marginHorizontal: -20, paddingLeft: 20 }}>
        <Chip label="All" selected={!type} onPress={() => setType(null)} />
        {usedTypes.map((c) => (
          <Chip key={c.type} label={c.label} emoji={c.emoji} selected={type === c.type} onPress={() => setType(c.type)} />
        ))}
      </ScrollView>
      {results.length === 0 ? (
        <EmptyState emoji="🔎" title="No templates match" body="Try another word, or start from scratch on the Create tab." />
      ) : (
        <View style={{ gap: 12 }}>
          {rows.map((row, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 12 }}>
              {row.map((t) => (
                <TemplateTile key={t.id} template={t} />
              ))}
              {Array.from({ length: columns - row.length }).map((_, j) => (
                <View key={`pad-${j}`} style={{ flex: 1 }} />
              ))}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
