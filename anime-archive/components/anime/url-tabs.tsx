"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface TabDefinition {
  value: string;
  label: string;
  count?: number;
}

/** Tabs whose selection is mirrored into `?tab=` so a specific tab can be linked and bookmarked. */
export function UrlTabs({ tabs, initial, children }: { tabs: TabDefinition[]; initial: string; children: React.ReactNode }) {
  const [value, setValue] = useState(tabs.some((t) => t.value === initial) ? initial : tabs[0].value);
  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        setValue(next);
        const url = new URL(window.location.href);
        if (next === tabs[0].value) url.searchParams.delete("tab");
        else url.searchParams.set("tab", next);
        window.history.replaceState(null, "", url);
      }}
    >
      <TabsList aria-label="Production details">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && <span className="rounded bg-muted px-1.5 text-[0.65rem] font-semibold text-muted-foreground">{tab.count}</span>}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}
