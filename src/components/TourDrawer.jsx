import React from 'react';
import { SUPPORTED_LANGUAGES, getTranslation } from '../lib/i18n.js';
import { IconClose, IconCheck, IconMapPin } from './common/Icons.jsx';
import { StatusBadge } from './common/StatusBadge.jsx';

export function TourDrawer({
  tour,
  allStopsWithState,
  currentIndex,
  language,
  onClose,
  onSelectStop,
  onSelectLanguage,
  onCompleteTour
}) {
  const t = (k) => getTranslation(language, k);

  return (
    <div className="modal-backdrop-shell" onClick={onClose}>
      <div className="itinerary-sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-sheet-dragger" />

        <div className="modal-sheet-header">
          <div className="header-info-group">
            <span className="tour-code-tag">{tour.code}</span>
            <h2 className="modal-title">{t('routeTitle')}</h2>
            <p className="modal-subtitle">
              {tour.title?.[language] || tour.title?.en}
            </p>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Close">
            <IconClose size={20} />
          </button>
        </div>

        {/* Mid-journey Language Switcher */}
        {onSelectLanguage && (
          <div
            className="drawer-lang-selector"
            style={{
              display: 'flex',
              gap: '6px',
              marginBottom: '14px',
              flexWrap: 'wrap'
            }}
          >
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  className={`drawer-lang-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelectLanguage(lang.code)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    border: isSelected ? '1.5px solid #C8102E' : '1px solid #D9D7D2',
                    background: isSelected ? '#FFF7E6' : '#FFFFFF',
                    color: isSelected ? '#A10E1A' : '#1F1F1F',
                    fontWeight: isSelected ? '700' : '500',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {lang.flag} {lang.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="itinerary-timeline-list">
          {allStopsWithState.map((stop, idx) => {
            const isCurrent = idx === currentIndex;
            const isVisited = stop.isVisited;
            const distanceDisplay = stop.distanceMeters !== null
              ? (stop.distanceMeters < 1000 ? `${Math.round(stop.distanceMeters)} m` : `${(stop.distanceMeters / 1000).toFixed(1)} km`)
              : null;

            return (
              <div
                key={stop.stopId || idx}
                className={`timeline-stop-row ${isCurrent ? 'current' : ''} ${isVisited ? 'visited' : ''}`}
                onClick={() => {
                  if (onSelectStop) onSelectStop(idx);
                  onClose();
                }}
                role="button"
                tabIndex={0}
                aria-label={`${stop.name} ${isCurrent ? '- Active Stop' : ''}`}
              >
                <div className="stop-step-indicator">
                  {isVisited ? (
                    <span className="step-visited-check">✓</span>
                  ) : (
                    <span className="step-number">{idx + 1}</span>
                  )}
                  {idx < allStopsWithState.length - 1 && <div className="step-connector-line" />}
                </div>

                <div className="stop-card-details">
                  <div className="stop-header-line">
                    <span className="stop-title-text">{stop.name}</span>
                    {distanceDisplay && (
                      <span className="stop-distance-chip">
                        <IconMapPin size={12} />
                        <span>{distanceDisplay}</span>
                      </span>
                    )}
                  </div>

                  <div className="stop-badge-status-line">
                    {isCurrent && <StatusBadge type="approaching" label="ACTIVE STOP" />}
                    {isVisited && <StatusBadge type="verified" label="VISITED" />}
                    {!isCurrent && !isVisited && <StatusBadge type="next" label="UPCOMING" />}
                  </div>

                  {stop.shortIntro && (
                    <p className="stop-intro-snip">{stop.shortIntro}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Conclude Journey CTA */}
        {onCompleteTour && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #ECEAE5' }}>
            <button
              type="button"
              className="btn-secondary-pill full-width"
              onClick={() => {
                onClose();
                onCompleteTour();
              }}
              style={{ minHeight: '48px', fontSize: '14px' }}
            >
              🏁 Conclude Journey & View Keepsake
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
