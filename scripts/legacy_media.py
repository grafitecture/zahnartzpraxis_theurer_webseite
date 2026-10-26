"""Laedt alle Original-Medien (source_url) aus der WordPress-Mediathek."""
import glob
import json
import os
import sys
import urllib.request

out, ua = sys.argv[1], sys.argv[2]
LIMIT_FILE = 12 * 1024 * 1024
LIMIT_TOTAL = 150 * 1024 * 1024

urls = []
for f in sorted(glob.glob(os.path.join(out, "wp-json", "media-*.json"))):
    try:
        with open(f, encoding="utf-8") as fh:
            data = json.load(fh)
    except Exception as exc:  # noqa: BLE001
        print("skip", f, exc)
        continue
    if not isinstance(data, list):
        continue
    for item in data:
        url = item.get("source_url")
        if url and url not in urls:
            urls.append(url)

print(len(urls), "Medien in der Mediathek")
with open(os.path.join(out, "media-urls.txt"), "w", encoding="utf-8") as fh:
    fh.write("\n".join(urls))

total = 0
for url in urls:
    rel = url.split("/uploads/")[-1].split("?")[0].replace("/", "_")
    dest = os.path.join(out, "media", rel)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": ua})
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = resp.read(LIMIT_FILE + 1)
        if len(data) > LIMIT_FILE:
            print("zu gross, uebersprungen:", url)
            continue
        if total + len(data) > LIMIT_TOTAL:
            print("Gesamtlimit erreicht")
            break
        with open(dest, "wb") as fh:
            fh.write(data)
        total += len(data)
    except Exception as exc:  # noqa: BLE001
        print("FAIL", url, exc)

print("geladen MB:", round(total / 1e6, 1))
