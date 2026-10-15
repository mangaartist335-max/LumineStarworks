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
    <>
      <section className="sky-wash px-4 pb-24 pt-12 sm:px-6">
        <header className="mx-auto max-w-3xl text-center">
          <p className="caps text-xs font-bold text-accent">Course catalog</p>
          <h1 className="text-glow mt-3 text-4xl font-light text-sky-deep sm:text-5xl">Find Your Next Course</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            Respiratory protection, occupational health, clinical skills and more, all developed
            and delivered by Registered Nurses. Every course earns learning hours you can log for
            your annual CNO Quality Assurance reflection.
          </p>
        </header>
      </section>
      <div className="mx-auto -mt-16 max-w-6xl px-4 sm:px-6">
        {/* key resets local filter state when the category link changes */}
        <CatalogBrowser key={initialCategory ?? "all"} courses={courses} initialCategory={initialCategory} />
      </div>
    </>
  );
}
