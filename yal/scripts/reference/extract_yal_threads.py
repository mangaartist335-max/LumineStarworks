"""Extract the archived YAL Impact of Eden episode threads into seed JSON.

Usage: python3 -I extract.py <ioe-offline dir> <output dir>
Writes ioe-threads.json and avatars.svg into the output dir.
"""
import sys, os, re, json, glob
from datetime import datetime, timedelta, timezone
from bs4 import BeautifulSoup, NavigableString, Tag

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

TZ = {"JST": 9, "PDT": -7, "GMT": 0, "EDT": -4, "CET": 1, "BRT": -3}

def parse_time(s):
    s = s.strip()
    m = re.match(r"([A-Z][a-z]{2}) (\d{1,2}), (\d{4}), (\d{2}):(\d{2}) ([A-Z]{3})$", s)
    if not m:
        raise ValueError("bad time: %r" % s)
    mon, day, year, hh, mm, tz = m.groups()
    local = datetime.strptime("%s %s %s %s:%s" % (mon, day, year, hh, mm), "%b %d %Y %H:%M")
    utc = local - timedelta(hours=TZ[tz])
    return utc.replace(tzinfo=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), tz

def clean_ws(s):
    return re.sub(r"[ \t\r\n]+", " ", s)

def inline(node):
    """Convert inline content to BBCode text."""
    out = []
    for c in node.children:
        if isinstance(c, NavigableString):
            out.append(clean_ws(str(c)))
            continue
        if not isinstance(c, Tag):
            continue
        n = c.name
        if n == "br":
            out.append("\n")
        elif n in ("b", "strong"):
            out.append("[b]" + inline(c) + "[/b]")
        elif n in ("i", "em"):
            out.append("[i]" + inline(c) + "[/i]")
        elif n == "u":
            out.append("[u]" + inline(c) + "[/u]")
        elif n == "code":
            out.append("[code]" + c.get_text() + "[/code]")
        elif n == "a":
            href = c.get("href", "#")
            text = inline(c)
            out.append(text if href in ("#", "") else "[url=%s]%s[/url]" % (href, text))
        elif n == "span":
            out.append(inline(c))
        else:
            raise ValueError("unexpected inline tag %s" % n)
    return "".join(out)

def tidy_lines(s):
    lines = [l.strip() for l in s.split("\n")]
    return "\n".join(lines).strip()

def block(node, ctx):
    """Convert block content to a list of BBCode paragraphs."""
    paras = []
    buf = []
    def flush():
        t = tidy_lines("".join(buf))
        if t:
            paras.append(t)
        buf.clear()
    for c in node.children:
        if isinstance(c, NavigableString):
            buf.append(clean_ws(str(c)))
            continue
        if not isinstance(c, Tag):
            continue
        cls = c.get("class") or []
        n = c.name
        if n == "p" and "edited" in cls:
            flush()
            b = c.find("b")
            m = re.match(r"Edited (.*)$", b.get_text().strip())
            ctx["edited_at"], ctx["edited_tz"] = parse_time(m.group(1))
            reason = c.get_text("\n").split("\n", 1)[1].strip() if "\n" in c.get_text("\n") else ""
            reason = re.sub(r"^Reason:\s*", "", clean_ws(reason)).strip()
            ctx["edit_reason"] = reason or None
        elif n == "p":
            flush()
            t = tidy_lines(inline(c))
            if "font-size:11px" in (c.get("style") or ""):
                t = "[small]" + t + "[/small]"
            if t:
                paras.append(t)
        elif n in ("ul", "ol"):
            flush()
            items = ["[*]" + tidy_lines(inline(li)) for li in c.find_all("li", recursive=False)]
            tag = "list=1" if n == "ol" else "list"
            body = "[%s]\n%s\n[/list]" % (tag, "\n".join(items))
            if "font-size:11px" in (c.get("style") or ""):
                body = "[small]" + body + "[/small]"
            paras.append(body)
        elif n == "div" and "quote" in cls:
            flush()
            head = c.select_one(".quote-head")
            bodyn = c.select_one(".quote-body")
            ht = clean_ws(head.get_text()).strip()
            m = re.match(r"Originally posted by (.+?)(?:\s+[—-]\s+#(\d+))?$", ht)
            inner = "\n\n".join(block(bodyn, {}))
            if m:
                who, pn = m.group(1).strip(), m.group(2)
                attr = who + (";" + pn if pn else "")
            else:
                # Free-form quote headers are kept verbatim.
                attr = '"%s"' % ht.replace('"', "'")
            paras.append("[quote=%s]%s[/quote]" % (attr, inner))
        elif n == "div" and "spoiler" in cls:
            flush()
            head = c.select_one(".spoiler-head")
            for b in head.select("button"):
                b.decompose()
            title = clean_ws(head.get_text()).strip()
            title = re.sub(r"^Spoiler:?\s*", "", title)
            inner = "\n\n".join(block(c.select_one(".spoiler-body"), {}))
            paras.append("[spoiler=%s]%s[/spoiler]" % (title, inner) if title else "[spoiler]%s[/spoiler]" % inner)
        elif n in ("b", "strong", "i", "em", "u", "a", "br", "code", "span"):
            wrapper = BeautifulSoup("<div></div>", "lxml").div
            wrapper.append(c.__copy__())
            buf.append(inline(wrapper))
        else:
            raise ValueError("unexpected block tag %s %s" % (n, cls))
    flush()
    return paras

def num(s):
    return int(s.replace(",", "").strip())

def page_files(ep):
    first = os.path.join(SRC, "yal_impact_of_eden_ep%d_2013.html" % ep)
    prefix = "page" if ep == 1 else "ep%d_page" % ep
    rest = glob.glob(os.path.join(SRC, prefix + "[0-9]*.html"))
    rest.sort(key=lambda p: int(re.search(r"(\d+)\.html$", p).group(1)))
    return [first] + rest

symbols = {}
users = {}
threads = []

for ep in (1, 2, 3):
    files = page_files(ep)
    posts = []
    meta = {}
    for pi, f in enumerate(files, start=1):
        raw = open(f, encoding="utf-8").read()
        soup = BeautifulSoup(raw, "lxml")
        # Copy avatar symbols verbatim: the HTML parser lowercases SVG
        # attributes such as viewBox, which SVG treats case-sensitively.
        for m in re.finditer(r'<symbol\b[^>]*\bid="([^"]+)"[^>]*>.*?</symbol>', raw, re.S):
            if m.group(1) not in symbols:
                symbols[m.group(1)] = m.group(0)
        if pi == 1:
            meta["title"] = soup.select_one(".thread-title-bar h1").get_text().strip()
            rows = {}
            for tr in soup.select(".thread-meta tr"):
                tds = tr.find_all("td")
                rows[tds[0].get_text().strip()] = tds[1]
            created, created_tz = parse_time(rows["Created"].get_text())
            last = rows["Last Reply"]
            lm = re.match(r"(.+?)\s+—\s+by\s+(.+)$", clean_ws(last.get_text()).strip())
            last_at, last_tz = parse_time(lm.group(1))
            meta.update({
                "createdAt": created,
                "createdTz": created_tz,
                "archive": {
                    "replies": num(rows["Replies"].get_text()),
                    "views": num(rows["Views"].get_text()),
                    "lastReplyAt": last_at,
                    "lastReplyBy": lm.group(2).strip(),
                    "status": rows["Status"].get_text().strip(),
                },
            })
            side = {}
            for card in soup.select("aside .side-card"):
                head = card.select_one(".side-head").get_text().strip()
                body = card.select_one(".side-body")
                if head.startswith("Hot Subthreads"):
                    items = []
                    for li in body.select("li"):
                        t = clean_ws(li.get_text()).strip()
                        m = re.match(r"(.+)\s+\(([\d,]+) replies\)$", t)
                        items.append({"title": m.group(1).strip(), "replies": num(m.group(2))})
                    side["hotSubthreads"] = items
                elif head == "Active Users Viewing":
                    summ = clean_ws(body.select_one(".viewers-summary").get_text())
                    m = re.match(r"\s*(\d+) users\s+(\d+) members\s+·\s+(\d+) guests", summ)
                    side["viewers"] = {
                        "total": int(m.group(1)), "members": int(m.group(2)), "guests": int(m.group(3)),
                        "names": [a.get_text().strip() for a in body.select(".viewers-list a")],
                    }
                elif head.endswith("Poll"):
                    rows_ = []
                    for r in body.select(".poll-row"):
                        spans = r.select(".poll-label span")
                        rows_.append({"label": spans[0].get_text().strip(), "percent": int(spans[1].get_text().strip().rstrip("%"))})
                    total = num(re.match(r"([\d,]+)", body.select_one(".poll-total").get_text().strip()).group(1))
                    side["poll"] = {
                        "question": body.select_one(".poll-question").get_text().strip(),
                        "totalVotes": total,
                        "options": rows_,
                    }
                elif head in ("Episode Discussion", "Thread Info"):
                    kv = {}
                    for tr in body.select("tr"):
                        tds = tr.find_all("td")
                        kv[tds[0].get_text().strip()] = clean_ws(tds[1].get_text()).strip()
                    side["episodeTitle"] = kv.get("Title")
            meta["sidebar"] = side
        for post in soup.select(".posts > .post"):
            pu = post.select_one(".post-user")
            uname_el = pu.select_one(".username")
            name = uname_el.get_text().strip()
            is_mod = "mod" in (uname_el.get("class") or [])
            avatar = pu.select_one("use")["href"].split("#")[-1]
            rank = pu.select_one(".rank").get_text().strip() if pu.select_one(".rank") else None
            um = {}
            for d in pu.select(".user-meta > div"):
                t = d.get_text().strip()
                if ":" in t:
                    k, v = t.split(":", 1)
                    um[k.strip()] = v.strip()
            online = bool(pu.select_one(".status-online"))
            pnum = int(post.select_one(".post-num").get_text().strip().lstrip("#"))
            ptime, ptz = parse_time(post.select_one(".post-time").get_text())
            pc = post.select_one(".post-content")
            ctx = {}
            paras = block(pc, ctx)
            body = "\n\n".join(paras)
            rec = {
                "n": pnum,
                "author": name,
                "av": avatar,
                "at": ptime,
                "tz": ptz,
                "body": body,
                "authorPosts": num(um["Posts"]) if "Posts" in um else None,
                "online": online,
            }
            if rank:
                rec["rank"] = rank
            if pc.get("style"):
                rec["announcement"] = True
            if ctx.get("edited_at"):
                rec["editedAt"] = ctx["edited_at"]
                rec["editedTz"] = ctx["edited_tz"]
                if ctx.get("edit_reason"):
                    rec["editReason"] = ctx["edit_reason"]
            posts.append(rec)
            u = users.setdefault(name, {"name": name, "avatar": avatar, "rank": rank, "joined": um.get("Joined"), "mod": is_mod, "maxPosts": 0, "firstSeen": ptime})
            if rec["authorPosts"] and rec["authorPosts"] > u["maxPosts"]:
                u["maxPosts"] = rec["authorPosts"]
                u["rank"] = rank or u["rank"]
            if ptime < u["firstSeen"]:
                u["firstSeen"] = ptime
            if u["avatar"] != avatar:
                u.setdefault("altAvatars", [])
                if avatar not in u["altAvatars"]:
                    u["altAvatars"].append(avatar)
    nums = [p["n"] for p in posts]
    dup = len(nums) - len(set(nums))
    meta["episode"] = ep
    meta["pages"] = len(files)
    meta["posts"] = posts
    threads.append(meta)
    print("ep%d: %d pages, %d posts, dup numbers %d, max #%d" % (ep, len(files), len(posts), dup, max(nums)), file=sys.stderr)

json.dump({"threads": threads, "users": sorted(users.values(), key=lambda u: u["name"].lower())},
          open(os.path.join(OUT, "ioe-threads.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

with open(os.path.join(OUT, "avatars.svg"), "w", encoding="utf-8") as fh:
    fh.write('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n')
    for sid in sorted(symbols):
        fh.write(symbols[sid] + "\n")
    fh.write("</svg>\n")
print("users %d, avatars %d" % (len(users), len(symbols)), file=sys.stderr)
