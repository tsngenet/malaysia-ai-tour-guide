import React, { useState } from 'react';
import { ATTRACTIONS } from '../data/attractions.js';
import { TOURS, DEFAULT_TOUR_ID, getToursStore, saveTourToStore } from '../data/tours.js';
import { SUPPORTED_LANGUAGES } from '../lib/i18n.js';

export function OperatorTourBuilder({ onClose, onSwitchToReview, onOpenTour }) {
  const [activeTour, setActiveTour] = useState(() => {
    const store = getToursStore();
    return store[DEFAULT_TOUR_ID] || TOURS[DEFAULT_TOUR_ID];
  });
  const [stops, setStops] = useState([...activeTour.stops]);
  const [titleEn, setTitleEn] = useState(activeTour.title?.en || '');
  const [selectedLanguages, setSelectedLanguages] = useState(activeTour.availableLanguages || ['en', 'zh', 'ms']);
  const [newAttractionKey, setNewAttractionKey] = useState('batu-caves');
  const [showQrModal, setShowQrModal] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Move stop up/down
  function moveStop(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= stops.length) return;
    const updated = [...stops];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setStops(updated);
  }

  // Delete stop
  function removeStop(index) {
    setStops(stops.filter((_, i) => i !== index));
  }

  // Update trigger radius for a stop
  function updateTriggerRadius(index, newRadius) {
    const updated = [...stops];
    updated[index] = {
      ...updated[index],
      triggerRadiusMeters: Number(newRadius) || 500
    };
    setStops(updated);
  }

  // Add attraction stop
  function handleAddAttraction() {
    const attraction = ATTRACTIONS[newAttractionKey];
    if (!attraction) return;
    const newStop = {
      stopId: `stop-${Date.now()}-${newAttractionKey}`,
      attractionId: newAttractionKey,
      triggerRadiusMeters: attraction.triggerRadiusMeters || 500
    };
    setStops([...stops, newStop]);
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
      customNarration: {
        en: 'A scenic pause along our journey for photo opportunities and local snacks.',
        zh: '旅程中的自选停留点，方便拍照与享用当地特色小吃。',
        ms: 'Hentian rehat santai untuk bergambar dan menikmati kudapan.'
      }
    };
    setStops([...stops, newStop]);
  }

  function handleSaveTour() {
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
    setActiveTour(updated);
    saveTourToStore(updated);
    setSaveMessage('Tour playlist saved and published to storage successfully!');
    setTimeout(() => setSaveMessage(''), 3500);
  }

  function handleCopyLink() {
    const origin = (typeof window !== 'undefined' && window.location?.origin && !window.location.origin.includes('localhost') && window.location.origin !== 'null')
      ? window.location.origin
      : 'https://msiatguide.web.app';
    const link = activeTour.passengerLink || `${origin}/?tour=${activeTour.tourId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

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

      {saveMessage && (
        <div className="alert-success-banner">
          ✓ {saveMessage}
        </div>
      )}

      {/* Tour Meta */}
      <div className="operator-section-card">
        <h3>Tour Settings</h3>
        <div className="form-group">
          <label className="form-label">Tour Title (English)</label>
          <input
            type="text"
            className="form-input"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
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
                      setSelectedLanguages(selectedLanguages.filter(c => c !== lang.code));
                    } else {
                      setSelectedLanguages([...selectedLanguages, lang.code]);
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
            onClick={() => setShowQrModal(true)}
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
            💾 Save & Publish Tour
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
              <svg viewBox="0 0 160 160" width="160" height="160" className="qr-svg">
                <rect width="160" height="160" fill="#fff" />
                {/* Outer corners */}
                <rect x="10" y="10" width="40" height="40" fill="#064e5b" />
                <rect x="18" y="18" width="24" height="24" fill="#fff" />
                <rect x="24" y="24" width="12" height="12" fill="#064e5b" />

                <rect x="110" y="10" width="40" height="40" fill="#064e5b" />
                <rect x="118" y="18" width="24" height="24" fill="#fff" />
                <rect x="124" y="24" width="12" height="12" fill="#064e5b" />

                <rect x="10" y="110" width="40" height="40" fill="#064e5b" />
                <rect x="18" y="118" width="24" height="24" fill="#fff" />
                <rect x="24" y="124" width="12" height="12" fill="#064e5b" />

                {/* Central code pattern */}
                <rect x="60" y="30" width="12" height="12" fill="#07808c" />
                <rect x="80" y="20" width="16" height="12" fill="#07808c" />
                <rect x="65" y="65" width="30" height="30" rx="4" fill="#f5c451" />
                <text x="80" y="85" textAnchor="middle" fontSize="16" fill="#14343a" fontWeight="bold">🇲🇾</text>
                <rect x="20" y="70" width="25" height="10" fill="#064e5b" />
                <rect x="115" y="75" width="25" height="15" fill="#064e5b" />
                <rect x="60" y="115" width="30" height="12" fill="#064e5b" />
                <rect x="110" y="115" width="20" height="25" fill="#064e5b" />
              </svg>
            </div>

            <div className="qr-link-display">
              <code>{activeTour.passengerLink || passengerTestUrl}</code>
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
