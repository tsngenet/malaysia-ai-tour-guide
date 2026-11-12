import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { ATTRACTIONS } from '../data/attractions.js';
import { TOURS, DEFAULT_TOUR_ID, getToursStore, saveTourToStore } from '../data/tours.js';
import { SUPPORTED_LANGUAGES } from '../lib/i18n.js';
import { getPicks, clearPicks } from '../data/itineraryPicks.js';
import { encodeTour, shareUrl } from '../data/shareCodec.js';
import { poiStore } from '../poi/runtime.js';
import { stopFromSnapshot } from './OperatorTourBuilderStop.js';

const DRAFT_KEY = 'mytguide_builder_draft_v1';

const newBlankTour = () => {
  const id = `tour-${Date.now().toString(36)}`;
  return {
    tourId: id, code: `MYTG-${Math.floor(1000 + Math.random() * 9000)}`, title: { en: 'New itinerary', zh: '新行程' },
    publicationStatus: 'draft', availableLanguages: ['en', 'zh'], stops: []
  };
};

export function OperatorTourBuilder({ onClose, onSwitchToReview, onOpenTour, onOpenMap }) {
  const [activeTour, setActiveTour] = useState(() => {
    const store = getToursStore();
    return store[DEFAULT_TOUR_ID] || TOURS[DEFAULT_TOUR_ID];
  });
  const [stops, setStops] = useState([...activeTour.stops]);
  const [titleEn, setTitleEn] = useState(activeTour.title?.en || '');
  const [selectedLanguages, setSelectedLanguages] = useState(activeTour.availableLanguages || ['en', 'zh', 'ms']);
  const [newAttractionKey, setNewAttractionKey] = useState('batu-caves');
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);
  // 'saved' | 'dirty' | 'saving' | 'error'
  const [saveState, setSaveState] = useState('saved');
  const [saveError, setSaveError] = useState('');
  const [picks, setPicks] = useState(() => getPicks());
  const [poiQuery, setPoiQuery] = useState('');
  const [qr, setQr] = useState({ dataUrl: '', url: '', bytes: 0, error: '' });
  const [restored, setRestored] = useState(false);
  const loaded = useRef(false);

  const allTours = Object.values(getToursStore());

  // Restore an unsaved working copy after an accidental reload / crash.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        const base = getToursStore()[d.tourId];
        if (base) {
          setActiveTour(base); setStops(d.stops); setTitleEn(d.titleEn); setSelectedLanguages(d.languages);
          setSaveState('dirty'); setRestored(true);
        }
      }
    } catch { /* ignore corrupt draft */ }
    loaded.current = true;
  }, []);

  // Every change is mirrored to a local draft so unfinished work is not silently lost.
  useEffect(() => {
    if (!loaded.current || saveState !== 'dirty') return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ tourId: activeTour.tourId, stops, titleEn, languages: selectedLanguages }));
    } catch (e) { setSaveError(`Draft could not be kept locally: ${e.message}`); setSaveState('error'); }
  }, [stops, titleEn, selectedLanguages, saveState, activeTour.tourId]);

  useEffect(() => {
    if (saveState === 'saved') return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [saveState]);

  const dirty = () => { setSaveState('dirty'); setSaveError(''); };

  function loadTour(tour) {
    if (saveState !== 'saved' && !window.confirm('You have unsaved changes. Switch itinerary and discard them?')) return;
    localStorage.removeItem(DRAFT_KEY);
    setActiveTour(tour); setStops([...tour.stops]); setTitleEn(tour.title?.en || '');
    setSelectedLanguages(tour.availableLanguages || ['en', 'zh']); setSaveState('saved'); setRestored(false);
  }
  function handleNewBlank() { const t = newBlankTour(); saveTourToStore(t); loadTour(t); }
  function handleCopyAsNew() {
    const t = { ...JSON.parse(JSON.stringify(activeTour)), tourId: `tour-${Date.now().toString(36)}`, code: `MYTG-${Math.floor(1000 + Math.random() * 9000)}`, passengerLink: undefined, publicationStatus: 'draft' };
    t.title = { ...t.title, en: `${t.title?.en || 'Itinerary'} (copy)` };
    t.stops = stops.map((s) => ({ ...s, stopId: `${s.stopId}-c${Date.now().toString(36)}` }));
    saveTourToStore(t); loadTour({ ...t });
  }

  // Move stop up/down
  function moveStop(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= stops.length) return;
    const updated = [...stops];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setStops(updated); dirty();
  }

  // Delete stop
  function removeStop(index) {
    setStops(stops.filter((_, i) => i !== index)); dirty();
  }

  // Update trigger radius for a stop
  function updateTriggerRadius(index, newRadius) {
    const updated = [...stops];
    updated[index] = {
      ...updated[index],
      triggerRadiusMeters: Number(newRadius) || 500
    };
    setStops(updated); dirty();
  }

  function updateDuration(index, minutes) {
    const n = Number(minutes);
    const updated = [...stops];
    updated[index] = { ...updated[index], durationMinutes: Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), 1440) : undefined };
    setStops(updated); dirty();
  }

  // Add attraction stop
  function handleAddAttraction() {
    const attraction = ATTRACTIONS[newAttractionKey];
    if (!attraction) return;
    const newStop = {
      stopId: `stop-${Date.now()}-${newAttractionKey}`,
      attractionId: newAttractionKey,
      triggerRadiusMeters: attraction.triggerRadiusMeters || 500,
      durationMinutes: 60
    };
    setStops([...stops, newStop]); dirty();
  }

  function addPoi(poi) {
    const now = new Date().toISOString();
    const snap = {
      poiId: poi.id, poiVersion: poi.version, name: { en: poi.names.en, zh: poi.names.zh }, label: poi.names.en || poi.names.zh,
      state: poi.location.state, city: poi.location.city,
      coordinates: poi.location.coordinateStatus === 'verified' ? { lat: poi.location.lat, lng: poi.location.lng } : null,
      durationMinutes: poi.visit.durationMinutes, durationBasis: poi.visit.durationBasis, summary: { ...poi.summary },
      sourceStatus: poi.status, snapshotAt: now
    };
    setStops((s) => [...s, stopFromSnapshot(snap)]); dirty();
  }
  function addPickedPlaces() {
    setStops((s) => [...s, ...picks.map(stopFromSnapshot)]); clearPicks(); setPicks([]); dirty();
  }

  // Add custom stop
  function handleAddCustomStop() {
    const newStop = {
      stopId: `custom-stop-${Date.now()}`,
      isCustom: true,
      title: {
        en: 'Custom Scenic or Refreshment Stop',
        zh: '自选停靠点 / 休息补给',
        ms: 'Hentian Tersuai'
      },
      coordinates: { lat: 3.1472, lng: 101.6995 },
      triggerRadiusMeters: 500,
      durationMinutes: 30,
      customNarration: {
        en: 'A scenic pause along our journey for photo opportunities and local snacks.',
        zh: '旅程中的自选停留点，方便拍照与享用当地特色小吃。',
        ms: 'Hentian rehat santai untuk bergambar dan menikmati kudapan.'
      }
    };
    setStops([...stops, newStop]); dirty();
  }

  function handleSaveTour() {
    setSaveState('saving');
    const updated = {
      ...activeTour,
      title: {
        ...activeTour.title,
        en: titleEn
      },
      stops,
      availableLanguages: selectedLanguages,
      lastUpdated: new Date().toISOString()
    };
    const r = saveTourToStore(updated);
    if (!r.ok) {
      setSaveState('error'); setSaveError(r.error);
      return;
    }
    setActiveTour(updated);
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    setSaveState('saved'); setRestored(false);
  }

  // Passenger link: a self-contained URL so it opens on the passenger's own phone (no backend/login needed).
  async function openQr() {
    setShowQrModal(true);
    try {
      const snapshotTour = { ...activeTour, title: { ...activeTour.title, en: titleEn }, stops };
      const { payload, bytes } = await encodeTour(snapshotTour);
      const origin = (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') ? window.location.origin : '';
      const url = shareUrl(origin, payload);
      const dataUrl = await QRCode.toDataURL(url, { errorCorrectionLevel: 'L', margin: 1, width: 240 });
      setQr({ dataUrl, url, bytes, error: '' });
    } catch (e) {
      setQr({ dataUrl: '', url: '', bytes: 0, error: `Could not build the QR code (the itinerary may be too long): ${e.message}` });
    }
  }

  function handleCopyLink() {
    const link = qr.url || `${window.location.origin}/?tour=${activeTour.tourId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }, () => setSaveError('Copy failed – select the link and copy it manually.'));
    }
  }

  const totalMinutes = stops.reduce((a, s) => a + (s.durationMinutes || 0), 0);
  const unreviewed = stops.filter((s) => s.poiRef && s.poiRef.sourceStatus !== 'approved').length;
  const q = poiQuery.trim().toLowerCase();
  const poiMatches = q
    ? poiStore.list().filter((p) => p.status !== 'archived' && [p.names.en, p.names.zh, p.location.city, p.location.state].join(' ').toLowerCase().includes(q)).slice(0, 8)
    : [];
  const passengerTestUrl = `/?tour=${activeTour.tourId}`;

  return (
    <div className="operator-container">
      <div className="operator-header">
        <div>
          <span className="operator-badge">OPERATOR SUITE</span>
          <h1>Playlist Tour Builder</h1>
          <p>Compose journey stops like a playlist, configure trigger zones & generate passenger links.</p>
        </div>
        <div className="operator-header-actions">
          <button type="button" className="btn-secondary" onClick={onSwitchToReview}>
            🛡️ Review Queue
          </button>
          <button type="button" className="btn-subtle" onClick={onClose}>
            ✕ Exit Operator
          </button>
        </div>
      </div>

      <div role="status" aria-live="polite" className={`save-state ${saveState}`}>
        {saveState === 'saved' && '✓ All changes saved on this device'}
        {saveState === 'dirty' && '● Unsaved changes (a local draft copy is kept)'}
        {saveState === 'saving' && 'Saving…'}
        {saveState === 'error' && `⚠ Not saved: ${saveError}`}
        {restored && ' · Restored your unsaved draft from last time.'}
      </div>
      <p className="poi-muted">Itineraries are stored in this browser only (no cloud sync yet). Use the passenger QR/link to share.</p>

      <div className="operator-section-card">
        <h3>Itinerary</h3>
        <div className="poi-btnrow">
          <select className="form-input" aria-label="Choose itinerary" value={activeTour.tourId} onChange={(e) => loadTour(getToursStore()[e.target.value])}>
            {allTours.map((t) => <option key={t.tourId} value={t.tourId}>{t.title?.en || t.tourId}</option>)}
          </select>
          <button type="button" className="btn-secondary" onClick={handleNewBlank}>＋ Blank itinerary</button>
          <button type="button" className="btn-secondary" onClick={handleCopyAsNew}>⧉ Copy as new</button>
          {onOpenMap && <button type="button" className="btn-secondary" onClick={onOpenMap}>🗺 Pick places on map</button>}
        </div>
        {picks.length > 0 && (
          <div className="poi-selected">
            <b>{picks.length} place(s) picked on the map</b>: {picks.map((p) => p.label).join(', ')}
            <div><button type="button" className="btn-primary" onClick={addPickedPlaces}>Add all to this itinerary</button></div>
          </div>
        )}
        <label className="form-label" htmlFor="poi-find">Find a place in the master collection</label>
        <input id="poi-find" type="search" className="form-input" placeholder="Type a name, city or state" value={poiQuery} onChange={(e) => setPoiQuery(e.target.value)} />
        <ul className="poi-list">
          {poiMatches.map((p) => (
            <li key={p.id}><button type="button" onClick={() => { addPoi(p); setPoiQuery(''); }}>＋ {p.names.en || p.names.zh} <span className="poi-muted">{p.location.state || 'state unknown'} · {p.status === 'approved' ? 'approved' : 'unreviewed'}</span></button></li>
          ))}
        </ul>
        <p className="poi-muted">Total planned time: {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m (visit time only, excludes driving).
          {unreviewed > 0 && ` ${unreviewed} stop(s) use unreviewed places; passengers will see only their names.`}</p>
      </div>

      {/* Tour Meta */}
      <div className="operator-section-card">
        <h3>Tour Settings</h3>
        <div className="form-group">
          <label className="form-label">Tour Title (English)</label>
          <input
            type="text"
            className="form-input"
            value={titleEn}
            onChange={(e) => { setTitleEn(e.target.value); dirty(); }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Enabled Languages</label>
          <div className="language-pills-row">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const active = selectedLanguages.includes(lang.code);
              return (
                <button
                  key={lang.code}
                  type="button"
                  className={`lang-pill ${active ? 'active' : ''}`}
                  onClick={() => {
                    if (active) {
                      { setSelectedLanguages(selectedLanguages.filter(c => c !== lang.code)); dirty(); }
                    } else {
                      { setSelectedLanguages([...selectedLanguages, lang.code]); dirty(); }
                    }
                  }}
                >
                  {lang.flag} {lang.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="passenger-share-bar">
          <div>
            <b>Passenger Link:</b> <code>{passengerTestUrl}</code>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={openQr}
          >
            📱 Generate Passenger QR
          </button>
        </div>
      </div>

      {/* Stops Playlist */}
      <div className="operator-section-card">
        <div className="card-header-flex">
          <div>
            <h3>Journey Stops Playlist ({stops.length} stops)</h3>
            <p className="card-subtext">Drag or reorder stops to create the vehicle route flow.</p>
          </div>

          <div className="add-stop-controls">
            <select
              value={newAttractionKey}
              onChange={(e) => setNewAttractionKey(e.target.value)}
              className="select-attraction"
            >
              {Object.values(ATTRACTIONS).map((att) => (
                <option key={att.placeId} value={att.placeId}>
                  {att.name.en}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleAddAttraction}
            >
              + Add Attraction
            </button>
            <button
              type="button"
              className="btn-subtle"
              onClick={handleAddCustomStop}
            >
              + Custom Stop
            </button>
          </div>
        </div>

        <div className="playlist-list">
          {stops.map((stop, idx) => {
            const attraction = !stop.isCustom ? ATTRACTIONS[stop.attractionId] : null;
            const stopName = stop.isCustom ? (stop.title?.en || 'Custom Stop') : (attraction?.name?.en || stop.attractionId);

            return (
              <div key={stop.stopId || idx} className="playlist-item">
                <div className="playlist-reorder">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveStop(idx, -1)}
                    className="btn-arrow"
                  >
                    ▲
                  </button>
                  <span className="playlist-order-num">{idx + 1}</span>
                  <button
                    type="button"
                    disabled={idx === stops.length - 1}
                    onClick={() => moveStop(idx, 1)}
                    className="btn-arrow"
                  >
                    ▼
                  </button>
                </div>

                <div className="playlist-content">
                  <div className="playlist-title-row">
                    <b>{stopName}</b>
                    {stop.isCustom ? (
                      <span className="tag-custom">Custom Stop</span>
                    ) : (
                      <span className="tag-attraction">Vetted Attraction</span>
                    )}
                  </div>

                  <div className="playlist-trigger-row">
                    <label>Visit time:</label>
                    <input
                      type="number"
                      aria-label={`Visit minutes for stop ${idx + 1}`}
                      value={stop.durationMinutes ?? ''}
                      onChange={(e) => updateDuration(idx, e.target.value)}
                      className="input-radius"
                      min={5}
                      max={1440}
                      step={5}
                    />
                    <span>min</span>
                  </div>
                  <div className="playlist-trigger-row">
                    <label>Proximity Trigger Radius:</label>
                    <input
                      type="number"
                      value={stop.triggerRadiusMeters || 500}
                      onChange={(e) => updateTriggerRadius(idx, e.target.value)}
                      className="input-radius"
                      min={100}
                      max={5000}
                      step={50}
                    />
                    <span>meters</span>
                  </div>
                </div>

                <div className="playlist-actions">
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => removeStop(idx)}
                    title="Remove stop"
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="builder-save-row">
          <button
            type="button"
            className="btn-primary btn-large"
            onClick={handleSaveTour}
          >
            💾 Save itinerary
          </button>
        </div>
      </div>

      {/* QR Modal */}
      {showQrModal && (
        <div className="modal-backdrop" onClick={() => setShowQrModal(false)}>
          <div className="modal-card qr-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-header">🇲🇾</div>
            <h2>Passenger Scan & Go</h2>
            <p>Display or print this QR in the vehicle for passengers to scan with any phone camera.</p>
            
            <div className="qr-box">
              {qr.dataUrl ? <img src={qr.dataUrl} width="240" height="240" alt="QR code that opens the itinerary" /> : <p role="status">{qr.error || 'Building QR…'}</p>}
            </div>
            {saveState !== 'saved' && <p className="poi-warn" role="alert">You have unsaved changes. This QR shows what is on screen now; save to keep it.</p>}
            {qr.bytes > 1800 && <p className="poi-warn">Long itinerary ({qr.bytes} chars): if the QR is hard to scan, share the link instead.</p>}

            <div className="qr-link-display">
              <code style={{ wordBreak: 'break-all', fontSize: 11 }}>{qr.url ? `${qr.url.slice(0, 60)}…` : passengerTestUrl}</code>
            </div>

            <div className="modal-actions-stacked">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCopyLink}
              >
                {copied ? '✓ Link Copied!' : '📋 Copy Passenger Link'}
              </button>
              {onOpenTour && (
                <button
                  type="button"
                  className="btn-accent"
                  onClick={() => {
                    setShowQrModal(false);
                    onOpenTour(activeTour.tourId);
                  }}
                >
                  🚀 Test Tour Flow Now
                </button>
              )}
              <button
                type="button"
                className="btn-subtle"
                onClick={() => setShowQrModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
