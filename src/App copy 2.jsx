import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import shp from "shpjs";
import "leaflet/dist/leaflet.css";

// ---- Leaflet marker icon fix
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// ---- Map constants
const PAK_BOUNDS = L.latLngBounds([[23.64, 60.87], [37.10, 77.84]]);
const START_CENTER = [30.3753, 69.3451];
const SHP_URL = "/data/Merged%20Data.zip";

// ---- Fields
const norm = (v) => (v === null || v === undefined ? "" : String(v).trim());
const FIELD_LOC = "Locality";
const FIELD_PLOT = "Plot_No";
const FIELD_BLOCK = "Block";
const FIELD_TYPE = "Type";

// ---- Styles
function StyleInjector() {
  return (
    <style>{`
      :root{
        --bg:#f6f7fb; --panel:#ffffffef; --text:#0b1220; --muted:#5b6b7f;
        --ring:0 0 0 3px rgba(37, 99, 235, .28); --shadow:0 10px 30px rgba(15,23,42,.10);
        --border:#e6e9ef; --brand1:#1e40af; --brand2:#3b82f6; --accent:#2563eb;
        --zoomHeight: 76px;
      }
      :root.dark{
        --bg:#0b1220; --panel:#0f172acc; --text:#e5e7eb; --muted:#9aa6b2;
        --ring:0 0 0 3px rgba(99, 179, 237, .35); --shadow:0 14px 40px rgba(0,0,0,.45);
        --border:#1b2436; --brand1:#66d9e8; --brand2:#22d3ee; --accent:#38bdf8;
      }
      html, body, #root { height:100%; }
      body { margin:0; background:var(--bg); color:var(--text); font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
      .map-wrap { height:100vh; width:100vw; }

      /* Zoom control above panel */
      .leaflet-top.leaflet-left .leaflet-control-zoom {
        z-index: 2001; box-shadow: 0 10px 24px rgba(0,0,0,.2); border-radius: 12px; overflow: hidden;
      }

      /* Panel under zoom */
      .panel {
        position:absolute; z-index:1000; left:12px; right:auto;
        top: calc(12px + var(--zoomHeight) + 8px); bottom:12px; width:360px;
        display:flex; flex-direction:column; gap:12px;
        background:var(--panel); backdrop-filter:saturate(140%) blur(10px);
        border:1px solid var(--border); border-radius:18px; padding:12px; box-shadow:var(--shadow);
        animation: panelIn .28s ease both;
      }
      @keyframes panelIn { from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none} }

      .panel-title { font-weight:800; letter-spacing:.2px; margin:2px 4px 0; }
      .controls { display:flex; justify-content:space-between; align-items:center; }
      .hide-btn { padding:8px 12px; border-radius:12px; border:1px solid var(--border); background:transparent; cursor:pointer; color:var(--text); transition:transform .18s ease; }
      .hide-btn:hover{ transform:translateY(-1px); }

      .searchbox { padding:10px 12px; border:1px solid var(--border); border-radius:12px; background: transparent; color: var(--text); outline: none; }
      .searchbox:focus { box-shadow:var(--ring); border-color:#bcd2ff; }
      .locality-grid { display:grid; gap:12px; overflow:auto; flex:1; padding:2px; grid-template-columns:1fr; }

      .btn-premium {
        position:relative; overflow:hidden; text-align:left; padding:14px 16px; border-radius:16px;
        background:
          linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.86)),
          url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" opacity=".06"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>');
        border:1px solid rgba(255,255,255,.65);
        box-shadow: 0 14px 30px rgba(2,6,23,.08), inset 0 1px 0 rgba(255,255,255,.6);
        cursor:pointer; color:#0b1220;
        transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
        animation: cardIn .22s ease both;
      }
      :root.dark .btn-premium {
        background:
          linear-gradient(180deg, rgba(23,33,56,.9), rgba(23,33,56,.7)),
          url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" opacity=".05"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>');
        border-color: rgba(255,255,255,.08); color: var(--text);
      }
      @keyframes cardIn { from{opacity:0; transform:translateY(4px) scale(.99)} to{opacity:1; transform:none} }
      .btn-premium:hover { transform: translateY(-2px); box-shadow: 0 18px 40px rgba(2,6,23,.15); filter: saturate(1.04); }
      .btn-premium:active { transform: translateY(-1px) scale(.995); }
      .btn-premium:focus-visible { outline:none; box-shadow: var(--ring), 0 18px 40px rgba(2,6,23,.15); }
      .btn-premium .title { font-weight:700; letter-spacing:.2px; }
      .btn-premium .subtitle { font-size:12px; color:var(--muted); margin-top:4px; }

      .launcher {
        position:absolute; z-index:1050; left:12px; top: calc(12px + var(--zoomHeight) + 8px);
        display:inline-flex; align-items:center; gap:8px; padding:9px 12px; border-radius:14px;
        background:var(--panel); border:1px solid var(--border); box-shadow:var(--shadow);
        cursor:pointer; animation: panelIn .28s ease both;
      }
      .launcher .dot { width:8px; height:8px; border-radius:999px; background:var(--accent); }

      .top-right { position:absolute; z-index:2002; top:12px; right:12px; display:flex; gap:8px; }
      .fab.theme {
        width:44px; height:44px; border-radius:12px; display:inline-flex; align-items:center; justify-content:center;
        background:linear-gradient(135deg, #60a5fa, #8b5cf6); color:#fff; border:1px solid rgba(255,255,255,.35); box-shadow:var(--shadow);
        cursor:pointer; transition: transform .2s ease, filter .2s ease;
      }
      .fab.theme:hover { transform: translateY(-1px); filter: saturate(1.15); }

      .loading { position:absolute; inset:0; z-index:2200; display:grid; place-items:center; background:rgba(0,0,0,.06); }
      :root.dark .loading { background: rgba(0,0,0,.35); }
      .card { padding:18px 20px; border-radius:16px; border:1px solid var(--border); background: var(--panel); box-shadow: var(--shadow); }
      .spinner { width:26px; height:26px; border-radius:999px; border:3px solid #cbd5e1; border-top-color:var(--accent); animation: spin .8s linear infinite; margin-right: 10px; }
      @keyframes spin { to { transform: rotate(360deg); } }

      .leaflet-popup { opacity: 0; transform: scale(.97); transition: opacity .18s ease, transform .18s ease; }
      .leaflet-popup.leaflet-zoom-animated.leaflet-popup-open,
      .leaflet-popup:where(.leaflet-popup-pane > *) { opacity: 1; transform: scale(1); }

      /* pane for the animated outline: above overlays, non-interactive */
      .leaflet-pane.outline-pane { z-index: 650; pointer-events: none; }

      /* animated outline */
      .outline-anim {
        stroke: var(--accent) !important;
        stroke-width: 3px !important;
        fill: none !important;
        stroke-linejoin: round;
        stroke-dasharray: 10 8;
        animation: march 1.2s linear infinite;
      }
      @keyframes march { to { stroke-dashoffset: -18; } }
    `}</style>
  );
}

/* Create a dedicated high-z pane for the outline */
function OutlinePane() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane('outline-pane')) {
      const pane = map.createPane('outline-pane');
      pane.classList.add('outline-pane');
    }
  }, [map]);
  return null;
}

/* Helpers to get a map even if the ref isn't set yet */
function getMap(mapRef, geoRef) {
  return mapRef.current || geoRef.current?._map || null;
}
function ensureOutlinePane(map) {
  if (!map) return;
  let pane = map.getPane("outline-pane");
  if (!pane) pane = map.createPane("outline-pane");
  pane.classList.add("outline-pane");
}

const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4.2" fill="#facc15" />
    <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </g>
  </svg>
);
const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#ffffff" d="M21 12.79A9 9 0 1 1 11.21 3c.25 0 .5.01.74.03A7 7 0 1 0 21 12.79Z" />
  </svg>
);

// Fit-to-bounds helper
function FlyTo({ bounds }) {
  const map = useMap();
  useEffect(() => { if (bounds && bounds.isValid()) map.fitBounds(bounds.pad(0.05)); }, [bounds, map]);
  return null;
}

// Faster, guarded fly animation
function animateLocalityJump(map, bounds) {
  try {
    if (!map || !bounds || !bounds.isValid()) return false;
    map.stop(); // cancel any ongoing animation

    const targetCenter = bounds.getCenter();
    const targetZoom = map.getBoundsZoom(bounds, true);
    const startCenter = map.getCenter();
    const startZoom = map.getZoom();
    const dist = L.latLng(startCenter).distanceTo(targetCenter);

    if (dist < 2000) {
      map.flyToBounds(bounds, { duration: 0.5, easeLinearity: 0.25, padding: [20, 20] });
      return Promise.resolve(true);
    }
    if (dist < 120000) {
      const once = () => new Promise((r) => map.once("moveend", r));
      const midZoom = Math.max(Math.min(startZoom, targetZoom) - 1, 5);
      map.flyTo(startCenter, midZoom, { duration: 0.35, easeLinearity: 0.25 });
      return once().then(() => {
        map.flyTo(targetCenter, targetZoom, { duration: 0.65, easeLinearity: 0.25 });
        return once().then(() => true);
      });
    }
    map.flyToBounds(bounds, { duration: 0.9, easeLinearity: 0.25, padding: [24, 24] });
    return Promise.resolve(true);
  } catch {
    return false;
  }
}

export default function App() {
  // Theme
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Cache theme colors once
  const cssColors = useMemo(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      brand1: s.getPropertyValue("--brand1").trim(),
      brand2: s.getPropertyValue("--brand2").trim(),
      accent: s.getPropertyValue("--accent").trim(),
    };
  }, [theme]);

  // Data & refs
  const mapRef = useRef(null);
  const geoRef = useRef(null);       // GeoJSON layer (Canvas)
  const highlightRef = useRef(null); // Animated SVG outline layer

  const [shapeData, setShapeData] = useState(null);
  const [shapeError, setShapeError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Debounced search
  const [localityQueryRaw, setLocalityQueryRaw] = useState("");
  const [localityQuery, setLocalityQuery] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setLocalityQuery(localityQueryRaw), 120);
    return () => clearTimeout(id);
  }, [localityQueryRaw]);

  // Load shapefile ZIP
  useEffect(() => {
    setLoading(true); setShapeError(null);
    shp(SHP_URL)
      .then((geojson) => {
        const fc = Array.isArray(geojson) ? { type: "FeatureCollection", features: geojson }
          : (geojson.type ? geojson : geojson[Object.keys(geojson)[0]]);
        setShapeData(fc);
      })
      .catch((e) => setShapeError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  // Locality index
  const { localityList, localityMeta } = useMemo(() => {
    const meta = new Map();
    if (shapeData?.features) {
      for (const f of shapeData.features) {
        const p = f.properties || {};
        const loc = norm(p[FIELD_LOC]); if (!loc) continue;
        let entry = meta.get(loc);
        if (!entry) entry = { bounds: null, count: 0 };
        const fb = L.geoJSON(f).getBounds();
        if (fb.isValid()) entry.bounds = entry.bounds ? entry.bounds.extend(fb) : fb;
        entry.count += 1;
        meta.set(loc, entry);
      }
    }
    const list = Array.from(meta.keys()).sort((a, b) => a.localeCompare(b));
    return { localityList: list, localityMeta: meta };
  }, [shapeData]);

  const filteredLocalities = useMemo(() => {
    const q = localityQuery.trim().toLowerCase();
    if (!q) return localityList;
    return localityList.filter((name) => name.toLowerCase().includes(q));
  }, [localityList, localityQuery]);

  // Polygons style (use cached colors)
  const polygonStyle = () => ({
    color: cssColors.brand1,
    weight: 0.7,
    fillColor: cssColors.brand2,
    fillOpacity: 0.12,
  });

  // Lazy popup binding (bind on click instead of on load)
  const onEachPlot = (feature, layer) => {
    layer.on("click", () => {
      const p = feature?.properties || {};
      const html = `
        <div style="font-size:12px;line-height:1.2">
          <div><b>Plot:</b> ${norm(p[FIELD_PLOT]) || "-"}</div>
          <div><b>Block:</b> ${norm(p[FIELD_BLOCK]) || "-"}</div>
          <div><b>Type:</b> ${norm(p[FIELD_TYPE]) || "-"}</div>
          <div><b>Locality:</b> ${norm(p[FIELD_LOC]) || "-"}</div>
        </div>`;
      layer.bindPopup(html).openPopup();
    });
  };

  // RELIABLE OUTLINE (Canvas base + SVG overlay)
  function outlineLocality(name, retry = 0) {
    const map = getMap(mapRef, geoRef);
    const g = geoRef.current;
    if (!g || !name) return;

    if (!map) {
      if (retry < 10) setTimeout(() => outlineLocality(name, retry + 1), 60);
      return;
    }
    ensureOutlinePane(map);

    const wanted = norm(name).toLowerCase();

    // Remove previous outline
    if (highlightRef.current) {
      try { map.removeLayer(highlightRef.current); } catch { }
      highlightRef.current = null;
    }

    // Collect features for this locality
    const feats = [];
    g.eachLayer((layer) => {
      const f = layer?.feature;
      if (!f?.properties) return;
      const loc = norm(f.properties[FIELD_LOC]).toLowerCase();
      if (loc === wanted) feats.push(f);
    });

    const accent = cssColors.accent || "#38bdf8";

    if (!feats.length) {
      // Fallback: dashed bounds rectangle so user sees something
      const entry = localityMeta.get(name);
      if (entry?.bounds?.isValid()) {
        const rect = L.rectangle(entry.bounds, {
          pane: "outline-pane",
          renderer: L.svg({ pane: "outline-pane" }),
          color: accent, weight: 3, fill: false, dashArray: "10 8",
        }).addTo(map);
        try { rect.bringToFront?.(); } catch { }
        highlightRef.current = rect;
      }
      return;
    }

    // Build visible static outline first (SVG pane)
    const hl = L.geoJSON(
      { type: "FeatureCollection", features: feats },
      {
        pane: "outline-pane",
        renderer: L.svg({ pane: "outline-pane" }),
        style: { color: accent, weight: 3, fillOpacity: 0 },
      }
    ).addTo(map);

    // Next frame, apply marching-dash class
    const applyAnim = () => {
      hl.eachLayer((lyr) => {
        const el = lyr.getElement?.();
        if (el) el.classList.add("outline-anim");
      });
      hl.bringToFront?.();
    };
    (window.requestAnimationFrame ? requestAnimationFrame : setTimeout)(applyAnim, 0);

    highlightRef.current = hl;

    // Shorter lifetime to reduce repaints
    setTimeout(() => {
      try { map.removeLayer(hl); } catch { }
      if (highlightRef.current === hl) highlightRef.current = null;
    }, 1800);
  }

  // Basemaps
  const CARTO_VOYAGER = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  const ESRI_HILLSHADE = "https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}";
  const ESRI_IMAGERY = "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  const ESRI_BOUNDARIES = "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
  const ATTR_VOYAGER = '&copy; OSM, &copy; CARTO';
  const ATTR_ESRI = 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, GIS User Community';

  // Shared Canvas renderer for the big layer
  const canvasRenderer = useMemo(() => L.canvas({ padding: 0.2 }), []);

  return (
    <div className="map-wrap">
      <StyleInjector />

      <div className="top-right">
        <button className="fab theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle theme">
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>

      {false && (
        <button className="launcher" onClick={() => { }} title="Show localities">
          <span className="dot" /> <strong>Localities</strong>
        </button>
      )}

      {/* Panel */}
      <div className="panel">
        <div className="controls">
          <div className="panel-title">Localities</div>
        </div>

        <input
          placeholder="Type to filter… e.g. Kohistan Enclave"
          value={localityQueryRaw}
          onChange={(e) => setLocalityQueryRaw(e.target.value)}
          className="searchbox"
        />

        <div className="locality-grid">
          {shapeError && <div style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 12, color: "#ef4444" }}>Error: {shapeError}</div>}
          {!shapeError && filteredLocalities.length === 0 && (
            <div style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 12, opacity: .75 }}>
              No localities match “{localityQuery}”.
            </div>
          )}
          {filteredLocalities.map((name, i) => {
            const entry = localityMeta.get(name);
            return (
              <button
                key={name}
                className="btn-premium"
                style={{ animationDelay: `${Math.min(i, 16) * 25}ms` }}
                onClick={async () => {
                  const b = entry?.bounds;
                  const map = getMap(mapRef, geoRef);
                  if (map && b && b.isValid()) {
                    const res = animateLocalityJump(map, b);
                    if (res === false) {
                      map.flyToBounds(b, { duration: 0.6, easeLinearity: 0.25, padding: [20, 20] });
                      outlineLocality(name);
                    } else {
                      try {
                        const ok = await res;
                        outlineLocality(name);
                        if (!ok) map.flyToBounds(b, { duration: 0.6, easeLinearity: 0.25, padding: [20, 20] });
                      } catch {
                        map.flyToBounds(b, { duration: 0.6, easeLinearity: 0.25, padding: [20, 20] });
                        outlineLocality(name);
                      }
                    }
                  } else if (b && b.isValid()) {
                    setPendingBounds(b);
                    outlineLocality(name);
                  }
                }}
                title={`Go to ${name}`}
              >
                <div className="title">{name}</div>
                <div className="subtitle">{(entry?.count ?? 0).toLocaleString()} plots</div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 4, padding: 12, border: "1px dashed var(--border)", borderRadius: 14 }}>
          <strong>Ad Space</strong>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Paste your AdSense snippet here</div>
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={START_CENTER}
        zoom={6}
        minZoom={5}
        maxBounds={PAK_BOUNDS}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        preferCanvas={true}                 // 1) Canvas by default
        whenCreated={(map) => (mapRef.current = map)}
      >
        {/* SVG outline pane sits above the canvas layer */}
        <OutlinePane />

        {/* Zoom (always above panel) */}
        <ZoomControl position="topleft" />

        {/* Basemap selection */}
        {theme === "dark" ? (
          <>
            <TileLayer url={ESRI_IMAGERY} attribution={ATTR_ESRI} />
            <TileLayer url={ESRI_BOUNDARIES} opacity={0.9} attribution={ATTR_ESRI} />
          </>
        ) : (
          <>
            <TileLayer url={CARTO_VOYAGER} attribution={ATTR_VOYAGER} />
            <TileLayer url={ESRI_HILLSHADE} opacity={0.18} attribution={ATTR_ESRI} />
          </>
        )}

        {/* Fit if needed (from earlier flows) */}
        {/* eslint-disable-next-line no-constant-condition */}
        {false && <FlyTo bounds={null} />}

        {shapeData && (
          <GeoJSON
            ref={geoRef}
            data={shapeData}
            style={polygonStyle}
            onEachFeature={onEachPlot}
            renderer={canvasRenderer}       // 2) Canvas renderer for heavy layer
            smoothFactor={1.2}              // 2) simplify draw load slightly
          />
        )}
      </MapContainer>

      {/* Loading overlay */}
      {loading && (
        <div className="loading">
          <div className="card" role="status" aria-live="polite">
            <div style={{ display: "flex", alignItems: "center" }}>
              <div className="spinner" />
              <div>
                <div style={{ fontWeight: 600 }}>Loading plots…</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Reading shapefile from ZIP</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
