"""Weitere gezeichnete Bilder für README / Wiki / Forum (Mockups im Stil von make_demo_gif.py, HA dunkel):

- docs/images/setup.gif (+ setup-de.gif): der Einrichtungs-Assistent Schritt für Schritt
- docs/images/share-window.png: Teilen-Fenster (QR, Rechte, Passwort, „Wer darf was?“)
- docs/images/shared-page.png: die geteilte Seite (Hallo, Suche, Sortierung, Angebot, Freigabe, „geteilt bis“)

    python scripts/make_doc_images.py
"""

from __future__ import annotations

import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_demo_gif as base  # noqa: E402  – Schriften, Farben, Canvas, GIF schreiben

S = base.S
OUT = base.OUT
BG, CARD, FIELD, LINE = base.BG, base.CARD, base.FIELD, base.LINE
TEXT, DIM, ACCENT, GO = base.TEXT, base.DIM, base.ACCENT, base.GO
SEL = "#3d5a96"
GREEN, ORANGE = "#81c784", "#ffb74d"


class C(base.Canvas):
    def __init__(self, w: int, h: int) -> None:  # noqa: D107 – eigene Größe
        self.w, self.h = w, h
        self.im = Image.new("RGB", (w * S, h * S), BG)
        self.d = ImageDraw.Draw(self.im)

    def done(self) -> Image.Image:
        return self.im.resize((self.w, self.h), Image.LANCZOS)

    def line(self, x1, y, x2):
        self.d.line([x1 * S, y * S, x2 * S, y * S], fill=LINE, width=S)

    def switch(self, x, y, on):
        self.rect(x, y - 10, 36, 20, 10, GO if on else "#3a3f4a")
        self.rect(x + (18 if on else 2), y - 8, 16, 16, 8, "#ffffff" if on else "#bbbbbb")

    def seg(self, x_right, y, opts, active) -> None:
        widths = [self.width(o, "small") + 20 for o in opts]
        x = x_right - sum(widths)
        self.rect(x, y - 13, sum(widths), 26, 13, None, outline="#3a3f4a")
        for o, w in zip(opts, widths):
            if o == active:
                self.rect(x + 1, y - 12, w - 2, 24, 12, SEL)
            self.text(x + w / 2, y, o, "small", "#ffffff" if o == active else DIM, "mm")
            x += w

    def button(self, x, y, label, primary=True, w=None) -> float:
        w = w or self.width(label, "small") + 28
        self.rect(x, y - 15, w, 30, 15, GO if primary else None, outline=None if primary else "#3a3f4a")
        self.text(x + w / 2, y, label, "small", "#ffffff" if primary else ACCENT, "mm")
        return w

    def tick(self, x, y, color, size=10):
        """Häkchen gezeichnet (Lato hat kein ✓)."""
        k = size / 10
        self.d.line([(x) * S, (y) * S, (x + 3.5 * k) * S, (y + 3.5 * k) * S, (x + 10 * k) * S, (y - 4 * k) * S], fill=color, width=int(2 * S), joint="curve")

    def tri(self, x, y, color):
        self.d.polygon([((x - 4) * S, (y - 2) * S), ((x + 4) * S, (y - 2) * S), (x * S, (y + 3) * S)], fill=color)

    def updown(self, x, y, color):
        self.d.polygon([((x - 3) * S, (y - 1) * S), ((x + 3) * S, (y - 1) * S), (x * S, (y - 6) * S)], fill=color)
        self.d.polygon([((x - 3) * S, (y + 1) * S), ((x + 3) * S, (y + 1) * S), (x * S, (y + 6) * S)], fill=color)

    def avatar(self, x, y, letter, color):
        self.rect(x, y - 13, 26, 26, 13, color)
        self.text(x + 13, y, letter, "tiny", "#ffffff", "mm")


def qr(c: C, x, y, size):
    """Platzhalter-QR (Muster, kein echter Code)."""
    c.rect(x, y, size, size, 10, "#ffffff")
    n, rnd = 21, random.Random(7)
    cell = (size - 20) / n
    for i in range(n):
        for j in range(n):
            finder = any(i in r and j in q for r, q in ((range(0, 7), range(0, 7)), (range(0, 7), range(14, 21)), (range(14, 21), range(0, 7))))
            on = (finder and (i in (0, 6, 14, 20) or j in (0, 6, 14, 20) or (i % 14 in range(2, 5) and j % 14 in range(2, 5)))) or (not finder and rnd.random() < .45)
            if on:
                c.d.rectangle([(x + 10 + j * cell) * S, (y + 10 + i * cell) * S, (x + 10 + (j + 1) * cell) * S, (y + 10 + (i + 1) * cell) * S], fill="#111318")


# ---------------------------------------------------------------- Teilen-Fenster
def share_window() -> Image.Image:
    c = C(720, 640)
    c.rect(16, 16, 688, 608, 14, CARD)
    c.text(36, 44, "Share “Weekly shop”", "title")
    c.text(36, 66, "For people without a Home Assistant account – only this list.", "small", DIM)
    qr(c, 36, 86, 160)
    x0, x1 = 216, 684
    rows = [("May check off", "seg"), ("May add items", True), ("Additions need approval", True), ("Show notes", False),
            ("Password", "pw"), ("Repeat password", "pw2"), ("Valid for", "7 days")]
    y = 100
    for label, val in rows:
        c.text(x0, y, label, "body")
        if val == "seg":
            c.seg(x1, y, ["No", "Yes", "Soft"], "Soft")
        elif val in (True, False):
            c.switch(x1 - 36, y, val)
        elif val in ("pw", "pw2"):
            c.rect(x1 - 170, y - 14, 170, 28, 8, FIELD)
            c.text(x1 - 160, y, "•" * 8, "body", TEXT)
            if val == "pw2":
                c.tick(x1 - 170, y + 22, GREEN, 8)
                c.text(x1 - 156, y + 22, "Passwords match", "small", GREEN)
        else:
            c.text(x1 - 12, y, val, "small", DIM, "rm")
            c.tri(x1 - 3, y, DIM)
        y += 38 if val != "pw2" else 50
        c.line(x0, y - 19, x1)
    c.rect(x0, y - 6, x1 - x0, 30, 8, FIELD)
    c.text(x0 + 10, y + 9, "https://list.example.org/smartlists-share/••••••••", "small")
    bx = x0
    for label, prim in (("Copy link", False), ("Share …", False), ("Revoke", False)):
        bx += c.button(bx, y + 52, label, prim) + 8
    # Wer darf was? – eigener Abschnitt unter dem Link (volle Breite, wie in der Karte)
    y = y + 92
    c.line(36, y - 18, 684)
    c.text(36, y, "WHO MAY DO WHAT?", "cat", DIM)
    for i, (name, letter, color, role) in enumerate((("Peter", "P", "#a0522d", None), ("Anna", "A", "#2e9d5b", "Edit"), ("Max", "M", "#3949ab", "Check off"))):
        yy = y + 30 + i * 36
        c.avatar(36, yy, letter, color)
        c.text(72, yy, name, "body")
        if role is None:
            c.text(72 + c.width(name, "body") + 8, yy, "owner", "small", DIM)
            c.text(684, yy, "all rights", "small", DIM, "rm")
        else:
            c.seg(660, yy, ["View", "Check off", "Edit"], role)
            c.text(676, yy, "×", "body", DIM, "mm")
    return c.done()


# ---------------------------------------------------------------- geteilte Seite
def shared_page() -> Image.Image:
    c = C(460, 620)
    c.text(24, 34, "Weekly shop", "title")
    c.text(24, 58, "4 open · Hello Anna · ", "small", DIM)
    c.text(24 + c.width("4 open · Hello Anna · ", "small"), 58, "change", "small", ACCENT)
    c.rect(300, 20, 96, 30, 15, None, outline="#3a3f4a")
    c.updown(318, 35, TEXT)
    c.text(328, 35, "Category", "small", TEXT)
    c.rect(404, 20, 30, 30, 15, None, outline="#3a3f4a")
    c.d.ellipse([413 * S, 28 * S, 423 * S, 38 * S], outline=TEXT, width=2 * S)
    c.d.line([422 * S, 37 * S, 427 * S, 42 * S], fill=TEXT, width=2 * S)
    c.rect(20, 76, 318, 40, 10, FIELD)
    c.text(32, 96, "Add an item …", "body", DIM)
    c.button(346, 96, "Add", True, 94)
    y = 138

    def group(title):
        nonlocal y
        c.text(26, y, title, "cat", DIM)
        y += 14

    def item(name, tags=(), sub=None, sub_color=DIM, qty=None, soft=None):
        nonlocal y
        h = 44 if (sub or soft) else 36
        c.rect(20, y, 420, h, 10, CARD)
        cy = y + (15 if (sub or soft) else 18)
        c.checkbox(34, cy, on=bool(soft))
        c.text(60, cy, name, "body")
        bx = 60 + c.width(name, "body") + 8
        for t in tags:
            bx += c.tag(bx, cy, t) + 5
        if qty:
            c.text(426, cy, qty, "body", TEXT, "rm")
        if sub:
            if isinstance(sub, tuple):
                sx = 60
                for part, col in sub:
                    c.text(sx, cy + 17, part, "small", col)
                    sx += c.width(part, "small") + 6
            else:
                c.text(60, cy + 17, sub, "small", sub_color)
        if soft:
            c.tick(60, cy + 17, ACCENT, 8)
            c.text(74, cy + 17, "marked by " + soft + " (link)", "small", ACCENT)
        y += h + 6

    group("PENDING APPROVAL · 1")
    item("Pringles", sub="↗ added by you", sub_color=ORANGE)
    y += 8
    group("FRUIT & VEG · 1")
    item("Apples", ("@ALDI",), qty="1 kg", sub="↗ added by Max")
    y += 8
    group("DRINKS · 2")
    item("Mineral water", sub=(("REWE", "#ff5252"), ("Offer", ORANGE), ("4,29 €", TEXT), ("until 21.11.", DIM)))
    item("Milk", ("@REWE", "#organic"), qty="2 l", soft="Max")
    c.text(230, 596, "Shared until 26 Nov 2026, 14:33 (10 days left)", "small", DIM, "mm")
    return c.done()


# ---------------------------------------------------------------- Einrichtungs-Assistent (GIF)
STEPS = {
    "en": ["Lists", "Stores", "Notation", "Language", "People", "Extras", "Done"],
    "de": ["Listen", "Märkte", "Schreibweise", "Sprache", "Personen", "Extras", "Fertig"],
}
TX = {
    "en": dict(title="Set up SmartLists", time="Takes about two minutes.", step="Step {n} of 7", next="Next", finish="Set up", start="Let's go",
               lists_h="What would you like to start with?", use="Use existing lists", combine="Combine into one shared list", name="Weekly shop",
               stores_h="Where do you shop?", naming_h="How do you mark store, person and tag?", store="Store", person="Person", tag="Tag",
               becomes="becomes", lang_h="In which language do you write items?", people_h="Who joins in?", extras_h="What else should SmartLists do?",
               optional="OPTIONAL – ALSO LATER UNDER SETTINGS → EXTRAS", done_h="All set",
               x=["Tell me when someone adds something", "Add items by voice", "Prices and expenses", "Look up barcodes online"],
               xo=["Notes", "Meal plan", "Statistics and expenses"], words="words",
               sum=["Shared list “Weekly shop” from 3 lists", "Stores: REWE, LIDL, ALDI", "Notation: @ store, * person, # tag", "Categories: German, English"],
               roles=["view", "check off", "edit"], milk="Milk 2 l @REWE *Anna #organic", item="Milk"),
    "de": dict(title="SmartLists einrichten", time="Dauert etwa zwei Minuten.", step="Schritt {n} von 7", next="Weiter", finish="Einrichten", start="Los geht's",
               lists_h="Womit möchtest du anfangen?", use="Vorhandene Listen benutzen", combine="Zu einer gemeinsamen Liste zusammenfassen", name="Wocheneinkauf",
               stores_h="Wo kaufst du ein?", naming_h="Wie markierst du Markt, Person und Schlagwort?", store="Markt", person="Person", tag="Schlagwort",
               becomes="wird zu", lang_h="In welcher Sprache schreibt ihr Artikel?", people_h="Wer macht mit?", extras_h="Was soll SmartLists noch können?",
               optional="OPTIONAL – AUCH SPÄTER UNTER EINSTELLUNGEN → EXTRAS", done_h="Alles eingerichtet",
               x=["Bescheid geben, wenn jemand etwas einträgt", "Per Sprache eintragen", "Preise und Ausgaben", "Strichcodes online nachschlagen"],
               xo=["Notizen", "Wochenplan", "Statistik und Ausgaben"], words="Wörter",
               sum=["Gemeinsame Liste „Wocheneinkauf“ aus 3 Listen", "Märkte: REWE, LIDL, ALDI", "Schreibweise: @ Markt, * Person, # Schlagwort", "Kategorien: Deutsch, Englisch"],
               roles=["sehen", "abhaken", "bearbeiten"], milk="Milch 2 l @REWE *Anna #bio", item="Milch"),
}
W2, H2 = 640, 470


def wizard(lang: str, step: int, sub: float = 1.0, press: bool = False) -> Image.Image:
    tx, steps = TX[lang], STEPS[lang]
    c = C(W2, H2)
    c.rect(20, 14, W2 - 40, H2 - 28, 16, CARD)
    c.text(44, 44, tx["title"], "title")
    c.text(44, 66, tx["time"], "small", DIM)
    # Schrittleiste
    x = 44
    for i, s in enumerate(steps):
        col = GREEN if i < step else ("#ffffff" if i == step else DIM)
        c.rect(x, 84, 18, 18, 9, GO if i == step else (None if i > step else "#2e5e3a"), outline=None if i <= step else "#3a3f4a")
        if i < step:
            c.tick(x + 4.5, 93, GREEN, 9)
        else:
            c.text(x + 9, 93, str(i + 1), "tiny", col if i != step else "#ffffff", "mm")
        c.text(x + 23, 93, s, "small", col)
        x += 23 + c.width(s, "small") + 14
    c.rect(44, 114, W2 - 88, 4, 2, FIELD)
    c.rect(44, 114, (W2 - 88) * (step + sub) / 7, 4, 2, ACCENT)
    y = 146
    key = ["lists", "stores", "naming", "lang", "people", "extras", "done"][step]
    if key == "lists":
        c.text(44, y, tx["lists_h"], "title")
        c.rect(44, y + 22, W2 - 88, 150, 10, None, outline=ACCENT)
        c.rect(58, y + 38, 14, 14, 7, ACCENT)
        c.text(82, y + 45, tx["use"], "bodyb")
        for i, n in enumerate(["todo.anna", "todo.max", "todo.shopping_list"]):
            yy = y + 76 + i * 26
            c.text(82, yy, n, "body", DIM)
            c.checkbox(W2 - 80, yy, on=sub > .3 + i * .15)
        c.text(82, y + 156, tx["combine"], "body")
        c.switch(W2 - 100, y + 156, sub > .8)
    elif key == "stores":
        c.text(44, y, tx["stores_h"], "title")
        x = 44
        for i, s in enumerate(["REWE", "LIDL", "ALDI", "EDEKA", "KAUFLAND", "PENNY", "NETTO", "DM"]):
            on = i < 3 and sub > .25 * (i + 1) - .2
            w = c.width(s, "small") + 26
            if x + w > W2 - 44:
                x, y = 44, y + 40
            c.rect(x, y + 26, w, 30, 15, SEL if on else None, outline=None if on else "#3a3f4a")
            c.text(x + w / 2, y + 41, s, "small", "#ffffff" if on else DIM, "mm")
            x += w + 8
    elif key == "naming":
        c.text(44, y, tx["naming_h"], "title")
        for i, (lab, ch) in enumerate(((tx["store"], "@"), (tx["person"], "*"), (tx["tag"], "#"))):
            yy = y + 40 + i * 40
            c.text(44, yy, lab, "body")
            c.rect(W2 - 104, yy - 15, 60, 30, 8, FIELD)
            c.text(W2 - 74, yy, ch, "title", TEXT, "mm")
        yy = y + 170
        c.rect(44, yy - 18, W2 - 88, 36, 8, FIELD)
        c.text(56, yy, tx["milk"], "input")
        bx = 56 + c.width(tx["milk"], "input") + 14
        c.text(bx, yy, tx["becomes"], "small", DIM)
        bx += c.width(tx["becomes"], "small") + 10
        c.text(bx, yy, tx["item"], "body")
        bx += c.width(tx["item"], "body") + 6
        for t in ("@REWE", "*Anna", "#bio" if lang == "de" else "#organic"):
            bx += c.tag(bx, yy, t) + 4
    elif key == "lang":
        c.text(44, y, tx["lang_h"], "title")
        for i, (n, w) in enumerate((("Deutsch", "6.509"), ("English", "412"), ("Français", "398"), ("Español", "401"), ("Italiano", "405"), ("Polski", "390"))):
            yy = y + 38 + i * 32
            c.text(44, yy, n, "body")
            c.text(200, yy, f"{w} {tx['words']}", "small", DIM)
            c.checkbox(W2 - 80, yy, on=i == 0 or (i == 1 and sub > .5))
    elif key == "people":
        c.text(44, y, tx["people_h"], "title")
        for i, (n, l, col, r) in enumerate((("Anna", "A", "#2e9d5b", 2), ("Max", "M", "#3949ab", 1))):
            yy = y + 44 + i * 40
            c.avatar(44, yy, l, col)
            c.text(80, yy, n, "body")
            c.seg(W2 - 44, yy, tx["roles"], tx["roles"][r if sub > .4 else 0])
    elif key == "extras":
        c.text(44, y, tx["extras_h"], "title")
        for i, n in enumerate(tx["x"]):
            yy = y + 36 + i * 30
            c.text(44, yy, n, "body")
            c.switch(W2 - 80, yy, i != 3 or sub > .5)
        c.text(44, y + 166, tx["optional"], "cat", DIM)
        for i, n in enumerate(tx["xo"]):
            yy = y + 192 + i * 30
            c.text(44, yy, n, "body")
            c.switch(W2 - 80, yy, False)
    else:
        c.text(44, y, tx["done_h"], "title")
        for i, sline in enumerate(tx["sum"]):
            c.text(56, y + 38 + i * 30, "•  " + sline, "body")
    label = tx["start"] if (key == "done" and sub >= 1) else tx["finish"] if key == "done" else tx["next"]
    w = c.width(label, "small") + 40
    c.rect(W2 - 44 - w, H2 - 66, w, 34, 17, base.mix(GO, "#ffffff", .25) if press else GO)
    c.text(W2 - 44 - w / 2, H2 - 49, label, "small", "#ffffff", "mm")
    c.text(44, H2 - 49, tx["step"].replace("{n}", str(step + 1)) + ": " + steps[step], "small", DIM)
    return c.done()


def wizard_frames(lang: str) -> list[tuple[Image.Image, int]]:
    out = []
    for step in range(7):
        for k in range(5):
            out.append((wizard(lang, step, k / 4), 260))
        out.append((wizard(lang, step, 1.0), 900))
        if step < 6:
            out.append((wizard(lang, step, 1.0, press=True), 160))
    out.append((wizard(lang, 6, 1.0), 1600))
    return out


def main() -> None:
    share_window().save(OUT / "share-window.png", optimize=True)
    shared_page().save(OUT / "shared-page.png", optimize=True)
    for lang in ("en", "de"):
        path = OUT / ("setup.gif" if lang == "en" else "setup-de.gif")
        base.write_gif(wizard_frames(lang), path)
    for n in ("share-window.png", "shared-page.png", "setup.gif", "setup-de.gif"):
        print(n, (OUT / n).stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
