import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <p className="caps text-xs font-bold text-accent">Page not found</p>
      <h1 className="mt-3 font-display text-4xl font-bold">Let&rsquo;s get you back on track</h1>
      <p className="mt-3 text-muted">We couldn&rsquo;t find that page, but there&rsquo;s plenty to explore.</p>
      <Link
        href="/courses"
        className="mt-6 inline-flex rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Browse courses
      </Link>
    </div>
  );
}
