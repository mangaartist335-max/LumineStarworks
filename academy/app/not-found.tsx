import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mesh">
      <div className="mx-auto max-w-xl px-4 py-28 text-center sm:px-6">
        <span className="eyebrow">Page not found</span>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight">Let&rsquo;s get you back on track</h1>
        <p className="mt-3 text-muted">We couldn&rsquo;t find that page, but there&rsquo;s plenty to explore.</p>
        <Link href="/courses" className="btn-primary mt-7 px-6 py-3 text-sm">
          Browse courses
        </Link>
      </div>
    </div>
  );
}
