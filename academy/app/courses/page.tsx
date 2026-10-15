import type { Metadata } from "next";
import { CATEGORIES, courses, type Category } from "@/lib/courses";
import { CatalogBrowser } from "@/components/CatalogBrowser";

export const metadata: Metadata = {
  title: "Course catalog",
};

export default async function CatalogPage(props: PageProps<"/courses">) {
  const { category } = await props.searchParams;
  const initialCategory = CATEGORIES.find((c) => c === category) as Category | undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Course catalog</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Find your next course</h1>
        <p className="mt-3 text-muted">
          Respiratory protection, occupational health, clinical skills and more, all developed and delivered by Registered Nurses. Every course earns
          learning hours you can log for your annual CNO Quality Assurance reflection.
        </p>
      </header>
      <div className="mt-8">
        {/* key resets local filter state when the category link changes */}
        <CatalogBrowser key={initialCategory ?? "all"} courses={courses} initialCategory={initialCategory} />
      </div>
    </div>
  );
}
