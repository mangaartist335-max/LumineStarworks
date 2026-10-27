import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="yal-foot">
      <Link href="/about">About</Link> &middot; <Link href="/terms">Terms</Link> &middot; <Link href="/privacy">Privacy</Link> &middot;{" "}
      <Link href="/contact">Contact</Link> &middot; <Link href="/advertising">Advertising</Link>
      <br />
      &copy; 2013 YourAnimeList - All product names, logos, and brands are property of their respective owners.
    </footer>
  );
}
