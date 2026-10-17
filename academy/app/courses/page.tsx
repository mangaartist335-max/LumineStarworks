import type { Metadata } from "next";
import { CATEGORIES, courses, type Category } from "@/lib/courses";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { OfferingTiles } from "@/components/OfferingCard";

export const metadata: Metadata = {
  title: "Course catalog",
};

export default async function CatalogPage(props: PageProps<"/courses">) {
  const { category } = await props.searchParams;
  const initialCategory = CATEGORIES.find((c) => c === category) as Category | undefined;

  return (
    <>
      <section className="mesh">
        <header className="mx-auto max-w-6xl px-4 pb-14 pt-14 sm:px-6">
          <span className="eyebrow">Course catalog</span>
          <h1 className="mt-5 max-w-2xl font-display text-5xl font-semibold leading-[1.05] tracking-tight">
            Courses that grow <span className="gradient-text">with you</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Respiratory protection, occupational health, clinical skills and more, taught by
            Registered Nurses. Every course comes with learning hours for your CNO Quality
            Assurance.
          </p>
        </header>
      </section>
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        {/* key resets local filter state when the category link changes */}
        <CatalogBrowser key={initialCategory ?? "all"} courses={courses} initialCategory={initialCategory} />
      </div>

      <section aria-labelledby="more-title" className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="reveal max-w-2xl">
          <span className="eyebrow">Beyond courses</span>
          <h2 id="more-title" className="mt-4 font-display text-3xl font-semibold tracking-tight">
            Fit testing, workshops and community
          </h2>
          <p className="mt-3 text-muted">
            NursesWeCare does more than courses. Every service has its own page, even the ones
            still growing.
          </p>
        </div>
        <OfferingTiles className="reveal mt-8" />
      </section>
    </>
  );
}
