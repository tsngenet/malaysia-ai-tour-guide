import React, { useEffect, useMemo, useRef, useState } from 'react';
import boundaries from '../data/geo/peninsula-states.json';
import {
  REGIONS, MAP_WIDTH, MAP_HEIGHT, project, clusterPins, regionById
} from '../poi/geo.js';
import { countsByState, isStaff, pinKind, visiblePois } from '../poi/access.js';
import { displayName } from '../poi/schema.js';
import { usePoiRuntime, setRole, DEMO_ROLES_ENABLED } from '../poi/runtime.js';
import { ROLES } from '../poi/access.js';
import { PoiCard, STATUS_META } from './PoiCard.jsx';

const ringsOf = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);
const pathFor = (g) => ringsOf(g).map((poly) => poly.map((ring) =>
  ring.map(([lng, lat], i) => { const p = project(lat, lng); return `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`; }).join('') + 'Z').join('')).join('');
const bboxOf = (g) => {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  ringsOf(g).forEach((poly) => poly[0].forEach(([lng, lat]) => { const p = project(lat, lng); x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }));
  return { x0, y0, x1, y1 };
};
const FEATURES = boundaries.features.map((f) => ({ id: f.properties.id, d: pathFor(f.geometry), box: bboxOf(f.geometry) }));
const FULL = { x: 0, y: 0, w: MAP_WIDTH };

// Decorative only: approximate placement, never used for POI positions.
const DECOR = [
  { lat: 3.158, lng: 101.712, t: '🏙️' }, { lat: 5.42, lng: 100.33, t: '🍜' }, { lat: 2.19, lng: 102.25, t: '🏰' },
  { lat: 6.35, lng: 99.8, t: '🦅' }, { lat: 4.6, lng: 101.5, t: '🌿' }, { lat: 3.8, lng: 102.4, t: '🌴' }, { lat: 1.6, lng: 103.6, t: '⛵' }
];

function StateSummary({ id, counts, staff }) {
  const r = regionById(id);
  const c = counts[r.en] || { total: 0, byStatus: staff ? { draft: 0, needs_review: 0, approved: 0, archived: 0 } : null };
  return (
    <div>
      <b>{r.en}</b> <span lang="zh">{r.zh}</span>
      <div>{c.total} {c.total === 1 ? 'place' : 'places'}</div>
      {c.byStatus && (
        <div className="poi-muted">
          {['approved', 'needs_review', 'draft', 'archived'].map((s) => `${STATUS_META[s].label}: ${c.byStatus[s]}`).join(' · ')}
        </div>
      )}
    </div>
  );
}

export function PoiMapView({ onBack, onOpenCollect, onOpenOperator }) {
  const { role, pois, mutate } = usePoiRuntime();
  const staff = isStaff(role);
  const [lang, setLang] = useState('en');
  const [view, setView] = useState(FULL);
  const [selState, setSelState] = useState(null);
  const [hover, setHover] = useState(null); // {id, x, y}
  const [selPoi, setSelPoi] = useState(null);
  const [q, setQ] = useState('');
  const [stateQ, setStateQ] = useState('');
  const [fCat, setFCat] = useState('');
  const [fCity, setFCity] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fState, setFState] = useState('');
  const [pxW, setPxW] = useState(700);
  const wrap = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    if (!wrap.current) return undefined;
    const ro = new ResizeObserver(() => setPxW(wrap.current.clientWidth || 700));
    ro.observe(wrap.current);
    return () => ro.disconnect();
  }, []);

  const counts = useMemo(() => countsByState(pois, role), [pois, role]);
  const visible = useMemo(() => visiblePois(pois, role), [pois, role]);
  const cats = useMemo(() => [...new Set(visible.map((p) => p.category).filter(Boolean))].sort(), [visible]);
  const cities = useMemo(() => [...new Set(visible.map((p) => p.location.city).filter(Boolean))].sort(), [visible]);

  const filtered = useMemo(() => visible.filter((p) => {
    const s = fState || (selState ? regionById(selState).en : '');
    if (s && p.location.state !== s) return false;
    if (fCat && p.category !== fCat) return false;
    if (fCity && p.location.city !== fCity) return false;
    if (fStatus && p.status !== fStatus) return false;
    if (q) {
      const hay = [p.names.en, p.names.zh, p.names.ms, ...p.aliases, ...p.tags, p.location.city].join(' ').toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  }), [visible, selState, fState, fCat, fCity, fStatus, q]);

  const h = view.w * MAP_HEIGHT / MAP_WIDTH;
  const k = view.w / pxW; // svg units per screen pixel
  const pins = useMemo(() => filtered.filter((p) => pinKind(p, role) !== 'none').map((p) => {
    const pt = project(p.location.lat, p.location.lng);
    return { id: p.id, x: pt.x, y: pt.y, poi: p, kind: pinKind(p, role) };
  }), [filtered, role]);
  const clusters = useMemo(() => clusterPins(pins, 40 * k), [pins, k]);
  const unpinned = filtered.filter((p) => pinKind(p, role) === 'none');

  function fitBox(b, pad = 40) {
    const w = Math.max((b.x1 - b.x0) + pad * 2, 60);
    const hh = Math.max((b.y1 - b.y0) + pad * 2, 60);
    const vw = Math.min(MAP_WIDTH, Math.max(w, hh * MAP_WIDTH / MAP_HEIGHT));
    const vh = vw * MAP_HEIGHT / MAP_WIDTH;
    setView({ x: (b.x0 + b.x1) / 2 - vw / 2, y: (b.y0 + b.y1) / 2 - vh / 2, w: vw });
  }
  function selectState(id) {
    setSelState(id); setSelPoi(null); setFState('');
    fitBox(FEATURES.find((f) => f.id === id).box);
  }
  function zoom(f) {
    setView((v) => { const w = Math.min(MAP_WIDTH, Math.max(80, v.w * f)); return { x: v.x + (v.w - w) / 2, y: v.y + (v.w - w) / 2 * MAP_HEIGHT / MAP_WIDTH, w }; });
  }
  function reset() { setView(FULL); setSelState(null); setSelPoi(null); }

  const onPointerDown = (e) => { drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false }; };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (d && e.buttons) {
      const dx = e.clientX - d.x; const dy = e.clientY - d.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) d.moved = true;
      if (d.moved) setView((v) => ({ ...v, x: d.vx - dx * k, y: d.vy - dy * k }));
    }
  };
  const onPointerUp = () => { setTimeout(() => { drag.current = null; }, 0); };
  const clickOK = () => !drag.current?.moved;

  const hoverTip = (id) => (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = wrap.current.getBoundingClientRect();
    setHover({ id, x: e.clientX - r.left + 12, y: e.clientY - r.top + 12 });
  };
  const stateMatches = REGIONS.filter((r) => !stateQ || `${r.en} ${r.zh}`.toLowerCase().includes(stateQ.toLowerCase()));
  const poiSel = selPoi && visible.find((p) => p.id === selPoi);

  return (
    <div className="poi-screen">
      <header className="poi-top">
        <div>
          <span className="operator-badge">MASTER MAP</span>
          <h1>Peninsular Malaysia Places</h1>
          <p className="poi-muted">Pins use verified coordinates only. Illustrations are decorative.</p>
        </div>
        <div className="poi-top-actions">
          {DEMO_ROLES_ENABLED ? (
            <>
              <label className="poi-muted" htmlFor="role-sel">Viewing as (dev-only demo switch)</label>
              <select id="role-sel" className="form-input" value={role} onChange={(e) => { setRole(e.target.value); setSelPoi(null); }}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </>
          ) : (
            <span className="poi-muted" data-testid="poi-role-label">{role === 'passenger' ? 'Public view – sign in as a driver in the itinerary builder for more' : `Signed in (${role})`}</span>
          )}
          <div className="poi-btnrow">
            <button type="button" className="btn-secondary" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}>{lang === 'en' ? '中文' : 'English'}</button>
            {staff && <button type="button" className="btn-secondary" onClick={onOpenCollect}>📋 Collect / review</button>}
            {staff && <button type="button" className="btn-secondary" onClick={onOpenOperator}>🚐 Itinerary</button>}
            <button type="button" className="btn-subtle" onClick={onBack}>✕ Close</button>
          </div>
        </div>
      </header>

      <div className="poi-filters" role="search">
        <input className="form-input" type="search" aria-label="Search places" placeholder="Search name, tag, city…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="form-input" aria-label="Filter by state" value={fState} onChange={(e) => { setFState(e.target.value); setSelState(null); }}>
          <option value="">All states</option>{REGIONS.map((r) => <option key={r.id} value={r.en}>{r.en}</option>)}
        </select>
        <select className="form-input" aria-label="Filter by city" value={fCity} onChange={(e) => setFCity(e.target.value)}>
          <option value="">All cities</option>{cities.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="form-input" aria-label="Filter by category" value={fCat} onChange={(e) => setFCat(e.target.value)}>
          <option value="">All categories</option>{cats.map((c) => <option key={c}>{c}</option>)}
        </select>
        {staff && (
          <select className="form-input" aria-label="Filter by status" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
            <option value="">All statuses</option>{Object.entries(STATUS_META).map(([s, m]) => <option key={s} value={s}>{m.label}</option>)}
          </select>
        )}
      </div>

      <div className="poi-layout">
        <section className="poi-mapcol" aria-label="Map of Peninsular Malaysia">
          <div className="poi-map-wrap" ref={wrap}>
            <svg
              viewBox={`${view.x} ${view.y} ${view.w} ${h}`} className="poi-svg" role="group"
              aria-label="Map. Use Tab to move between states and Enter to open one."
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
            >
              <defs>
                <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4fc3f7" /><stop offset="1" stopColor="#0288d1" /></linearGradient>
              </defs>
              <rect x={-2000} y={-2000} width={6000} height={6000} fill="url(#sea)" />
              {FEATURES.map((f) => {
                const r = regionById(f.id);
                const c = counts[r.en]?.total || 0;
                const active = selState === f.id || hover?.id === f.id;
                return (
                  <path
                    key={f.id} d={f.d} tabIndex={0} role="button"
                    aria-label={`${r.en}, ${c} ${c === 1 ? 'place' : 'places'}. Press Enter to explore.`}
                    aria-pressed={selState === f.id}
                    className={`poi-state ${active ? 'active' : ''}`}
                    onPointerEnter={hoverTip(f.id)} onPointerMove={hoverTip(f.id)} onPointerLeave={() => setHover(null)}
                    onClick={() => { if (clickOK()) selectState(f.id); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectState(f.id); } }}
                  />
                );
              })}
              <g aria-hidden="true" pointerEvents="none">
                {DECOR.map((d, i) => { const p = project(d.lat, d.lng); return <text key={i} x={p.x} y={p.y} fontSize={26 * k} textAnchor="middle" opacity="0.85">{d.t}</text>; })}
              </g>
              <g>
                {clusters.map((c) => (
                  <g key={c.id} transform={`translate(${c.x} ${c.y}) scale(${k})`}>
                    {c.type === 'cluster' ? (
                      <g role="button" tabIndex={0} aria-label={`${c.count} places grouped. Press Enter to zoom in.`} className="poi-pin"
                        onClick={(e) => { e.stopPropagation(); if (clickOK()) fitBox({ x0: Math.min(...c.items.map((i) => i.x)), x1: Math.max(...c.items.map((i) => i.x)), y0: Math.min(...c.items.map((i) => i.y)), y1: Math.max(...c.items.map((i) => i.y)) }, 30); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') fitBox({ x0: Math.min(...c.items.map((i) => i.x)), x1: Math.max(...c.items.map((i) => i.x)), y0: Math.min(...c.items.map((i) => i.y)), y1: Math.max(...c.items.map((i) => i.y)) }, 30); }}>
                        <circle r="15" fill="#C8102E" stroke="#fff" strokeWidth="2" /><text textAnchor="middle" y="5" fill="#fff" fontSize="13" fontWeight="700">{c.count}</text>
                      </g>
                    ) : (
                      <g role="button" tabIndex={0} className="poi-pin" aria-label={`${displayName(c.poi, lang)}, ${STATUS_META[c.poi.status].label}${c.kind === 'unconfirmed' ? ', location not verified' : ''}`}
                        onClick={(e) => { e.stopPropagation(); if (clickOK()) setSelPoi(c.id); }} onKeyDown={(e) => { if (e.key === 'Enter') setSelPoi(c.id); }}>
                        <circle r="14" fill="#fff" fillOpacity="0.01" />
                        <text textAnchor="middle" y="6" fontSize="20" fill={STATUS_META[c.poi.status].color} stroke="#fff" strokeWidth="1.5" paintOrder="stroke">{STATUS_META[c.poi.status].shape}</text>
                        {c.kind === 'unconfirmed' && <circle r="13" fill="none" stroke="#111" strokeWidth="1.5" strokeDasharray="3 3" />}
                      </g>
                    )}
                  </g>
                ))}
              </g>
            </svg>
            <div className="poi-zoom">
              <button type="button" aria-label="Zoom in" onClick={() => zoom(0.6)}>＋</button>
              <button type="button" aria-label="Zoom out" onClick={() => zoom(1 / 0.6)}>－</button>
              <button type="button" aria-label="Reset map view" onClick={reset}>⟲</button>
            </div>
            {hover && <div className="poi-tip" style={{ left: hover.x, top: hover.y }} role="tooltip"><StateSummary id={hover.id} counts={counts} staff={staff} /></div>}
          </div>
          <div className="poi-legend" aria-label="Map key">
            {staff ? Object.entries(STATUS_META).map(([s, m]) => <span key={s}><b style={{ color: m.color }} aria-hidden="true">{m.shape}</b> {m.label}</span>) : <span><b style={{ color: STATUS_META.approved.color }} aria-hidden="true">●</b> Approved place</span>}
            {staff && <span>⬚ dashed ring = coordinates not verified</span>}
          </div>
          <p className="poi-muted poi-attr">{boundaries.metadata.attribution} No third-party map tiles are loaded.</p>
        </section>

        <aside className="poi-side">
          {selState && <div className="poi-selected" role="status"><StateSummary id={selState} counts={counts} staff={staff} />
            <button type="button" className="btn-subtle" onClick={reset}>Show all states</button></div>}
          <label className="form-label" htmlFor="state-search">Find a state</label>
          <input id="state-search" className="form-input" type="search" placeholder="Type a state name" value={stateQ} onChange={(e) => setStateQ(e.target.value)} />
          <ul className="poi-statelist" aria-label="States and federal territories">
            {stateMatches.map((r) => (
              <li key={r.id}><button type="button" className={selState === r.id ? 'on' : ''} onClick={() => selectState(r.id)}>
                {r.en} <span lang="zh">{r.zh}</span> <span className="poi-count">{counts[r.en]?.total || 0}</span></button></li>
            ))}
          </ul>
          {counts.__unknown__ && <p className="poi-muted">{counts.__unknown__.total} place(s) have no state yet.</p>}

          {poiSel && <PoiCard poi={poiSel} role={role} lang={lang} onClose={() => setSelPoi(null)} onChange={() => mutate(() => {})} />}

          <h3>Places ({filtered.length})</h3>
          {unpinned.length > 0 && <p className="poi-muted">{unpinned.length} without an exact verified pin are listed below, not drawn on the map.</p>}
          {filtered.length === 0 && <p className="poi-muted">{visible.length === 0 ? (staff ? 'No places yet. Open “Collect / review” to import the starter collection.' : 'No approved places are published yet.') : 'No places match these filters.'}</p>}
          <ul className="poi-list">
            {filtered.slice(0, 200).map((p) => (
              <li key={p.id}><button type="button" onClick={() => setSelPoi(p.id)}>
                {staff && <span style={{ color: STATUS_META[p.status].color }} aria-hidden="true">{STATUS_META[p.status].shape} </span>}
                {displayName(p, lang)} <span className="poi-muted">{p.location.state || 'state unknown'}{pinKind(p, role) === 'none' ? ' · no exact pin' : pinKind(p, role) === 'unconfirmed' ? ' · pin unverified' : ''}</span></button></li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
