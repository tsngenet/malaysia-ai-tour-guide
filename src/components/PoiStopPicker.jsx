import React, { useState, useMemo } from 'react';
import { poiStore } from '../poi/runtime.js';
import { snapshotPoi } from '../poi/access.js';
import { stopFromSnapshot } from '../poi/stopFromPoi.js';

/**
 * Master-POI search for the itinerary builder. Source is the browser-local POI store
 * (plus places picked on the master map). Adding a place stores a frozen snapshot in the stop.
 */
export function PoiStopPicker({ onAddStops, nextDay = 1, onOpenMap, picks = [], onClearPicks }) {
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return poiStore.list().filter((p) => p.status !== 'archived'
      && [p.names.en, p.names.zh, p.location.city, p.location.state].join(' ').toLowerCase().includes(t)).slice(0, 8);
  }, [q]);
  const add = (snaps) => {
    onAddStops(snaps.map((s) => stopFromSnapshot(s, nextDay)));
    setMsg(`Added ${snaps.length} place${snaps.length === 1 ? '' : 's'}.`);
  };
  return (
    <div className="operator-section-card" data-testid="poi-picker">
      <h3>Places from the master collection</h3>
      <div className="poi-btnrow">
        {onOpenMap && <button type="button" className="btn-secondary" onClick={onOpenMap}>🗺 Pick on map</button>}
        {picks.length > 0 && (
          <button type="button" className="btn-primary" onClick={() => { add(picks); onClearPicks?.(); }}>
            Add {picks.length} picked place{picks.length === 1 ? '' : 's'}
          </button>
        )}
      </div>
      <label className="form-label" htmlFor="poi-find">Search places (any state)</label>
      <input id="poi-find" type="search" className="form-input" placeholder="Name, city or state" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="poi-list">
        {matches.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => { add([snapshotPoi(p, new Date().toISOString())]); setQ(''); }}>
              ＋ {p.names.en || p.names.zh} <span className="poi-muted">{p.location.state || 'state unknown'} · {p.status === 'approved' ? 'approved' : 'unreviewed – name only for passengers'}</span>
            </button>
          </li>
        ))}
      </ul>
      <p role="status" className="poi-muted">{msg}</p>
    </div>
  );
}
