import React from 'react';
import { getTranslation } from '../lib/i18n.js';
import { AppHeader } from './common/AppHeader.jsx';
import { IconCheck } from './common/Icons.jsx';

export function JourneyCompleteView({ tour, visitedStopIds, language, onReturnHome }) {
  const t = (k) => getTranslation(language, k);

  const stops = tour?.stops || [];
  // Identify actual visited stops, falling back to all stops if user reached end
  const exploredStops = stops.filter(s => visitedStopIds.has(s.stopId) || visitedStopIds.size === 0);

  return (
    <div className="journey-complete-view-shell">
      <AppHeader onHome={onReturnHome} />

      <div className="keepsake-content-scroll">
        <div className="keepsake-badge">DIGITAL TRAVEL KEEPSAKE</div>
        
        <h1 className="keepsake-title">
          YOUR<br />
          MALAYSIA JOURNEY 🇲🇾
        </h1>

        <p className="keepsake-intro">
          Today you explored {exploredStops.length} landmark stops across {tour?.title?.[language] || tour?.title?.en || 'Malaysia'}.
        </p>

        {/* Dynamic Explored Places Checklist */}
        <div className="keepsake-stops-card">
          <span className="stops-card-heading">TODAY YOU EXPLORED:</span>
          <div className="stops-checklist">
            {exploredStops.map((stop, idx) => (
              <div key={stop.stopId || idx} className="keepsake-check-item">
                <div className="check-bullet">
                  <IconCheck size={14} />
                </div>
                <span className="check-place-name">{stop.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Keepsake Visual Postcard */}
        <div className="keepsake-visual-banner" role="img" aria-label="Malaysia journey celebratory illustration">
          <div className="keepsake-banner-vignette" />
          <div className="keepsake-banner-content">
            <span className="banner-malaysia-badge">MALAYSIA</span>
            <h3>Thank you for exploring with us</h3>
            <p>Every journey adds to the shared knowledge.</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="keepsake-action-row">
          <button
            type="button"
            className="btn-primary-pill full-width"
            onClick={onReturnHome}
          >
            {t('returnHome')}
          </button>
        </div>
      </div>
    </div>
  );
}
