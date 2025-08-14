import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import * as turf from "@turf/turf";
import "leaflet/dist/leaflet.css";

/* Marker clustering */
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.vectorgrid";

/* Fix default marker icons */
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

/* ------------------------------------------------------------------ */
const PAK_BOUNDS = L.latLngBounds([[23.64, 60.87], [37.10, 77.84]]);
const START_CENTER = [30.3753, 69.3451];

const _BASE =
  typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL
    ? import.meta.env.BASE_URL
    : "/";

const GEOJSON_URL = `${_BASE}data/plots.json`;
const PIN_URL = `${_BASE}img/pin-red.png`;

/* Fields */
const norm = (v) => (v == null ? "" : String(v).trim());
const FIELD_LOC = "Locality";
const FIELD_PLOT = "Plot_No";
const FIELD_BLOCK = "Block";
const FIELD_TYPE = "Type";

/* Share helpers */
const keyPart = (v) => encodeURIComponent(norm(v).toLowerCase());
const makePlotKey = (p) =>
  `${keyPart(p[FIELD_LOC])}__${keyPart(p[FIELD_BLOCK])}__${keyPart(p[FIELD_PLOT])}`;
const buildShareLink = (k) => {
  const u = new URL(window.location.href);
  u.searchParams.set("plot", k);
  return u.toString();
};
const updateURLWithPlot = (k) => {
  const u = new URL(window.location.href);
  u.searchParams.set("plot", k);
  window.history.replaceState(null, "", u);
};

/* Clipboard: silent (no status UI) */
async function copyToClipboard(text) {
  try { if (navigator.share) { await navigator.share({ url: text }); return true; } } catch { }
  try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch { }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch { }
  return false;
}

/* ------------------------------------------------------------------ */
function MapStyle() {
  return (
    <style>{`
      .map-wrap{height:100vh;width:100vw}

      .panel{
        position:absolute; z-index:1000; width:360px;
        display:flex; flex-direction:column; gap:12px;
        background:var(--panel); backdrop-filter:saturate(140%) blur(10px);
        border:1px solid var(--border); border-radius:18px; padding:12px; box-shadow:var(--shadow);
        top: var(--panelTop, 140px) !important;
        left: var(--panelLeft, 12px) !important;
        max-height: var(--panelMaxH, calc(100vh - 160px));
        overflow: hidden;
      }
      .panel-head{display:flex; align-items:center; justify-content:space-between; gap:8px}
      .panel-title{font-weight:800;letter-spacing:.2px;margin:2px 4px 0}
      .panel-body{display:flex; flex-direction:column; gap:12px; min-height:0}

      .chip{ padding:6px 10px; border-radius:999px; border:1px solid var(--border);
        background:rgba(255,255,255,.9); cursor:pointer; font-weight:600; font-size:12px; }
      :root.dark .chip{ background:rgba(15,23,42,.7); color:var(--text); border-color:#263145 }

      .searchbox{padding:10px 12px;border:1px solid var(--border);border-radius:12px;background:transparent;color:var(--text)}
      .searchbox:focus{box-shadow:0 0 0 3px rgba(37,99,235,.28);border-color:#bcd2ff}

      .locality-grid{
        display:grid; gap:12px; padding:2px; grid-template-columns:1fr;
        overflow:auto; flex:1; min-height:0;
      }

      .btn-premium{position:relative; overflow:hidden; text-align:left; padding:14px 16px; border-radius:16px;
        background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(255,255,255,.86));
        border:1px solid rgba(255,255,255,.65); box-shadow:0 14px 30px rgba(2,6,23,.08), inset 0 1px 0 rgba(255,255,255,.6);
        cursor:pointer; color:#0b1220; transition:transform .18s ease, box-shadow .18s ease, filter .18s ease}
      :root.dark .btn-premium{background:linear-gradient(180deg,rgba(23,33,56,.9),rgba(23,33,56,.7)); border-color:rgba(255,255,255,.08); color:var(--text)}

      .panel.collapsed{ width:170px; padding:8px 12px; border-radius:14px; }
      .panel.collapsed .panel-body{ display:none }
      .panel.collapsed .panel-title{ margin:0 }

      .leaflet-pane.outline-pane{z-index:650;pointer-events:none}
      .outline-anim{ stroke:#2563eb !important; stroke-width:3px !important; fill:none !important;
        stroke-linejoin:round; stroke-dasharray:10 8; animation:march 1.2s linear infinite }
      @keyframes march{to{stroke-dashoffset:-18}}

      .loading{position:absolute;inset:0;z-index:2200;display:grid;place-items:center;background:rgba(0,0,0,.06)}
      :root.dark .loading{background:rgba(0,0,0,.35)}
      .card{padding:18px 20px;border-radius:16px;border:1px solid var(--border);background:var(--panel);box-shadow:var(--shadow)}
      .spinner{width:26px;height:26px;border-radius:999px;border:3px solid #cbd5e1;border-top-color:#2563eb;animation:spin .8s linear infinite;margin-right:10px}
      @keyframes spin { to { transform: rotate(360deg); } }  /* <-- added so spinner rotates */

      /* cluster colors (optional) */
      .marker-cluster-small { background: rgba(59,130,246,.85); }
      .marker-cluster-small div { background: rgba(255,255,255,.95); color:#0b1220; font-weight:800; }
      :root.dark .marker-cluster-small { background: rgba(34,211,238,.85); }
      :root.dark .marker-cluster-small div { background: rgba(15,23,42,.95); color:#e5e7eb; }
    `}</style>
  );
}

/* ------------------------------------------------------------------ */
function OutlinePane() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane("outline-pane")) map.createPane("outline-pane").classList.add("outline-pane");
  }, [map]);
  return null;
}

/* Clustered locality pins (auto-hide when zoomed in) */
function LocalityPins({ localityMeta, hideAtZoom = 16 }) {
  const map = useMap();
  const clusterRef = useRef(null);

  useEffect(() => {
    if (!map || !localityMeta) return;

    if (clusterRef.current) {
      try { clusterRef.current.clearLayers(); map.removeLayer(clusterRef.current); } catch { }
      clusterRef.current = null;
    }

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      disableClusteringAtZoom: 13,
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: false,
      removeOutsideVisibleBounds: true,
    });
    clusterRef.current = cluster;
    map.addLayer(cluster);

    const pinIcon = L.icon({
      iconUrl: PIN_URL,
      iconSize: [26, 38],
      iconAnchor: [13, 38],
      popupAnchor: [0, -32],
    });

    localityMeta.forEach((entry, name) => {
      if (!entry?.bounds?.isValid?.()) return;
      const c = entry.bounds.getCenter();
      const m = L.marker(c, { icon: pinIcon, title: name });
      m.bindPopup(`<b>${name}</b>`);
      cluster.addLayer(m);
    });

    const sync = () => {
      const show = map.getZoom() < hideAtZoom;
      if (!clusterRef.current) return;
      if (show && !map.hasLayer(clusterRef.current)) map.addLayer(clusterRef.current);
      if (!show && map.hasLayer(clusterRef.current)) map.removeLayer(clusterRef.current);
    };
    sync();
    map.on("zoomend", sync);

    return () => {
      map.off("zoomend", sync);
      try { cluster.clearLayers(); map.removeLayer(cluster); } catch { }
    };
  }, [map, localityMeta, hideAtZoom]);

  return null;
}

/* ------------------------------------------------------------------ */
/* Utils & smart camera                                                */
/* ------------------------------------------------------------------ */
const getMap = (mapRef, geoRef) => mapRef.current || geoRef.current?._map || null;
function ensureOutlinePane(map) {
  if (!map) return;
  let p = map.getPane("outline-pane");
  if (!p) p = map.createPane("outline-pane");
  p.classList.add("outline-pane");
}

/* Quick boundary for preview */
function quickHullBoundaryFromFeatures(features) {
  if (!features?.length) return null;
  const pts = turf.featureCollection(
    features.flatMap((f) => {
      const g = f.geometry;
      const coords =
        g?.type === "Polygon"
          ? g.coordinates[0]
          : g?.type === "MultiPolygon"
            ? g.coordinates.flatMap((poly) => poly[0])
            : [];
      return coords.map((c) => turf.point(c));
    })
  );
  const hull = turf.convex(pts);
  return hull ? turf.polygonToLine(hull) : null;
}
async function computeLocalityBoundary(name, featuresByLocRef) {
  const key = (name ?? "").trim().toLowerCase();
  const feats = featuresByLocRef.current.get(key) || [];
  if (!feats.length) return null;

  try { const dissolved = turf.dissolve(turf.featureCollection(feats)); return turf.polygonToLine(dissolved); } catch { }
  try {
    const pts = turf.featureCollection(
      feats.flatMap((f) => {
        const g = f.geometry;
        const coords =
          g?.type === "Polygon"
            ? g.coordinates[0]
            : g?.type === "MultiPolygon"
              ? g.coordinates.flatMap((poly) => poly[0])
              : [];
        return coords.map((c) => turf.point(c));
      })
    );
    const concave = turf.concave(pts, { maxEdge: 1.5 });
    if (concave) return turf.polygonToLine(concave);
  } catch { }
  return quickHullBoundaryFromFeatures(feats);
}

/* Outline flash */
function renderAnimatedBoundary(map, boundaryGeoJSON, ref) {
  if (!map || !boundaryGeoJSON) return;
  if (ref.current) { try { map.removeLayer(ref.current); } catch { } ref.current = null; }

  const hl = L.geoJSON(boundaryGeoJSON, {
    pane: "outline-pane",
    renderer: L.svg({ pane: "outline-pane" }),
    style: { color: "#2563eb", weight: 3, fillOpacity: 0 },
  }).addTo(map);

  const applyAnim = () => {
    hl.eachLayer((lyr) => lyr.getElement?.()?.classList.add("outline-anim"));
    hl.bringToFront?.();
  };
  (window.requestAnimationFrame ? requestAnimationFrame : setTimeout)(applyAnim, 0);

  ref.current = hl;
  setTimeout(() => {
    try { map.removeLayer(hl); } catch { }
    if (ref.current === hl) ref.current = null;
  }, 1600);
}
function renderPlotBoundary(map, feature, ref) {
  try {
    const line =
      feature?.geometry &&
        (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")
        ? turf.polygonToLine(feature)
        : null;
    if (line) renderAnimatedBoundary(map, line, ref);
  } catch { }
}

/* Popup: no "Link copied" status */
function createPlotPopupElement(props, plotKey, onCopy) {
  const wrap = document.createElement("div");
  wrap.style.fontSize = "12px";
  wrap.style.lineHeight = "1.25";
  const row = (label, value) => {
    const d = document.createElement("div");
    const b = document.createElement("b");
    b.textContent = `${label}: `;
    d.appendChild(b);
    d.appendChild(document.createTextNode(value || "-"));
    return d;
  };
  wrap.appendChild(row("Plot", norm(props[FIELD_PLOT])));
  wrap.appendChild(row("Block", norm(props[FIELD_BLOCK])));
  wrap.appendChild(row("Type", norm(props[FIELD_TYPE])));
  wrap.appendChild(row("Locality", norm(props[FIELD_LOC])));

  const btn = document.createElement("button");
  btn.className = "share-btn";
  btn.textContent = "Copy link";
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await onCopy(); // silent
  });
  wrap.appendChild(btn);
  return wrap;
}

/* ---------- SMART CAMERA 2.0: kill micro-jitter -------------------- */
function pxDistance(map, a, b, zoom) {
  const z = zoom ?? map.getZoom();
  const pa = map.project(a, z);
  const pb = map.project(b, z);
  const dx = pa.x - pb.x;
  const dy = pa.y - pb.y;
  return Math.sqrt(dx * dx + dy * dy);
}
function smartFocus(map, bounds, opts = {}) {
  return new Promise((resolve) => {
    if (!bounds?.isValid?.()) return resolve(false);

    const padding = opts.padding || [22, 22];
    const targetZoom = map.getBoundsZoom(bounds, true, padding);
    const currentZoom = map.getZoom();
    const center = bounds.getCenter();
    const currentCenter = map.getCenter();
    const distPx = pxDistance(map, currentCenter, center, Math.max(currentZoom, targetZoom));
    const zoomDiff = Math.abs(targetZoom - currentZoom);

    const alreadyInside = map.getBounds().pad(-0.40).contains(bounds);

    if (alreadyInside && distPx < 10 && zoomDiff < 0.05) return resolve(false);

    const onEnd = () => { map.off("moveend", onEnd); resolve(true); };
    map.stop();

    if (alreadyInside) {
      if (zoomDiff < 0.15) {
        if (distPx <= 30) return resolve(false);
        map.panTo(center, { animate: true, duration: 0.3 });
        map.once("moveend", onEnd);
      } else {
        map.flyTo(center, targetZoom, { duration: 0.45, easeLinearity: 0.25 });
        map.once("moveend", onEnd);
      }
    } else {
      map.flyToBounds(bounds, { duration: 0.55, easeLinearity: 0.25, padding });
      map.once("moveend", onEnd);
    }
  });
}

/* ------------------------------------------------------------------ */
export default function MapPage() {
  const [shapeData, setShapeData] = useState(null);
  const [shapeError, setShapeError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [collapsed, setCollapsed] = useState(false);
  const [zoomSize, setZoomSize] = useState({ w: 48, h: 76 });

  const [theme, setTheme] = useState(
    document.documentElement.getAttribute("data-theme") || "light"
  );
  useEffect(() => {
    const m = new MutationObserver(() =>
      setTheme(document.documentElement.getAttribute("data-theme") || "light")
    );
    m.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => m.disconnect();
  }, []);

  /* Refs & caches */
  const mapRef = useRef(null);
  const geoRef = useRef(null);
  const highlightRef = useRef(null);
  const featuresByLocRef = useRef(new Map());
  const plotIndexRef = useRef(new Map());
  const outlineCacheRef = useRef(new Map());
  const outlinePendingRef = useRef(new Map());
  const clickLockRef = useRef(false);

  /* Search */
  const [localityQueryRaw, setLocalityQueryRaw] = useState("");
  const [localityQuery, setLocalityQuery] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setLocalityQuery(localityQueryRaw), 120);
    return () => clearTimeout(id);
  }, [localityQueryRaw]);

  /* ------------------ LOAD GEOJSON with min visible loader ------------------ */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const minVisibleMs = 400;           // ensure spinner is visible at least this long
      const start = performance.now();
      try {
        setLoading(true);
        setShapeError(null);

        const res = await fetch(GEOJSON_URL, { cache: "force-cache" });
        if (!res.ok) throw new Error(`Failed to load ${GEOJSON_URL}: ${res.status}`);
        const geojson = await res.json();

        if (cancelled) return;
        const fc =
          geojson.type === "FeatureCollection"
            ? geojson
            : { type: "FeatureCollection", features: Array.isArray(geojson) ? geojson : geojson.features || [] };

        setShapeData(fc);

        outlineCacheRef.current.clear();
        outlinePendingRef.current.clear();
        featuresByLocRef.current = new Map();
        plotIndexRef.current = new Map();

        const mapLoc = new Map();
        for (const f of fc.features || []) {
          const p = f.properties || {};
          const loc = norm(p[FIELD_LOC]).toLowerCase();
          if (!loc) continue;
          let arr = mapLoc.get(loc);
          if (!arr) { arr = []; mapLoc.set(loc, arr); }
          arr.push(f);

          const key = makePlotKey(p);
          if (!plotIndexRef.current.has(key)) {
            const bounds = L.geoJSON(f).getBounds();
            plotIndexRef.current.set(key, { feature: f, bounds });
          }
        }
        featuresByLocRef.current = mapLoc;
      } catch (e) {
        if (!cancelled) setShapeError(String(e));
      } finally {
        if (!cancelled) {
          const elapsed = performance.now() - start;
          const remaining = Math.max(0, 400 - elapsed); // align with minVisibleMs
          setTimeout(() => setLoading(false), remaining);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  /* Locality meta */
  const { localityList, localityMeta } = useMemo(() => {
    const meta = new Map();
    if (shapeData?.features) {
      for (const f of shapeData.features) {
        const p = f.properties || {};
        const loc = norm(p[FIELD_LOC]);
        if (!loc) continue;
        let entry = meta.get(loc);
        if (!entry) entry = { bounds: null, count: 0 };
        const fb = L.geoJSON(f).getBounds();
        if (fb.isValid()) entry.bounds = entry.bounds ? entry.bounds.extend(fb) : fb;
        entry.count += 1;
        meta.set(loc, entry);
      }
    }
    return {
      localityList: Array.from(meta.keys()).sort((a, b) => a.localeCompare(b)),
      localityMeta: meta,
    };
  }, [shapeData]);

  const filteredLocalities = useMemo(() => {
    const q = localityQuery.trim().toLowerCase();
    if (!q) return localityList;
    return localityList.filter((n) => n.toLowerCase().includes(q));
  }, [localityList, localityQuery]);

  /* Colors */
  const cssColors = useMemo(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      brand1: s.getPropertyValue("--brand1")?.trim() || "#1e40af",
      brand2: s.getPropertyValue("--brand2")?.trim() || "#3b82f6",
    };
  }, [theme]);

  const polygonStyle = () => ({
    color: cssColors.brand1,
    weight: 0.7,
    fillColor: cssColors.brand2,
    fillOpacity: 0.12,
  });

  /* Outline helpers */
  async function outlineLocality(name) {
    const map = getMap(mapRef, geoRef);
    if (!map || !name) return;
    ensureOutlinePane(map);
    if (highlightRef.current) { try { map.removeLayer(highlightRef.current); } catch { } highlightRef.current = null; }

    const token = Date.now();
    outlinePendingRef.current.set("__last__", token);
    const feats = featuresByLocRef.current.get((name ?? "").trim().toLowerCase()) || [];

    const preview = quickHullBoundaryFromFeatures(feats);
    if (preview) renderAnimatedBoundary(map, preview, highlightRef);

    const cachedExact = outlineCacheRef.current.get(name);
    if (cachedExact) { renderAnimatedBoundary(map, cachedExact, highlightRef); return; }

    let pending = outlinePendingRef.current.get(name);
    if (!pending) {
      pending = computeLocalityBoundary(name, featuresByLocRef)
        .then((geo) => { outlineCacheRef.current.set(name, geo); outlinePendingRef.current.delete(name); return geo; })
        .catch(() => { outlinePendingRef.current.delete(name); });
      outlinePendingRef.current.set(name, pending);
    }
    try {
      const exact = await pending;
      if (exact && outlinePendingRef.current.get("__last__") === token)
        renderAnimatedBoundary(map, exact, highlightRef);
    } catch { }
  }

  /* Plot interaction: movement first, then popup + highlight */
  const onEachPlot = (feature, layer) => {
    const props = feature?.properties || {};
    const plotKey = makePlotKey(props);
    const shareUrl = buildShareLink(plotKey);

    layer.bindPopup(createPlotPopupElement(props, plotKey, () => copyToClipboard(shareUrl)));

    layer.on("click", async () => {
      if (clickLockRef.current) return;
      clickLockRef.current = true;
      setTimeout(() => (clickLockRef.current = false), 600);

      const map = getMap(mapRef, geoRef);
      if (!map) return;

      const entry = plotIndexRef.current.get(plotKey);
      if (entry?.bounds?.isValid()) {
        await smartFocus(map, entry.bounds, { padding: [22, 22] });
      }

      layer.openPopup();
      renderPlotBoundary(map, feature, highlightRef);
      updateURLWithPlot(plotKey);
    });
  };

  /* Deep-link focus on load */
  useEffect(() => {
    async function go() {
      if (!shapeData) return;
      const map = getMap(mapRef, geoRef);
      if (!map) return;

      const params = new URLSearchParams(window.location.search);
      const plotKey = params.get("plot");
      if (!plotKey) return;

      const entry = plotIndexRef.current.get(plotKey);
      if (!entry) return;

      if (entry.bounds?.isValid()) {
        await smartFocus(map, entry.bounds, { padding: [22, 22] });
        renderPlotBoundary(map, entry.feature, highlightRef);

        const props = entry.feature.properties || {};
        const el = createPlotPopupElement(props, plotKey, () =>
          copyToClipboard(buildShareLink(plotKey))
        );
        let pt = entry.bounds.getCenter();
        try {
          const c = turf.centroid(entry.feature)?.geometry?.coordinates;
          if (c) pt = L.latLng(c[1], c[0]);
        } catch { }
        L.popup({ autoClose: true, closeOnClick: true }).setLatLng(pt).setContent(el).openOn(map);
      }
    }
    go();
  }, [shapeData]);

  /* Panel offsets */
  const panelTop = `calc(var(--header-h) + var(--safe-top) + 8px + ${zoomSize.h}px + 12px)`;
  const panelLeft = `calc(12px + ${zoomSize.w}px + 12px)`;
  const panelMaxH = `calc(100vh - (var(--header-h) + var(--safe-top) + 8px + ${zoomSize.h}px + 12px) - 20px)`;

  return (
    <div className="map-wrap">
      <MapStyle />

      {/* Localities panel */}
      <div
        className={`panel ${collapsed ? "collapsed" : ""}`}
        style={{ ["--panelTop"]: panelTop, ["--panelLeft"]: panelLeft, ["--panelMaxH"]: panelMaxH }}
      >
        <div
          className="panel-head"
          onClick={() => { if (collapsed) setCollapsed(false); }}
          style={{ cursor: collapsed ? "pointer" : "default" }}
        >
          <div className="panel-title">Localities</div>
          <button className="chip" onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}>
            {collapsed ? "Show" : "Hide"}
          </button>
        </div>

        {!collapsed && (
          <div className="panel-body">
            <input
              className="searchbox"
              placeholder="Type to filter… e.g. Kohistan Enclave"
              value={localityQueryRaw}
              onChange={(e) => setLocalityQueryRaw(e.target.value)}
            />

            <div className="locality-grid">
              {!shapeData && (
                <div style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 12, opacity: 0.75 }}>
                  Loading data…
                </div>
              )}
              {shapeData && filteredLocalities.length === 0 && (
                <div style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 12, opacity: 0.75 }}>
                  No localities match “{localityQuery}”.
                </div>
              )}
              {shapeData && filteredLocalities.map((name) => {
                const entry = localityMeta.get(name);
                return (
                  <button
                    key={name}
                    className="btn-premium"
                    onClick={async () => {
                      if (clickLockRef.current) return;
                      clickLockRef.current = true;
                      setTimeout(() => (clickLockRef.current = false), 500);

                      const b = entry?.bounds;
                      const map = getMap(mapRef, geoRef);
                      outlineLocality(name);

                      if (map && b && b.isValid()) {
                        await smartFocus(map, b, { padding: [22, 22] });
                        outlineLocality(name);
                      }
                    }}
                  >
                    <div className="title">{name}</div>
                    <div className="subtitle">{(entry?.count ?? 0).toLocaleString()} plots</div>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 4, padding: 12, border: "1px dashed var(--border)", borderRadius: 14 }}>
              <strong>Ad Space</strong>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Paste your AdSense snippet here</div>
            </div>
          </div>
        )}
      </div>

      <MapContainer
        center={START_CENTER}
        zoom={6}
        minZoom={5}
        maxBounds={PAK_BOUNDS}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        preferCanvas={true}
        whenCreated={(map) => {
          mapRef.current = map;

          const findZoom = () => document.querySelector(".leaflet-control-zoom");
          const update = (el) => {
            if (!el) return;
            const r = el.getBoundingClientRect();
            setZoomSize({ w: Math.max(40, Math.round(r.width)), h: Math.max(48, Math.round(r.height)) });
          };

          let el = findZoom();
          if (!el) {
            const mo = new MutationObserver(() => {
              el = findZoom();
              if (el) { update(el); mo.disconnect(); const ro = new ResizeObserver(() => update(el)); ro.observe(el); }
            });
            mo.observe(document.body, { childList: true, subtree: true });
          } else {
            update(el);
            const ro = new ResizeObserver(() => update(el));
            ro.observe(el);
          }

          const refresh = () => update(findZoom());
          setTimeout(refresh, 0);
          window.addEventListener("resize", refresh);
          map.once("load", refresh);
        }}
      >
        <OutlinePane />
        <ZoomControl position="topleft" />

        {/* Basemaps */}
        {theme === "dark" ? (
          <>
            <TileLayer
              url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, GIS User Community"
            />
            <TileLayer
              url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              opacity={0.9}
              attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, GIS User Community"
            />
          </>
        ) : (
          <>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution="&copy; OSM, &copy; CARTO"
            />
            <TileLayer
              url="https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}"
              opacity={0.18}
              attribution="Tiles &copy; Esri, Maxar, Earthstar Geographics, GIS User Community"
            />
          </>
        )}

        {/* Clustered locality pins */}
        {localityMeta && <LocalityPins localityMeta={localityMeta} hideAtZoom={16} />}

        {shapeData && (
          <GeoJSON
            ref={geoRef}
            data={shapeData}
            style={polygonStyle}
            onEachFeature={onEachPlot}
            renderer={L.canvas({ padding: 0.2 })}
            smoothFactor={1.2}
          />
        )}
      </MapContainer>

      {loading && (
        <div className="loading">
          <div className="card" role="status" aria-live="polite">
            <div style={{ display: "flex", alignItems: "center" }}>
              <div className="spinner" />
              <div>
                <div style={{ fontWeight: 600 }}>Loading plots…</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Reading GeoJSON data</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Optional: show fetch errors if any */}
      {!loading && shapeError && (
        <div className="loading">
          <div className="card" style={{ background: "#fee2e2", borderColor: "#fecaca" }}>
            <div style={{ fontWeight: 700, color: "#7f1d1d" }}>Error</div>
            <div style={{ fontSize: 12, color: "#7f1d1d" }}>{String(shapeError)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
