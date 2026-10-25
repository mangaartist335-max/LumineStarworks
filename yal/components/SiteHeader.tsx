import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import type { Account } from "@/lib/store/types";
import { NavLinks } from "./NavLinks";

export function SiteHeader({ account }: { account: Account | null }) {
  return (
    <header className="yal-topbar">
      <div className="logo">
        <Link href="/">
          Your<span>Anime</span>List
        </Link>
      </div>
      <NavLinks />
      <form className="search" action="/search" method="get" role="search">
        <label className="sr-only" htmlFor="site-search">
          Search
        </label>
        <input id="site-search" type="text" name="q" placeholder="Search anime, manga, users..." />
        <button type="submit">Go</button>
      </form>
      <div className="userlinks">
        {account ? (
          <>
            <Link href={`/profile/${encodeURIComponent(account.username)}`}>{account.username}</Link>
            <span className="sep">|</span>
            <Link href={`/animelist/${encodeURIComponent(account.username)}`}>My List</Link>
            <span className="sep">|</span>
            <Link href="/panel">Panel</Link>
            <span className="sep">|</span>
            <form action={signOutAction} className="inline-form">
              <button type="submit" className="linklike" style={{ color: "#f1e1ca", fontSize: 11 }}>
                Logout
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <span className="sep">|</span>
            <Link href="/register">Sign Up</Link>
          </>
        )}
      </div>
    </header>
  );
}
