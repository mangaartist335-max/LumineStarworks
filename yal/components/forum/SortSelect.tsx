"use client";

import { useRouter } from "next/navigation";

export function SortSelect({ base, sort }: { base: string; sort: "oldest" | "newest" }) {
  const router = useRouter();
  return (
    <form className="sort" action={base} method="get">
      <label htmlFor="sort">Sort:</label>
      <select
        id="sort"
        name="sort"
        defaultValue={sort}
        onChange={(e) => router.push(`${base}?sort=${e.target.value}`)}
      >
        <option value="oldest">Oldest First</option>
        <option value="newest">Newest First</option>
      </select>
      <noscript>
        <button type="submit" className="btn">
          Go
        </button>
      </noscript>
    </form>
  );
}
