"""Holt Koordinaten der Praxis (Nominatim) und die Umgebung (Overpass) als JSON.

Daten: (c) OpenStreetMap-Mitwirkende, ODbL. Einmalige Abfrage fuer eine
statische, selbst gezeichnete Anfahrtskarte.
"""
import json
import os
import time
import urllib.parse
import urllib.request

UA = "zahnarztpraxis-theurer-relaunch/1.0 (kontakt: info@zahnarztpraxis-theurer.de)"
OUT = "osm"
os.makedirs(OUT, exist_ok=True)


def get(url, data=None):
    req = urllib.request.Request(url, data=data, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.read()


def save(name, raw):
    with open(os.path.join(OUT, name), "wb") as fh:
        fh.write(raw)


# 1) Geocoding
queries = {
    "nominatim-structured.json": "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode({
        "street": "Schützenstraße 2", "postalcode": "21726", "city": "Oldendorf",
        "country": "Deutschland", "format": "jsonv2", "addressdetails": 1, "limit": 5}),
    "nominatim-free.json": "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode({
        "q": "Schützenstraße 2, 21726 Oldendorf", "format": "jsonv2", "addressdetails": 1, "limit": 5}),
    "nominatim-dentist.json": "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode({
        "q": "Zahnarzt Theurer Oldendorf", "format": "jsonv2", "addressdetails": 1, "limit": 5}),
}
lat = lon = None
for name, url in queries.items():
    try:
        raw = get(url)
        save(name, raw)
        res = json.loads(raw)
        print(name, "->", [(r.get("display_name"), r.get("lat"), r.get("lon")) for r in res][:3])
        if lat is None and res:
            lat, lon = float(res[0]["lat"]), float(res[0]["lon"])
    except Exception as exc:  # noqa: BLE001
        print("FAIL", name, exc)
    time.sleep(1.5)

if lat is None:
    raise SystemExit("Keine Koordinaten gefunden")
print("Praxis:", lat, lon)

# 2) Umgebung via Overpass
q = f"""
[out:json][timeout:90];
(
  way(around:900,{lat},{lon})["highway"];
  way(around:500,{lat},{lon})["building"];
  nwr(around:1500,{lat},{lon})["highway"="bus_stop"];
  nwr(around:1500,{lat},{lon})["public_transport"];
  nwr(around:600,{lat},{lon})["amenity"="parking"];
  nwr(around:600,{lat},{lon})["amenity"="dentist"];
  nwr(around:600,{lat},{lon})["healthcare"="dentist"];
  way(around:1200,{lat},{lon})["waterway"];
  nwr(around:1200,{lat},{lon})["natural"="water"];
  nwr(around:1200,{lat},{lon})["landuse"];
  nwr(around:1200,{lat},{lon})["leisure"];
  nwr(around:1200,{lat},{lon})["natural"="wood"];
  node(around:3000,{lat},{lon})["place"];
);
out body;
>;
out skel qt;
"""
for endpoint in ("https://overpass-api.de/api/interpreter",
                 "https://overpass.kumi.systems/api/interpreter"):
    try:
        raw = get(endpoint, data=urllib.parse.urlencode({"data": q}).encode())
        save("overpass.json", raw)
        data = json.loads(raw)
        print("Overpass:", endpoint, len(data.get("elements", [])), "Elemente")
        break
    except Exception as exc:  # noqa: BLE001
        print("FAIL", endpoint, exc)

with open(os.path.join(OUT, "center.json"), "w", encoding="utf-8") as fh:
    json.dump({"lat": lat, "lon": lon}, fh)
