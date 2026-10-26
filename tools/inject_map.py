"""Setzt tools/map/karte-inline.svg zwischen die Marker in public/index.html ein.

Aufruf (nach build_map.py):  python3 tools/inject_map.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
html_path = ROOT / "public" / "index.html"
svg = (ROOT / "tools" / "map" / "karte-inline.svg").read_text(encoding="utf-8").strip()
html = html_path.read_text(encoding="utf-8")
start, end = "<!-- karte:start -->", "<!-- karte:end -->"
a, b = html.index(start) + len(start), html.index(end)
html_path.write_text(html[:a] + "\n" + svg + "\n" + html[b:], encoding="utf-8")
print("Karte eingesetzt.")
