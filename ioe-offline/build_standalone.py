#!/usr/bin/env python3
"""Bundle index.html + styles.css + avatars.svg + forum.js into one portable file.

Output: yal_impact_of_eden_ep1_2013.html

The resulting file works standalone - no other files needed. Drop it on a
desktop, double-click, and the whole Episode 1 thread opens in any browser.
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def read(name):
    with open(os.path.join(HERE, name), "r", encoding="utf-8") as f:
        return f.read()


def build():
    html = read("index.html")
    css = read("styles.css")
    svg = read("avatars.svg")
    js = read("forum.js")

    # ---- 1. Inline the stylesheet ----
    html = html.replace(
        '<link rel="stylesheet" href="styles.css">',
        "<style>\n" + css + "\n</style>",
    )

    # ---- 2. Inline the JavaScript ----
    html = html.replace(
        '<script src="forum.js"></script>',
        "<script>\n" + js + "\n</script>",
    )

    # ---- 3. Embed the SVG sprite right after <body> ----
    #     Existing <use href="avatars.svg#av-..."/> references would break in
    #     a standalone file. We rewrite them to point at the inlined sprite
    #     (just "#av-..." since the symbols live in the same document now).
    html = html.replace('href="avatars.svg#', 'href="#')
    html = html.replace("href='avatars.svg#", "href='#")

    sprite_block = (
        "\n<!-- Inlined avatar sprite (was avatars.svg) -->\n"
        + svg.replace(
            '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute">',
            '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" '
            'style="position:absolute;width:0;height:0;overflow:hidden" '
            'aria-hidden="true">',
        )
        + "\n"
    )
    html = html.replace("<body>", "<body>" + sprite_block, 1)

    # Keep page links intact so users can navigate across all pages
    # Add Episode 2 button in controls bar if missing
    if 'Episode 2 Discussion' not in html:
        html = html.replace('<a href="#" class="btn">Episode List</a>', '<a href="#" class="btn">Episode List</a>\n    <a href="yal_impact_of_eden_ep2_2013.html" class="btn">Episode 2 Discussion</a>\n    <a href="yal_impact_of_eden_ep3_2013.html" class="btn">Episode 3 Discussion</a>')
    elif 'Episode 3 Discussion' not in html:
        html = html.replace('<a href="yal_impact_of_eden_ep2_2013.html" class="btn">Episode 2 Discussion</a>', '<a href="yal_impact_of_eden_ep2_2013.html" class="btn">Episode 2 Discussion</a>\n    <a href="yal_impact_of_eden_ep3_2013.html" class="btn">Episode 3 Discussion</a>')

    out_path = os.path.join(HERE, "yal_impact_of_eden_ep1_2013.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)

    size_kb = os.path.getsize(out_path) / 1024
    print(f"Built: {out_path}")
    print(f"Size:  {size_kb:.1f} KB")


if __name__ == "__main__":
    build()
