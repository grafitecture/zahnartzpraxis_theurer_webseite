"""Zeichnet die Anfahrtskarte als SVG aus OpenStreetMap-Daten.

Eingabe:  tools/map/osm-umgebung.json  (Auszug aus OSM, (c) OpenStreetMap-Mitwirkende, ODbL)
Ausgabe:  tools/map/karte-anfahrt.svg   (eigenständige Datei, z. B. für Druck)
          tools/map/karte-inline.svg    (für index.html; Schriftstile kommen aus main.css,
                                         weil die Content-Security-Policy Inline-Styles sperrt)

Aufruf:   python3 tools/map/build_map.py

Die Karte wird bewusst selbst gezeichnet: keine externen Kartendienste,
keine Cookies, keine Einwilligung nötig – und sie passt zur Gestaltung.
"""
from __future__ import annotations

import heapq
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = Path(__file__).with_name("osm-umgebung.json")
OUT_FILE = Path(__file__).with_name("karte-anfahrt.svg")
OUT_INLINE = Path(__file__).with_name("karte-inline.svg")

# Kartenausschnitt: 640 m x 400 m, Norden oben
W, H = 1600, 1000
SCALE = 2.5  # SVG-Einheiten pro Meter

PRAXIS = (53.5896265, 9.2538840)
BUS_STOPS = [3725455998, 3725455997]   # Bussteige "Oldendorf, Lämmerhof"
PARKING_NODE = 298532979               # Parkplatz vor der Praxis
PRAXIS_BUILDING = 942288438

# Farben (aus dem Designsystem)
C = {
    "land": "#f3f5f6",
    "residential": "#f7f8f9",
    "green": "#eceff1",
    "water": "#d6e8f6",
    "water_line": "#b9d6ee",
    "building": "#dfe4e8",
    "building_stroke": "#d2d9de",
    "road": "#ffffff",
    "casing": "#d3dadf",
    "path": "#c3ccd2",
    "label": "#56646d",
    "ink": "#1a2933",
    "blue": "#0087cb",
    "blue_ink": "#006da3",
}

ROAD_STYLE = {  # Breite der Füllung in Einheiten, Rangfolge
    "secondary": (24, 5),
    "tertiary": (21, 4),
    "unclassified": (17, 3),
    "residential": (17, 3),
    "living_street": (15, 3),
    "service": (9, 2),
    "construction": (12, 1),
}
PATHS = {"footway", "path", "cycleway", "steps", "pedestrian", "track"}

STREET_LABELS = {  # Name -> Position entlang der Straße (startOffset)
    "Hauptstraße": "62%", "Schützenstraße": "19%", "Lämmerhof": "50%", "Feldstraße": "50%",
    "Sunder Straße": "50%", "Am Kampen": "50%", "Auf der Kuhlen": "50%", "Schulstraße": "50%",
    "Gartenstraße": "50%", "Blumenstraße": "50%",
}


def load():
    data = json.loads(DATA.read_text(encoding="utf-8"))
    nodes, ways = {}, []
    for el in data["elements"]:
        if el["type"] == "node":
            nodes[el["id"]] = el
        elif el["type"] == "way":
            ways.append(el)
    return data, nodes, ways


def make_projection(center):
    lat0, lon0 = center["lat"], center["lon"]
    kx = math.cos(math.radians(lat0)) * 111320 * SCALE
    ky = 110574 * SCALE

    def project(lat, lon):
        return (W / 2 + (lon - lon0) * kx, H / 2 - (lat - lat0) * ky)

    return project


def fmt(v: float) -> str:
    return f"{v:.1f}".rstrip("0").rstrip(".")


def path_d(points, closed=False):
    if not points:
        return ""
    d = "M" + " L".join(f"{fmt(x)} {fmt(y)}" for x, y in points)
    return d + (" Z" if closed else "")


def in_view(points, margin=60):
    return any(-margin <= x <= W + margin and -margin <= y <= H + margin for x, y in points)


def dist_m(a, b):
    dy = (a[0] - b[0]) * 110574
    dx = (a[1] - b[1]) * 111320 * math.cos(math.radians(a[0]))
    return math.hypot(dx, dy)


def walking_route(nodes, ways, start_node, target_latlon):
    walkable = set(ROAD_STYLE) | PATHS
    graph = {}
    for w in ways:
        if w["tags"].get("highway") not in walkable:
            continue
        ids = [n for n in w["nodes"] if n in nodes]
        for a, b in zip(ids, ids[1:]):
            pa = (nodes[a]["lat"], nodes[a]["lon"])
            pb = (nodes[b]["lat"], nodes[b]["lon"])
            d = dist_m(pa, pb)
            graph.setdefault(a, []).append((b, d))
            graph.setdefault(b, []).append((a, d))

    def nearest(latlon):
        return min(graph, key=lambda n: dist_m(latlon, (nodes[n]["lat"], nodes[n]["lon"])))

    s = nearest((nodes[start_node]["lat"], nodes[start_node]["lon"]))
    t = nearest(target_latlon)
    best, prev, queue = {s: 0.0}, {}, [(0.0, s)]
    while queue:
        cost, u = heapq.heappop(queue)
        if u == t:
            break
        if cost > best.get(u, math.inf):
            continue
        for v, d in graph.get(u, []):
            nc = cost + d
            if nc < best.get(v, math.inf):
                best[v], prev[v] = nc, u
                heapq.heappush(queue, (nc, v))
    route = [t]
    while route[-1] != s:
        route.append(prev[route[-1]])
    route.reverse()
    return best[t], route


def polyline_length(pts):
    return sum(math.dist(a, b) for a, b in zip(pts, pts[1:]))


def clip_to_view(pts, margin=0):
    """Behält die längste zusammenhängende Strecke innerhalb des Ausschnitts."""
    runs, cur = [], []
    for p in pts:
        if margin <= p[0] <= W - margin and margin <= p[1] <= H - margin:
            cur.append(p)
        else:
            if len(cur) > 1:
                runs.append(cur)
            cur = []
    if len(cur) > 1:
        runs.append(cur)
    return max(runs, key=polyline_length) if runs else []


def build():
    data, nodes, ways = load()
    project = make_projection(data["center"])

    def pts_of(way):
        return [project(nodes[n]["lat"], nodes[n]["lon"]) for n in way["nodes"] if n in nodes]

    layers = {k: [] for k in ("landuse", "water", "buildings", "casing", "roads", "paths")}
    road_lines = []

    for w in ways:
        t = w["tags"]
        pts = pts_of(w)
        if len(pts) < 2 or not in_view(pts):
            continue
        closed = w["nodes"][0] == w["nodes"][-1]
        lu = t.get("landuse")
        if lu == "residential" and closed:
            layers["landuse"].append(f'<path d="{path_d(pts, True)}" fill="{C["residential"]}"/>')
        elif (lu in ("meadow", "grass", "forest", "cemetery") or t.get("leisure") in ("park", "pitch", "playground")
              or t.get("natural") in ("wood",)) and closed:
            layers["landuse"].append(f'<path d="{path_d(pts, True)}" fill="{C["green"]}"/>')
        if (t.get("natural") == "water" or lu == "basin") and closed:
            layers["water"].append(f'<path d="{path_d(pts, True)}" fill="{C["water"]}"/>')
        if t.get("waterway"):
            layers["water"].append(
                f'<path d="{path_d(pts)}" fill="none" stroke="{C["water_line"]}" stroke-width="4" stroke-linecap="round"/>')
        if "building" in t and closed:
            if w["id"] == PRAXIS_BUILDING:
                continue
            layers["buildings"].append(f'<path d="{path_d(pts, True)}"/>')
        hw = t.get("highway")
        if hw in ROAD_STYLE and t.get("area") != "yes":
            width, rank = ROAD_STYLE[hw]
            road_lines.append((rank, width, pts))
        elif hw in PATHS:
            layers["paths"].append(f'<path d="{path_d(pts)}"/>')

    road_lines.sort(key=lambda r: r[0])
    for rank, width, pts in road_lines:
        d = path_d(pts)
        layers["casing"].append(f'<path d="{d}" stroke-width="{width + 4}"/>')
        layers["roads"].append(f'<path d="{d}" stroke-width="{width}"/>')

    # Praxisgebäude
    praxis_way = next(w for w in ways if w["id"] == PRAXIS_BUILDING)
    praxis_pts = pts_of(praxis_way)
    px = sum(p[0] for p in praxis_pts[:-1]) / (len(praxis_pts) - 1)
    py = sum(p[1] for p in praxis_pts[:-1]) / (len(praxis_pts) - 1)

    # Straßennamen: längstes Teilstück je Name im Ausschnitt
    labels, defs = [], []
    for i, (name, offset) in enumerate(STREET_LABELS.items()):
        best = []
        for w in ways:
            if w["tags"].get("name") != name or w["tags"].get("highway") not in ROAD_STYLE:
                continue
            run = clip_to_view(pts_of(w), margin=40)
            if polyline_length(run) > polyline_length(best):
                best = run
        if polyline_length(best) < len(name) * 15:
            continue
        if best[-1][0] < best[0][0]:
            best = best[::-1]
        pid = f"str-{i}"
        defs.append(f'<path id="{pid}" d="{path_d(best)}"/>')
        labels.append(
            f'<text class="map-street" dy="8"><textPath href="#{pid}" startOffset="{offset}" text-anchor="middle">{name}</textPath></text>')

    # Fußweg Bushaltestelle -> Praxis
    length_m, route_ids = walking_route(nodes, ways, BUS_STOPS[0], PRAXIS)
    route_pts = [project(nodes[n]["lat"], nodes[n]["lon"]) for n in route_ids]
    route_pts.append((px, py))
    minutes = max(1, round(length_m / 80))

    # Marker
    stops = [project(nodes[n]["lat"], nodes[n]["lon"]) for n in BUS_STOPS]
    park = project(nodes[PARKING_NODE]["lat"], nodes[PARKING_NODE]["lon"])
    # Punkt auf halber Strecke der Route
    half, acc, mid = polyline_length(route_pts) / 2, 0.0, route_pts[0]
    for a, b in zip(route_pts, route_pts[1:]):
        seg = math.dist(a, b)
        if acc + seg >= half:
            t = (half - acc) / seg
            mid = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
            break
        acc += seg

    def bus_marker(x, y):
        return (f'<g transform="translate({fmt(x)} {fmt(y)})"><g class="map-marker">'
                f'<circle r="21" fill="#ffffff" stroke="{C["ink"]}" stroke-width="4"/>'
                f'<text y="9" text-anchor="middle" class="map-bus-h">H</text></g></g>')

    # Maßstab im mittleren, immer sichtbaren Quadrat (x 300–1300), damit er auch im
    # quadratischen Mobil-Ausschnitt erhalten bleibt
    scale_x, scale_y = 340, H - 56
    svg_body = f"""
  <defs>
    {''.join(defs)}
  </defs>
  <rect width="{W}" height="{H}" fill="{C['land']}"/>
  <g>{''.join(layers['landuse'])}</g>
  <g>{''.join(layers['water'])}</g>
  <g fill="{C['building']}" stroke="{C['building_stroke']}" stroke-width="1.5">{''.join(layers['buildings'])}</g>
  <g fill="none" stroke="{C['path']}" stroke-width="3" stroke-dasharray="8 7" stroke-linecap="round">{''.join(layers['paths'])}</g>
  <g fill="none" stroke="{C['casing']}" stroke-linecap="round" stroke-linejoin="round">{''.join(layers['casing'])}</g>
  <g fill="none" stroke="{C['road']}" stroke-linecap="round" stroke-linejoin="round">{''.join(layers['roads'])}</g>
  <g>{''.join(labels)}</g>
  <path d="{path_d(praxis_pts, True)}" fill="{C['blue']}" stroke="{C['blue_ink']}" stroke-width="2"/>
  <path class="map-route" d="{path_d(route_pts)}" fill="none" stroke="{C['blue']}" stroke-width="7" stroke-dasharray="0.5 15" stroke-linecap="round" stroke-linejoin="round"/>
  <g class="map-labels">
    <text class="map-note" x="{fmt(mid[0] + 26)}" y="{fmt(mid[1] - 14)}">{minutes} Min. zu Fuß</text>
  </g>
  {''.join(bus_marker(x, y) for x, y in stops)}
  <g transform="translate({fmt(park[0])} {fmt(park[1])})"><g class="map-marker">
    <rect x="-20" y="-20" width="40" height="40" rx="7" fill="{C['blue_ink']}"/>
    <text y="10" text-anchor="middle" class="map-park-p">P</text>
  </g></g>
  <g transform="translate({fmt(px)} {fmt(py)})"><g class="map-marker map-marker--pin">
    <path d="M0 -14 C-9 -32 -32 -36 -32 -60 A32 32 0 1 1 32 -60 C32 -36 9 -32 0 -14 Z" fill="{C['blue']}" stroke="#ffffff" stroke-width="4"/>
    <circle cy="-60" r="11" fill="#ffffff"/>
  </g></g>
  <g class="map-labels">
    <g class="map-only-wide">
      <text class="map-label map-label--strong" x="{fmt(px + 46)}" y="{fmt(py + 4)}">Zahnarztpraxis Theurer</text>
      <text class="map-label" x="{fmt(px + 46)}" y="{fmt(py + 40)}">Schützenstraße 2</text>
      <text class="map-label" x="{fmt(stops[0][0] - 34)}" y="{fmt(stops[0][1] - 32)}" text-anchor="end">Haltestelle Lämmerhof</text>
      <text class="map-label" x="{fmt(park[0] + 34)}" y="{fmt(park[1] + 10)}">Parkplätze</text>
    </g>
    <g class="map-only-narrow">
      <text class="map-label map-label--strong" x="{fmt(px + 56)}" y="{fmt(py + 14)}">Praxis</text>
      <text class="map-label" x="{fmt(stops[0][0] - 44)}" y="{fmt(stops[0][1] - 40)}" text-anchor="end">Haltestelle</text>
    </g>
  </g>
  <g class="map-scale" transform="translate({scale_x} {scale_y})">
    <path d="M0 0 H{fmt(100 * SCALE)} M0 -10 V8 M{fmt(100 * SCALE)} -10 V8" stroke="{C['ink']}" stroke-width="3" fill="none"/>
    <text x="{fmt(50 * SCALE)}" y="-16" text-anchor="middle" class="map-scale-text">100 m</text>
  </g>"""

    style = f"""
  <style>
    .map-street {{ font: 500 26px/1 "Corporate S", "Source Sans 3", system-ui, sans-serif; fill: {C['label']}; letter-spacing: .02em; paint-order: stroke; stroke: {C['land']}; stroke-width: 6px; stroke-linejoin: round; }}
    .map-label {{ font: 400 30px/1 "Corporate S", "Source Sans 3", system-ui, sans-serif; fill: {C['ink']}; paint-order: stroke; stroke: #ffffff; stroke-width: 9px; stroke-linejoin: round; }}
    .map-label--strong {{ font-weight: 700; font-size: 34px; }}
    .map-note {{ font: 600 26px/1 "Corporate S", "Source Sans 3", system-ui, sans-serif; fill: {C['blue_ink']}; paint-order: stroke; stroke: #ffffff; stroke-width: 8px; stroke-linejoin: round; }}
    .map-bus-h {{ font: 700 26px/1 "Corporate S", "Source Sans 3", system-ui, sans-serif; fill: {C['ink']}; }}
    .map-park-p {{ font: 700 28px/1 "Corporate S", "Source Sans 3", system-ui, sans-serif; fill: #ffffff; }}
    .map-scale-text {{ font: 400 24px/1 "Corporate S", "Source Sans 3", system-ui, sans-serif; fill: {C['ink']}; }}
  </style>"""

    title = "Lageplan der Zahnarztpraxis Theurer"
    desc = (f"Die Praxis liegt in der Schützenstraße 2 in Oldendorf, nahe der Hauptstraße. "
            f"Von der Bushaltestelle Lämmerhof an der Hauptstraße sind es rund {round(length_m, -1):.0f} Meter "
            f"zu Fuß, etwa {minutes} Minuten. Parkplätze liegen direkt vor der Praxis.")

    standalone = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" '
                  f'aria-labelledby="map-title map-desc">\n  <title id="map-title">{title}</title>\n'
                  f'  <desc id="map-desc">{desc}</desc>{style}{svg_body}\n</svg>\n')
    inline = (f'<svg class="map-svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" role="img" '
              f'aria-labelledby="map-title map-desc" focusable="false">\n  <title id="map-title">{title}</title>\n'
              f'  <desc id="map-desc">{desc}</desc>{svg_body}\n</svg>\n')
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(standalone, encoding="utf-8")
    OUT_INLINE.write_text(inline, encoding="utf-8")

    # Marker-Positionen in Prozent (für den responsiven Ausschnitt)
    print(f"Fußweg Bus -> Praxis: {length_m:.0f} m, ca. {minutes} Min.")
    print(f"Praxis bei {px / W:.1%} / {py / H:.1%}, Haltestelle bei {stops[0][0] / W:.1%} / {stops[0][1] / H:.1%}")
    print(f"SVG: {len(standalone) / 1024:.0f} KB")


if __name__ == "__main__":
    build()
