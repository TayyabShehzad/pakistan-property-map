import React, { useEffect, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import MapPage from "./MapPage.jsx";

import About from "./pages/About.jsx";
import Blog from "./pages/Blog.jsx";
import BlogPost from "./pages/BlogPost.jsx";
import Contact from "./pages/Contact.jsx";

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4.2" fill="#facc15" />
    <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </g>
  </svg>
);
const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#ffffff" d="M21 12.79A9 9 0 1 1 11.21 3c.25 0 .5.01.74.03A7 7 0 1 0 21 12.79Z" />
  </svg>
);

function StyleInjector() {
  return (
    <style>{`
      :root{
        --header-h: 60px;
        --safe-top: env(safe-area-inset-top, 0px);

        --bg:#f6f7fb; --text:#0b1220; --muted:#5b6b7f;
        --panel:#ffffffef; --border:#e6e9ef; --shadow:0 10px 30px rgba(15,23,42,.10);
        --brand1:#1e40af; --brand2:#3b82f6;
      }
      [data-theme="dark"]{
        --bg:#0b1220; --text:#e5e7eb; --muted:#9aa6b2;
        --panel:#0f172acc; --border:#1b2436; --shadow:0 14px 40px rgba(0,0,0,.45);
        --brand1:#66d9e8; --brand2:#22d3ee;
      }

      html, body, #root { height:100% }
      body { margin:0; background:var(--bg); color:var(--text);
        font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif }

      .site-header{
        position:fixed; inset:0 0 auto 0;
        height:calc(var(--header-h) + var(--safe-top));
        z-index:4000;
        background:linear-gradient(180deg, rgba(8,12,22,.92), rgba(8,12,22,.88));
        border-bottom:1px solid rgba(255,255,255,.08);
        backdrop-filter:saturate(140%) blur(10px);
      }
      .site-header__inner{
        max-width:1200px; margin:0 auto;
        padding:calc(8px + var(--safe-top)) 20px 8px;
        display:grid; grid-template-columns:auto 1fr auto; gap:22px; align-items:center;
      }
      .brand{ font-weight:800; font-size:18px; color:#e5edff; white-space:nowrap }
      .nav{ display:flex; gap:22px; white-space:nowrap }
      .nav a{ text-decoration:none; font-weight:600; color:#c7d0e0; padding:6px 6px }
      .nav a.active{ color:#60a5fa }
      .header-actions{ display:flex; gap:12px; align-items:center }
      .fab.theme{
        width:36px; height:36px; border-radius:10px;
        display:inline-flex; align-items:center; justify-content:center;
        background:linear-gradient(135deg,#60a5fa,#8b5cf6);
        color:#fff; border:1px solid rgba(255,255,255,.35); box-shadow:var(--shadow);
        cursor:pointer;
      }

      /* Map starts below header */
      .app-main{ padding-top:calc(var(--header-h) + var(--safe-top)) }

      /* Zoom is pinned just under header (never under it) */
      .leaflet-top { top: calc(var(--header-h) + var(--safe-top) + 8px) !important; }
      .leaflet-control-zoom { z-index: 3000; }
    `}</style>
  );
}

function Header({ theme, setTheme }) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="brand">PlotVista</div>
        <nav className="nav">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/blog">Blog</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>
        <div className="header-actions">
          <button className="fab theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle theme">
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "36px 20px", color: "var(--muted)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 24 }}>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>PlotVista</div>
            <div>Pakistan’s premium plot explorer for buying & selling with map-first clarity.</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Company</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 1.9 }}>
              <li><NavLink to="/about">About</NavLink></li>
              <li><NavLink to="/blog">Blog</NavLink></li>
              <li><NavLink to="/contact">Contact</NavLink></li>
            </ul>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Newsletter</div>
            <input placeholder="you@email.com" style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)" }} />
          </div>
        </div>
        <div style={{ marginTop: 28, fontSize: 12 }}>© {new Date().getFullYear()} PlotVista. All rights reserved.</div>
      </div>
    </footer>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <StyleInjector />
      <Header theme={theme} setTheme={setTheme} />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
