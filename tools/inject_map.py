"""Setzt tools/map/karte-inline.svg zwischen die Marker in public/index.html
und – mit englischer Beschriftung – in public/en/index.html ein.

Aufruf (nach build_map.py):  python3 tools/inject_map.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
START, END = "<!-- karte:start -->", "<!-- karte:end -->"

# Beschriftung der Karte auf Englisch. Straßen- und Haltestellennamen bleiben deutsch.
MAP_EN = [
    ("Lageplan der Zahnarztpraxis Theurer", "Location map of Theurer Dental Practice"),
    (">Zahnarztpraxis Theurer<", ">Theurer Dental Practice<"),
    (">Haltestelle Lämmerhof<", ">Lämmerhof bus stop<"),
    (">Haltestelle<", ">Bus stop<"),
    (">Parkplätze<", ">Parking<"),
    (">Praxis<", ">Practice<"),
]


def translate_map(svg: str) -> str:
    """Übersetzt Titel, Beschreibung und Beschriftungen der Inline-Karte ins Englische."""
    for de, en in MAP_EN:
        svg = svg.replace(de, en)
    svg = re.sub(r"(\d+) Min\. zu Fuß", r"\1 min walk", svg)
    svg = re.sub(
        r"Die Praxis liegt in der Schützenstraße 2 in Oldendorf, nahe der Hauptstraße\. "
        r"Von der Bushaltestelle Lämmerhof an der Hauptstraße sind es rund (\d+) Meter zu Fuß, "
        r"etwa (\d+) Minuten\. Parkplätze liegen direkt vor der Praxis\.",
        r"The practice is at Schützenstraße 2 in Oldendorf, near Hauptstraße. "
        r"From the Lämmerhof bus stop on Hauptstraße it is about \1 metres on foot, "
        r"roughly \2 minutes. Parking is right outside the practice.",
        svg,
    )
    left = [w for w in ("Lageplan", "Haltestelle", "Parkplätze", ">Praxis<", "zu Fuß", "Meter zu") if w in svg]
    if left:
        raise SystemExit(f"Karte: unübersetzt geblieben: {left} – MAP_EN in tools/inject_map.py ergänzen")
    return svg


def inject(html_path: Path, svg: str) -> None:
    html = html_path.read_text(encoding="utf-8")
    a, b = html.index(START) + len(START), html.index(END)
    html_path.write_text(html[:a] + "\n" + svg + "\n" + html[b:], encoding="utf-8")


def main() -> None:
    svg = (ROOT / "tools" / "map" / "karte-inline.svg").read_text(encoding="utf-8").strip()
    inject(ROOT / "public" / "index.html", svg)
    inject(ROOT / "public" / "en" / "index.html", translate_map(svg))
    print("Karte eingesetzt (Deutsch und Englisch).")


if __name__ == "__main__":
    main()
