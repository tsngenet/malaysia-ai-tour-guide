import React, { useMemo } from 'react';
import { getTranslation } from '../lib/i18n.js';
import { resolveStopDetails } from '../lib/journeyEngine.js';
import { AppHeader } from './common/AppHeader.jsx';
import { IconCheck, IconArrowRight } from './common/Icons.jsx';

export function JourneyCompleteView({
  tour,
  visitedStopIds,
  language,
  onRestartTour,
  onReturnHome
}) {
  const t = (k) => getTranslation(language, k);

  // Resolve all stops to get actual names and localized titles
  const allResolvedStops = useMemo(() => {
    return (tour?.stops || []).map(s => resolveStopDetails(s, language));
  }, [tour?.stops, language]);

  // Identify visited stops, falling back to all stops if completed
  const exploredStops = useMemo(() => {
    const visited = allResolvedStops.filter(s => visitedStopIds && visitedStopIds.has(s.stopId));
    return visited.length > 0 ? visited : allResolvedStops;
  }, [allResolvedStops, visitedStopIds]);

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

        {/* Action Buttons */}
        <div className="keepsake-action-row" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {onRestartTour && (
            <button
              type="button"
              className="btn-primary-pill full-width"
              onClick={onRestartTour}
            >
              <span>Start Live Tour Again</span>
              <IconArrowRight size={18} />
            </button>
          )}

          <button
            type="button"
            className="btn-secondary-pill full-width"
            onClick={onReturnHome}
          >
            {t('returnHome')}
          </button>
        </div>
      </div>
    </div>
  );
}
