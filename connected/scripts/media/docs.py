"""Sample documents: a real text PDF (hand-written PDF syntax) and text files."""

from common import ensure_dirs, record

GUIDE = [
    ("Welcome to your Connected PC", [
        "Hi there, and welcome! This little guide covers the basics of your",
        "new computer. Keep it in My Documents and open it whenever you like.",
        "",
        "The Start button (bottom left) opens every program and your folders.",
        "Click a taskbar button to switch windows; click it again to minimize.",
        "Drag a window by its title bar. Drag its edges or corner to resize it.",
        "Double-click the title bar to maximize, or use the buttons on the right.",
        "",
        "The clock in the corner shows the computer's date. Click it to see",
        "the calendar, or change the date in Settings > Date and Time.",
    ]),
    ("Getting online", [
        "Open the Web Browser from the desktop or the Start menu.",
        "Type an address (like metube.connectedera.local) or anything",
        "you want to search for, and Connected Search will find it.",
        "",
        "Handy shortcuts:",
        "  Ctrl+T  new tab          Ctrl+W  close tab",
        "  Ctrl+L  address bar      Ctrl+D  bookmark this page",
        "  Ctrl+H  history          Ctrl+J  downloads",
        "  F5      reload           Alt+Left / Alt+Right  back / forward",
        "",
        "Downloads are saved to your Downloads folder. Pictures can be set as",
        "your desktop background straight from Photo Viewer.",
    ]),
    ("Staying in touch", [
        "Messenger keeps you chatting with friends. Set your status to Online,",
        "Away or Busy, and paste any web link to share it.",
        "",
        "Mail is your inbox. Write, reply, forward and attach files from",
        "your computer. Drafts are saved automatically.",
        "",
        "Everything you make is saved on this computer, so it will all still",
        "be here after you restart. Have fun!",
    ]),
]


def pdf_escape(s):
    return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def write_pdf(path, pages):
    objects = []

    def add(body):
        objects.append(body)
        return len(objects)

    font_id = add(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    bold_id = add(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
    pages_id = add(None)  # placeholder
    page_ids = []
    for n, (title, lines) in enumerate(pages, start=1):
        ops = ["BT", "/F2 22 Tf", "72 720 Td", f"({pdf_escape(title)}) Tj", "ET"]
        ops += ["0.2 0.4 0.75 RG", "2 w", "72 708 m 540 708 l S"]
        y = 680
        for ln in lines:
            ops += ["BT", "/F1 12 Tf", f"72 {y} Td", f"({pdf_escape(ln)}) Tj", "ET"]
            y -= 18
        ops += ["BT", "/F1 9 Tf", "290 40 Td", f"(Page {n} of {len(pages)}) Tj", "ET"]
        stream = "\n".join(ops).encode("latin-1")
        content_id = add(b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"\nendstream")
        page_ids.append(add(
            b"<< /Type /Page /Parent %d 0 R /MediaBox [0 0 612 792] /Contents %d 0 R /Resources << /Font << /F1 %d 0 R /F2 %d 0 R >> >> >>"
            % (pages_id, content_id, font_id, bold_id)
        ))
    kids = " ".join(f"{i} 0 R" for i in page_ids).encode()
    objects[pages_id - 1] = b"<< /Type /Pages /Kids [" + kids + b"] /Count %d >>" % len(page_ids)
    catalog_id = add(b"<< /Type /Catalog /Pages %d 0 R >>" % pages_id)
    info_id = add(b"<< /Title (Welcome to your Connected PC) /Producer (Connected Era sample documents) >>")

    out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = []
    for i, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += b"%d 0 obj\n" % i + body + b"\nendobj\n"
    xref = len(out)
    out += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objects) + 1)
    for off in offsets:
        out += b"%010d 00000 n \n" % off
    out += b"trailer\n<< /Size %d /Root %d 0 R /Info %d 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (len(objects) + 1, catalog_id, info_id, xref)
    path.write_bytes(bytes(out))


TEXTS = {
    "shopping-list.txt": "Saturday shopping list\n\n- milk\n- blueberries (pancakes!)\n- new sketchbook\n- batteries for the controller\n- birthday card for Grandma\n",
    "summer-plans.txt": "Summer plans 2013\n\n1. Finish Star Courier on hard mode\n2. Learn three songs on the keyboard\n3. Make a desktop wallpaper in Paint\n4. Start a Tum blog for my drawings\n5. Paper plane record: beat 24 m\n",
}


def main():
    out = ensure_dirs("docs")
    pdf = out / "welcome-to-your-connected-pc.pdf"
    write_pdf(pdf, GUIDE)
    record("doc:welcome-pdf", pdf, name="Welcome to your Connected PC.pdf", pages=len(GUIDE))
    for name, text in TEXTS.items():
        p = out / name
        p.write_text(text)
        record(f"doc:{name}", p, name=name)
    print("docs ok")


if __name__ == "__main__":
    main()
