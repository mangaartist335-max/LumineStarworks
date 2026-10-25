import Link from "next/link";
import { toggleFavoriteAction } from "@/app/actions/profile";
import type { Account, Favorites } from "@/lib/store/types";

export function FavoriteButton({ account, kind, id, back }: { account: Account | null; kind: keyof Favorites; id: number; back: string }) {
  if (!account) {
    return (
      <Link href={`/login?next=${encodeURIComponent(back)}`} className="btn">
        Add to Favorites
      </Link>
    );
  }
  const on = account.favorites[kind].includes(id);
  return (
    <form action={toggleFavoriteAction} className="inline-form">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="on" value={on ? "0" : "1"} />
      <input type="hidden" name="back" value={back} />
      <button type="submit" className="btn" aria-pressed={on}>
        {on ? "Remove from Favorites" : "Add to Favorites"}
      </button>
    </form>
  );
}
