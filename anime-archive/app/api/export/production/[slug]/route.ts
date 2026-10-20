import { exportProduction } from "@/lib/archive/import-export";
import { loadArchive } from "@/lib/archive/server";

export async function GET(_request: Request, ctx: RouteContext<"/api/export/production/[slug]">) {
  const { slug } = await ctx.params;
  const index = await loadArchive();
  const production = index.productionsBySlug.get(slug);
  if (!production) return Response.json({ error: "Production not found" }, { status: 404 });
  const document = exportProduction(index.tables, production.id)!;
  return new Response(JSON.stringify(document, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.lumine-archive.json"`,
    },
  });
}
