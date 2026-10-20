import { getViewer } from "@/lib/auth";
import { exportArchive } from "@/lib/archive/import-export";
import { loadArchive } from "@/lib/archive/server";

/**
 * Full archive export. Everyone gets the public records; editors also get the
 * audit history (revisions and conflict reviews).
 */
export async function GET(request: Request) {
  const [index, viewer] = await Promise.all([loadArchive(), getViewer()]);
  const url = new URL(request.url);
  const includeAudit = viewer.canEdit && url.searchParams.get("audit") !== "0";
  const document = exportArchive(index.tables, { includeAudit });
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(document, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="lumine-archive-${stamp}.json"`,
    },
  });
}
