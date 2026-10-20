import { CircleCheck, FileText, History, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/archive/page-header";
import { ProvenanceBadge } from "@/components/archive/provenance-badge";
import { PROVENANCE_DESCRIPTION } from "@/lib/archive/labels";
import { PROVENANCE_STATUSES } from "@/lib/archive/types";

export const metadata: Metadata = { title: "About the archive" };

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="About" title="How the archive keeps history honest" description="A Lumine StarWorks project documenting an independent anime industry from 2006 to 2026 — and ready for the decades after." />
      <div className="container-page grid gap-10 py-10 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Record status</h2>
          <p className="text-muted-foreground">Every production, credit and broadcast run carries a provenance status, so you always know how solid a fact is.</p>
          <ul className="space-y-3">
            {PROVENANCE_STATUSES.map((p) => (
              <li key={p} className="flex items-start gap-3 rounded-xl border bg-card/50 p-4">
                <ProvenanceBadge provenance={p} />
                <span className="text-sm text-muted-foreground">{PROVENANCE_DESCRIPTION[p]}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Our editorial rules</h2>
          <ul className="space-y-3 text-sm">
            {[
              { icon: CircleCheck, title: "Nothing is invented", body: "Details that haven't been documented are shown as pending instead of guessed. Weekdays and episode counts worked out from dates are labelled as derived." },
              { icon: FileText, title: "Every fact has a source", body: "Records cite the source documents that established them, down to individual fields." },
              { icon: ShieldCheck, title: "Confirmed facts are protected", body: "A newer import never silently overwrites a confirmed value. Disagreements become conflicts that an editor reviews." },
              { icon: History, title: "Corrections keep their history", body: "Every change is stored as a revision, and any earlier version can be restored." },
            ].map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3 rounded-xl border bg-card/50 p-4">
                <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="text-muted-foreground">{body}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Broadcast seasons follow the Japanese convention: Winter (January–March), Spring (April–June), Summer (July–September) and Fall (October–December). A
            multi-cour series stays listed under its premiere season while its broadcast continues into the following ones.
          </p>
        </section>
      </div>
    </>
  );
}
