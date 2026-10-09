#!/usr/bin/env python3
"""Bundle the entire Impact of Eden offline-universe site into one downloadable zip.

Output: impact_of_eden_offline_universe.zip

The resulting zip is self-contained. Unzip it anywhere, double-click any of the
HTML files (start with google.html or index.html), and the whole offline universe
opens in your default browser. No server required.

Files included:
  - google.html                         (Google search results page)
  - aniwire_impact_of_eden_premiere.html
  - munchyroll_impact_of_eden.html
  - sakugathread_impact_of_eden.html
  - anifanwiki_impact_of_eden.html
  - threadit_impact_of_eden.html
  - adultdrift_impact_of_eden.html
  - index.html + page2.html .. page56.html  (full 56-page YAL thread)
  - styles.css, avatars.svg, forum.js      (forum assets)
  - README.txt                          (entry-point guide)
"""
import os
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_NAME = "impact_of_eden_offline_universe.zip"

FILES = [
    # Search results entry point
    "google.html",

    # Fake Eden-universe sites that Google links to
    "aniwire_impact_of_eden_premiere.html",
    "munchyroll_impact_of_eden.html",
    "sakugathread_impact_of_eden.html",
    "anifanwiki_impact_of_eden.html",
    "threadit_impact_of_eden.html",
    "adultdrift_impact_of_eden.html",

    # YAL Episode 1 Discussion thread (56 pages)
    "index.html",
    "yal_impact_of_eden_ep1_2013.html",

    # YAL Episode 2 Discussion thread (48 pages)
    "yal_impact_of_eden_ep2_2013.html",

    # YAL Episode 3 Discussion thread (54 pages)
    "yal_impact_of_eden_ep3_2013.html",

    # Forum-thread assets
    "styles.css",
    "avatars.svg",
    "forum.js",
    "sora_gauthier_portrait.svg",
]
# Add page2.html through page56.html
FILES += [f"page{i}.html" for i in range(2, 57)]
# Add Ep 2 pages
FILES += [f"ep2_page{i}.html" for i in range(2, 49)]
# Add Ep 3 pages
FILES += [f"ep3_page{i}.html" for i in range(2, 55)]


README = """IMPACT OF EDEN (2013) - OFFLINE UNIVERSE MODE
======================================================

This folder contains a full offline mockup of the Eden Episode 1 release
weekend as it might have appeared across the web in October 2013.

QUICK START
-----------
Double-click ONE of these to begin:

  1. google.html      -> The Google search results page (best entry point).
                         From here, click any blue link to visit the
                         corresponding fake site.

  2. index.html       -> Drop directly into the YourAnimeList Episode 1
                         Discussion thread. Page 1 of 56.

  3. Or pick any individual site:
       - aniwire_impact_of_eden_premiere.html  (AniWire premiere review)
       - munchyroll_impact_of_eden.html        (MunchyRoll streaming page)
       - sakugathread_impact_of_eden.html      (SakugaThread megathread)
       - anifanwiki_impact_of_eden.html        (AniFanWiki article)
       - threadit_impact_of_eden.html          (Threadit / Reddit clone)
       - adultdrift_impact_of_eden.html        (AdultDrift dub announcement)

EVERYTHING IS OFFLINE
---------------------
No internet connection, no server, no install required. Every page loads
locally and every link inside the folder is a relative path. Cross-site
links between the fake Eden-universe pages work as long as all files stay
in the same folder.

FILES IN THIS BUNDLE
--------------------
- 1 Google search page (google.html)
- 6 supporting fake-website pages (AniWire, MunchyRoll, SakugaThread,
  AniFanWiki, Threadit, AdultDrift)
- 56 YAL Episode 1 Discussion thread pages (index.html + page2..page56)
- 3 forum-shared assets (styles.css, avatars.svg, forum.js)

= about 65 files total, ~2 MB unzipped.

ABOUT
-----
Built for use with the Impact of Eden (2013) universe. All shown
parodies, networks, sites, and usernames are original parody designs for
the Eden universe. No real-world copyrighted properties are referenced.

Enjoy the offline universe mode.
"""


def main():
    out_path = os.path.join(HERE, OUT_NAME)
    if os.path.exists(out_path):
        os.remove(out_path)

    missing = []
    included = []

    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for fname in FILES:
            fpath = os.path.join(HERE, fname)
            if not os.path.exists(fpath):
                missing.append(fname)
                continue
            zf.write(fpath, arcname=fname)
            included.append(fname)

        zf.writestr("README.txt", README)
        included.append("README.txt")

    size_kb = os.path.getsize(out_path) / 1024
    print(f"Built: {out_path}")
    print(f"Size:  {size_kb:.1f} KB")
    print(f"Files included: {len(included)}")
    if missing:
        print(f"WARNING - missing files (skipped): {missing}")


if __name__ == "__main__":
    main()
