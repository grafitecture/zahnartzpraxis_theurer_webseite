#!/usr/bin/env bash
# Einmaliger Import der alten WordPress-Website als Referenz fuer den Relaunch.
set -uo pipefail
BASE="https://www.zahnarztpraxis-theurer.de"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
OUT="legacy"
mkdir -p "$OUT/pages" "$OUT/wp-json" "$OUT/media" "$OUT/mirror"

fetch() { curl -sSL --retry 2 -A "$UA" "$1" -o "$2" -w "%{http_code} %{size_download} $1\n" || echo "FAIL $1"; }

# 1) Seiten-HTML
fetch "$BASE/" "$OUT/pages/home.html"
fetch "$BASE/impressum/" "$OUT/pages/impressum.html"
fetch "$BASE/datenschutz/" "$OUT/pages/datenschutz.html"
fetch "$BASE/robots.txt" "$OUT/pages/robots.txt"
fetch "$BASE/sitemap.xml" "$OUT/pages/sitemap.xml"
fetch "$BASE/wp-sitemap.xml" "$OUT/pages/wp-sitemap.xml"

# 2) WordPress REST API
fetch "$BASE/wp-json/wp/v2/pages?per_page=100" "$OUT/wp-json/pages.json"
fetch "$BASE/wp-json/wp/v2/posts?per_page=100" "$OUT/wp-json/posts.json"
for n in 1 2 3; do
  fetch "$BASE/wp-json/wp/v2/media?per_page=100&page=$n" "$OUT/wp-json/media-$n.json"
done

# 3) Seiten inkl. CSS, Fonts, Bilder spiegeln
wget -nv -e robots=off -U "$UA" --page-requisites --convert-links --adjust-extension \
  --span-hosts --domains=zahnarztpraxis-theurer.de,www.zahnarztpraxis-theurer.de \
  -P "$OUT/mirror" "$BASE/" "$BASE/impressum/" "$BASE/datenschutz/" 2>&1 | tail -n 400 || true

# 4) Original-Medien aus der Mediathek
python3 scripts/legacy_media.py "$OUT" "$UA" || true

echo "== Umfang =="
du -sh "$OUT" "$OUT"/* || true
find "$OUT" -type f | wc -l
