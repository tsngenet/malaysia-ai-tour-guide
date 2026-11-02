import React from 'react';
import { getTranslation } from '../lib/i18n.js';

export function TourDrawer({ tour, allStopsWithState, currentIndex, language, onClose, onSelectStop }) {
  const t = (k) => getTranslation(language, k);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-sheet itinerary-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div className="sheet-header">
          <div>
            <small className="sheet-tag">{tour.code}</small>
            <h2>{t('routeTitle')}</h2>
            <p className="sheet-subtitle">
              {tour.title?.[language] || tour.title?.en}
            </p>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="stops-timeline">
          {allStopsWithState.map((stop, idx) => {
            const isCurrent = idx === currentIndex;
            const isVisited = stop.isVisited;
            const distanceDisplay = stop.distanceMeters !== null
              ? (stop.distanceMeters < 1000 ? `${Math.round(stop.distanceMeters)} m` : `${(stop.distanceMeters / 1000).toFixed(1)} km`)
              : null;

            return (
              <div
                key={stop.stopId || idx}
                className={`timeline-stop ${isCurrent ? 'current' : ''} ${isVisited ? 'visited' : ''}`}
                onClick={() => {
                  if (onSelectStop) onSelectStop(idx);
                  onClose();
                }}
              >
                <div className="stop-marker">
                  {isVisited ? '✓' : idx + 1}
                </div>
                
                <div className="stop-info">
                  <div className="stop-title-row">
                    <span className="stop-name">{stop.name}</span>
                    {distanceDisplay && (
                      <span className="stop-distance-pill">{distanceDisplay}</span>
                    )}
                  </div>
                  
                  <div className="stop-meta-row">
                    {isCurrent && (
                      <span className="badge-status-current">● ACTIVE STOP</span>
                    )}
                    {isVisited && (
                      <span className="badge-status-visited">{t('visited')}</span>
                    )}
                    {!isCurrent && !isVisited && (
                      <span className="badge-status-upcoming">{t('upcoming')}</span>
                    )}
                    {stop.isCustom && (
                      <span className="badge-custom-stop">Custom</span>
                    )}
                  </div>

                  {stop.shortIntro && (
                    <p className="stop-intro-preview">{stop.shortIntro}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
