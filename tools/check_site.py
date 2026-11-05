"""Einfacher Qualitätscheck für die statische Website.

Prüft alle HTML-Dateien in public/ auf:
- nicht geschlossene oder falsch verschachtelte Tags
- doppelte IDs
- Bilder ohne alt-Attribut
- interne Links und Dateiverweise, die ins Leere gehen (inkl. #Anker)
- Zweisprachigkeit: <html lang> passt zum Ordner (en/ = Englisch, sonst
  Deutsch), jede Sprachfassung (hreflang) existiert und verweist zurück,
  jede Seite hat den Sprachumschalter

Aufruf:  python3 tools/check_site.py
"""
from __future__ import annotations

import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1] / "public"
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
SVG_SELF_CLOSING_OK = True


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack: list[tuple[str, int]] = []
        self.errors: list[str] = []
        self.ids: dict[str, int] = {}
        self.refs: list[tuple[str, str, int]] = []
        self.lang: str | None = None
        self.alternates: dict[str, str] = {}
        self.has_switch = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        line = self.getpos()[0]
        if tag == "html":
            self.lang = a.get("lang")
        if tag == "link" and a.get("rel") == "alternate" and a.get("hreflang"):
            self.alternates[a["hreflang"]] = a.get("href", "")
        if tag == "a" and "lang-switch" in (a.get("class") or "").split():
            self.has_switch = True
        if "id" in a:
            if a["id"] in self.ids:
                self.errors.append(f"Zeile {line}: doppelte ID '{a['id']}'")
            self.ids[a["id"]] = line
        if tag == "img" and "alt" not in a:
            self.errors.append(f"Zeile {line}: <img> ohne alt")
        for key in ("href", "src"):
            if key in a and a[key]:
                self.refs.append((key, a[key], line))
        for key in ("srcset", "imagesrcset"):
            if key in a and a[key]:
                for part in a[key].split(","):
                    url = part.strip().split(" ")[0]
                    if url:
                        self.refs.append((key, url, line))
        if tag not in VOID:
            self.stack.append((tag, line))

    def handle_startendtag(self, tag, attrs):
        # <use .../>, <path .../> usw. in SVG
        a = dict(attrs)
        if "id" in a:
            if a["id"] in self.ids:
                self.errors.append(f"Zeile {self.getpos()[0]}: doppelte ID '{a['id']}'")
            self.ids[a["id"]] = self.getpos()[0]
        if "href" in a:
            self.refs.append(("href", a["href"], self.getpos()[0]))

    def handle_endtag(self, tag):
        line = self.getpos()[0]
        if tag in VOID:
            return
        if not self.stack:
            self.errors.append(f"Zeile {line}: </{tag}> ohne öffnendes Tag")
            return
        open_tag, open_line = self.stack.pop()
        if open_tag != tag:
            self.errors.append(f"Zeile {line}: </{tag}> schließt <{open_tag}> aus Zeile {open_line}")


def resolve(page_path: Path, url: str) -> tuple[Path | None, str]:
    parts = urlsplit(url)
    if parts.scheme or url.startswith("//"):
        return None, ""
    path = unquote(parts.path)
    if not path:
        return page_path, parts.fragment
    target = (ROOT / path.lstrip("/")) if path.startswith("/") else (page_path.parent / path)
    if path.endswith("/") or target.is_dir():
        target = target / "index.html"
    return target.resolve(), parts.fragment


SITE = "https://www.zahnarztpraxis-theurer.de"


def check_languages(parsed: dict[Path, Page]) -> None:
    for p, page in parsed.items():
        rel = p.relative_to(ROOT.resolve())
        expected = "en" if rel.parts[0] == "en" else "de"
        if p.name == "404.html":
            expected = "de"  # eine Fehlerseite für beide Sprachen, mit englischem Block
        if page.lang != expected:
            page.errors.append(f"<html lang='{page.lang}'> – erwartet '{expected}'")
        if not page.has_switch:
            page.errors.append("Sprachumschalter (.lang-switch) fehlt in der Kopfzeile")
        if p.name == "404.html":
            continue
        if set(page.alternates) != {"de", "en", "x-default"}:
            page.errors.append(f"hreflang unvollständig: {sorted(page.alternates)}")
            continue
        own = f"{SITE}/{rel.parent.as_posix()}/".replace(f"{SITE}/./", f"{SITE}/")
        if page.alternates.get(expected) != own:
            page.errors.append(f"hreflang='{expected}' zeigt nicht auf die Seite selbst ({own})")
        for lang, url in page.alternates.items():
            if not url.startswith(SITE + "/"):
                page.errors.append(f"hreflang='{lang}': unerwartete Adresse {url}")
                continue
            target = (ROOT / url[len(SITE) + 1:] / "index.html").resolve()
            if target not in parsed:
                page.errors.append(f"hreflang='{lang}' zeigt auf fehlende Seite {url}")
            elif lang in ("de", "en") and parsed[target].alternates.get(expected) != own:
                page.errors.append(f"hreflang='{lang}': {url} verweist nicht zurück auf diese Seite")


def main() -> int:
    pages = sorted(ROOT.rglob("*.html"))
    parsed: dict[Path, Page] = {}
    problems = 0
    for p in pages:
        page = Page()
        page.feed(p.read_text(encoding="utf-8"))
        page.close()
        for tag, line in page.stack:
            page.errors.append(f"Zeile {line}: <{tag}> nicht geschlossen")
        parsed[p.resolve()] = page
    check_languages(parsed)
    for p, page in parsed.items():
        for key, url, line in page.refs:
            if url.startswith(("mailto:", "tel:")):
                continue
            target, frag = resolve(p, url)
            if target is None:
                continue
            if p.name == "404.html" and url.startswith("/"):
                target, frag = resolve(ROOT / "index.html", url.lstrip("/") or "./")
                target = target if target else None
            if target and not target.exists():
                page.errors.append(f"Zeile {line}: {key}='{url}' zeigt auf fehlende Datei")
                continue
            if frag and target:
                ids = parsed.get(target).ids if target in parsed else {}
                if frag not in ids:
                    page.errors.append(f"Zeile {line}: Anker '#{frag}' fehlt in {target.relative_to(ROOT)}")
        rel = p.relative_to(ROOT.resolve())
        if page.errors:
            problems += len(page.errors)
            print(f"✗ {rel}")
            for e in page.errors:
                print("   ", e)
        else:
            print(f"✓ {rel}: {len(page.refs)} Verweise, {len(page.ids)} IDs")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
