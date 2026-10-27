"use client";

// Corkboard: classifieds for around town. Post things to sell, give away,
// swap or find, mark them sold, and message sellers who have an account on
// this computer. No payments ever happen here.

import { useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { useDialog } from "@/components/desktop/Dialogs";
import { A, useSite, usePageTitle } from "../SiteContext";
import { archiveListings, CATEGORIES, CORKBOARD_HOST, type Category } from "@/data/corkboard";
import { newId } from "@/lib/ids";
import { formatDate, iso } from "@/lib/time";
import { siteUrl } from "@/lib/web/url";
import { userHandle } from "../metube/store";
import { Linkified } from "../community/text";

const cb = (path = "/", params?: Record<string, string>) => siteUrl(CORKBOARD_HOST, path, params);

interface UserListing {
  id: string;
  owner: string;
  seller: string;
  title: string;
  category: Category;
  price?: string;
  description: string;
  at: string;
  doneAt?: string;
  origin: "user";
}
interface Message {
  id: string;
  owner: string;
  to: string;
  fromName: string;
  listingId: string;
  text: string;
  at: string;
  origin: "user";
}

interface Listing {
  id: string;
  seller: string;
  ownerId?: string;
  title: string;
  category: Category;
  price?: string;
  description: string;
  at: string;
  status: "open" | "done" | "finished";
  mine: boolean;
  archive: boolean;
}

function useListings(): Listing[] {
  const { now, user } = useSystem();
  const [mine] = useCollection<UserListing>("cork.listings", { allUsers: true });
  const t = now();
  const status = (doneAt?: string, endsAt?: string): Listing["status"] => (doneAt && Date.parse(doneAt) <= t ? "done" : endsAt && Date.parse(endsAt) <= t ? "finished" : "open");
  return [
    ...archiveListings.filter((l) => Date.parse(l.at) <= t).map((l) => ({ ...l, status: status(l.doneAt, l.endsAt), mine: false, archive: true })),
    ...mine.filter((l) => Date.parse(l.at) <= t).map((l) => ({ ...l, ownerId: l.owner, status: status(l.doneAt), mine: l.owner === user?.id, archive: false })),
  ].sort((a, b) => b.at.localeCompare(a.at));
}

const doneLabel = (l: Listing) => (l.status === "finished" ? "Finished" : l.category === "For sale" ? "Sold" : l.category === "Free" ? "Claimed" : "Done");

function Shell({ children }: { children: React.ReactNode }) {
  const { user } = useSystem();
  const [messages] = useCollection<Message>("cork.messages", { allUsers: true });
  const unread = user ? messages.filter((m) => m.to === user.id).length : 0;
  return (
    <div className="corkboard">
      <header className="cb-head">
        <A href={cb("/")} className="cb-logo">
          📌 Corkboard
        </A>
        <span className="cb-tag">Buy, swap, give away and find things around town</span>
        <nav>
          {user && <A href={cb("/post")}>Post a listing</A>}
          {user && <A href={cb("/messages")}>Messages{unread ? ` (${unread})` : ""}</A>}
        </nav>
      </header>
      <main className="cb-main">{children}</main>
      <footer className="cb-foot">Corkboard never handles payments. Meet somewhere public, and bring a grown-up if you&apos;re under 18.</footer>
    </div>
  );
}

function Card({ l }: { l: Listing }) {
  const { computer } = useSystem();
  return (
    <A href={cb(`/listing/${l.id}`)} className={`cb-card${l.status !== "open" ? " done" : ""}`}>
      <span className="cb-pin" aria-hidden />
      <span className="cb-cat">{l.category}</span>
      <strong>{l.title}</strong>
      {l.price && <span className="cb-price">{l.price}</span>}
      <small>
        {l.seller} · {formatDate(Date.parse(l.at), computer.timeZone)}
      </small>
      {l.status !== "open" && <span className="cb-stamp">{doneLabel(l)}</span>}
    </A>
  );
}

function Home() {
  usePageTitle("Corkboard - Classifieds around town");
  const { url, navigate } = useSite();
  const all = useListings();
  const cat = url.params.get("category") as Category | null;
  const q = (url.params.get("q") ?? "").toLowerCase();
  const showDone = url.params.get("archived") === "1";
  const [query, setQuery] = useState(url.params.get("q") ?? "");
  const list = all.filter((l) => (!cat || l.category === cat) && (showDone || l.status === "open") && (!q || `${l.title} ${l.description}`.toLowerCase().includes(q)));
  const params = (extra: Record<string, string | undefined>) => {
    const p: Record<string, string> = {};
    const merged = { category: cat ?? undefined, q: q || undefined, archived: showDone ? "1" : undefined, ...extra };
    for (const [k, v] of Object.entries(merged)) if (v) p[k] = v;
    return p;
  };
  return (
    <Shell>
      <div className="cb-filters">
        <A href={cb("/", params({ category: undefined }))} className={!cat ? "on" : ""}>
          Everything
        </A>
        {CATEGORIES.map((c) => (
          <A key={c} href={cb("/", params({ category: c }))} className={cat === c ? "on" : ""}>
            {c}
          </A>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate(cb("/", params({ q: query.trim() || undefined })));
          }}
        >
          <input className="field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search listings" aria-label="Search listings" />
        </form>
        <A href={cb("/", params({ archived: showDone ? undefined : "1" }))}>{showDone ? "Hide sold and finished" : "Show sold and finished"}</A>
      </div>
      <div className="cb-board">
        {list.map((l) => (
          <Card key={l.id} l={l} />
        ))}
      </div>
      {list.length === 0 && <p className="cb-empty">Nothing pinned here right now.</p>}
    </Shell>
  );
}

function ListingPage({ id }: { id: string }) {
  const { store, user, now, computer } = useSystem();
  const { navigate } = useSite();
  const dialog = useDialog();
  const l = useListings().find((x) => x.id === id);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  usePageTitle(l ? `${l.title} - Corkboard` : "Listing not found - Corkboard");
  if (!l) {
    return (
      <Shell>
        <h1>Listing not found</h1>
        <p>It may have been taken down. Have a look at the <A href={cb("/")}>board</A>.</p>
      </Shell>
    );
  }
  const update = async (patch: Partial<UserListing>) => {
    const doc = await store.get<UserListing>("cork.listings", l.id);
    if (doc) await store.put<UserListing>("cork.listings", { ...doc, ...patch });
  };
  return (
    <Shell>
      <article className="cb-listing">
        <span className="cb-cat">{l.category}</span>
        <h1>{l.title}</h1>
        {l.price && <div className="cb-price big">{l.price}</div>}
        {l.status !== "open" && <div className="cb-note">{doneLabel(l)}: this listing is kept here as an archive.</div>}
        <p>
          <Linkified text={l.description} />
        </p>
        <small className="cb-muted">
          Posted by <A href={cb(`/seller/${l.seller}`)}>{l.seller}</A> on {formatDate(Date.parse(l.at), computer.timeZone)}
        </small>
        {l.mine ? (
          <div className="cb-tools">
            {l.status === "open" ? (
              <button className="btn primary" onClick={() => update({ doneAt: iso(now()) })}>
                Mark as {l.category === "For sale" ? "sold" : l.category === "Free" ? "claimed" : "done"}
              </button>
            ) : (
              <button className="btn" onClick={() => update({ doneAt: undefined })}>
                Put it back up
              </button>
            )}
            <button
              className="btn"
              onClick={async () => {
                const price = await dialog.prompt("Price (or leave empty):", l.price ?? "", { title: "Edit listing" });
                if (price === null) return;
                const description = await dialog.prompt("Description:", l.description, { title: "Edit listing" });
                await update({ price: price.trim().slice(0, 30) || undefined, description: (description ?? l.description).trim().slice(0, 1500) || l.description });
              }}
            >
              Edit
            </button>
            <button
              className="btn"
              onClick={async () => {
                if (!(await dialog.confirm(`Take down "${l.title}"?`, { title: "Take down", okLabel: "Take down" }))) return;
                await store.delete("cork.listings", l.id);
                navigate(cb("/"));
              }}
            >
              Take down
            </button>
          </div>
        ) : user && l.status === "open" ? (
          l.archive ? (
            <p className="cb-note">This seller isn&apos;t on this computer, so Corkboard can&apos;t pass a message on for this listing.</p>
          ) : sent ? (
            <p className="cb-note">Message sent! {l.seller} will see it in their Corkboard messages.</p>
          ) : (
            <form
              className="cb-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!text.trim() || !l.ownerId) return;
                await store.put<Message>("cork.messages", { id: newId("msg"), owner: user.id, to: l.ownerId, fromName: userHandle(user.name), listingId: l.id, text: text.trim().slice(0, 1000), at: iso(now()), origin: "user" });
                setText("");
                setSent(true);
              }}
            >
              <label>
                Message {l.seller}
                <textarea className="field" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Hi! Is this still available?" aria-label={`Message ${l.seller}`} />
              </label>
              <button className="btn primary" disabled={!text.trim()}>
                Send message
              </button>
            </form>
          )
        ) : null}
      </article>
    </Shell>
  );
}

function Post() {
  usePageTitle("Post a listing - Corkboard");
  const { store, user, now } = useSystem();
  const { navigate } = useSite();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("For sale");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  if (!user) return null;
  return (
    <Shell>
      <h1>Post a listing</h1>
      <form
        className="cb-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim() || !description.trim()) return;
          const id = newId("post");
          await store.put<UserListing>("cork.listings", { id, owner: user.id, seller: userHandle(user.name), title: title.trim().slice(0, 80), category, price: price.trim().slice(0, 30) || undefined, description: description.trim().slice(0, 1500), at: iso(now()), origin: "user" });
          navigate(cb(`/listing/${id}`));
        }}
      >
        <label>
          What is it? <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" maxLength={80} autoFocus />
        </label>
        <label>
          Category
          <select className="field" value={category} onChange={(e) => setCategory(e.target.value as Category)} aria-label="Category">
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Price (optional) <input className="field" value={price} onChange={(e) => setPrice(e.target.value)} aria-label="Price" placeholder="$5, free, or make an offer" maxLength={30} />
        </label>
        <label>
          Description <textarea className="field" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} aria-label="Description" maxLength={1500} />
        </label>
        <button className="btn primary" disabled={!title.trim() || !description.trim()}>
          Pin it to the board
        </button>
        <p className="cb-muted">Corkboard doesn&apos;t take payments. Buyers will message you, and you sort the rest out in person.</p>
      </form>
    </Shell>
  );
}

function Messages() {
  usePageTitle("Messages - Corkboard");
  const { store, user, now, computer } = useSystem();
  const [messages] = useCollection<Message>("cork.messages", { allUsers: true });
  const listings = useListings();
  const [reply, setReply] = useState<Record<string, string>>({});
  if (!user) return null;
  const t = now();
  const mine = messages.filter((m) => (m.to === user.id || m.owner === user.id) && Date.parse(m.at) <= t).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <Shell>
      <h1>Messages</h1>
      {mine.map((m) => {
        const l = listings.find((x) => x.id === m.listingId);
        const incoming = m.to === user.id;
        return (
          <div key={m.id} className={`cb-msg${incoming ? " in" : ""}`}>
            <div className="cb-muted">
              {incoming ? `From ${m.fromName}` : "You wrote"} about <A href={cb(`/listing/${m.listingId}`)}>{l?.title ?? "a listing"}</A> · {formatDate(Date.parse(m.at), computer.timeZone)}
            </div>
            <p>{m.text}</p>
            {incoming && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const text = (reply[m.id] ?? "").trim();
                  if (!text) return;
                  await store.put<Message>("cork.messages", { id: newId("msg"), owner: user.id, to: m.owner, fromName: userHandle(user.name), listingId: m.listingId, text: text.slice(0, 1000), at: iso(now()), origin: "user" });
                  setReply((r) => ({ ...r, [m.id]: "" }));
                }}
              >
                <input className="field" value={reply[m.id] ?? ""} onChange={(e) => setReply((r) => ({ ...r, [m.id]: e.target.value }))} placeholder={`Reply to ${m.fromName}`} aria-label={`Reply to ${m.fromName}`} />
                <button className="btn">Reply</button>
              </form>
            )}
          </div>
        );
      })}
      {mine.length === 0 && <p className="cb-empty">No messages yet. When someone asks about one of your listings, it shows up here.</p>}
    </Shell>
  );
}

function Seller({ name }: { name: string }) {
  usePageTitle(`${name} - Corkboard`);
  const { computer } = useSystem();
  const list = useListings().filter((l) => l.seller.toLowerCase() === name.toLowerCase());
  const since = list.at(-1)?.at;
  return (
    <Shell>
      <h1>{name}</h1>
      {since && <p className="cb-muted">Pinning things to the board since {formatDate(Date.parse(since), computer.timeZone)}</p>}
      <div className="cb-board">
        {list.map((l) => (
          <Card key={l.id} l={l} />
        ))}
      </div>
      {list.length === 0 && <p className="cb-empty">No listings yet.</p>}
    </Shell>
  );
}

export default function Corkboard() {
  const { url } = useSite();
  const parts = url.path.split("/").filter(Boolean).map(decodeURIComponent);
  if (parts[0] === "listing" && parts[1]) return <ListingPage key={parts[1]} id={parts[1]} />;
  if (parts[0] === "post") return <Post />;
  if (parts[0] === "messages") return <Messages />;
  if (parts[0] === "seller" && parts[1]) return <Seller name={parts[1]} />;
  return <Home />;
}
