import React, { useState, useEffect } from 'react';
import { getTranslation } from '../lib/i18n.js';
import { JOURNEY_STATUS } from '../lib/journeyEngine.js';
import { speechEngine } from '../lib/speechEngine.js';
import { getApprovedPlaceKnowledge } from '../data/knowledge.js';

export function LiveTourView({
  tour,
  currentStop,
  currentStatus,
  distanceMeters,
  nextStop,
  language,
  isGpsActive,
  onOpenAsk,
  onOpenShare,
  onOpenItinerary,
  onNextStop,
  onPrevStop,
  onCompleteTour,
  onBackToWelcome
}) {
  const [speechState, setSpeechState] = useState({ isPlaying: false, isPaused: false });
  const [showFullNarration, setShowFullNarration] = useState(false);

  const t = (k) => getTranslation(language, k);

  // Sync speech engine state
  useEffect(() => {
    speechEngine.onStateChange = (state) => {
      setSpeechState({ isPlaying: state.isPlaying, isPaused: state.isPaused });
    };
    return () => {
      speechEngine.stop();
    };
  }, []);

  // Fetch approved driver & practical knowledge for current place
  const approvedNotes = currentStop?.placeId ? getApprovedPlaceKnowledge(currentStop.placeId) : [];

  const distanceFormatted = distanceMeters !== null
    ? (distanceMeters < 1000 ? `${Math.round(distanceMeters)} m` : `${(distanceMeters / 1000).toFixed(1)} km`)
    : null;

  function handlePlayAudio() {
    if (speechState.isPlaying && !speechState.isPaused) {
      speechEngine.pause();
    } else if (speechState.isPaused) {
      speechEngine.resume();
    } else {
      const fullText = `${currentStop.name}. ${currentStop.narration || currentStop.shortIntro || ''}`;
      speechEngine.speak(fullText, language);
    }
  }

  function handleReplayAudio() {
    const fullText = `${currentStop.name}. ${currentStop.narration || currentStop.shortIntro || ''}`;
    speechEngine.speak(fullText, language);
  }

  const getStatusBadge = () => {
    switch (currentStatus) {
      case JOURNEY_STATUS.HERE:
        return <span className="status-badge badge-here">📍 {t('here')}</span>;
      case JOURNEY_STATUS.APPROACHING:
        return <span className="status-badge badge-approaching">⚡ {t('approaching')}</span>;
      case JOURNEY_STATUS.COMPLETED:
        return <span className="status-badge badge-completed">🏁 {t('visited')}</span>;
      default:
        return <span className="status-badge badge-upcoming">🚗 {t('upcoming')}</span>;
    }
  };

  return (
    <div className="live-tour-view">
      {/* Top sticky navigation / context bar */}
      <header className="tour-topbar">
        <div className="tour-topbar-left">
          <button type="button" className="btn-icon-subtle" onClick={onBackToWelcome} title="Home">
            ‹
          </button>
          <div className="topbar-info">
            <span className="topbar-title">{tour.title?.[language] || tour.title?.en}</span>
            <div className="topbar-meta">
              <span className={`gps-indicator ${isGpsActive ? 'online' : 'manual'}`}>
                {isGpsActive ? '● GPS Live' : '○ Manual Navigation'}
              </span>
              <span className="topbar-lang">{language.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-itinerary-pill"
          onClick={onOpenItinerary}
        >
          🗺️ {t('viewJourney')}
        </button>
      </header>

      {/* Main Attraction Card */}
      <div className="live-content-container">
        <div className="hero-stop-card">
          <div className="card-status-row">
            {getStatusBadge()}
            {distanceFormatted && (
              <span className="distance-counter">{distanceFormatted}</span>
            )}
          </div>

          <h1 className="stop-headline">{currentStop?.name || t('waitingLocation')}</h1>

          <p className="stop-lead-text">
            {currentStop?.shortIntro || t('waitingLocationDesc')}
          </p>

          {/* Large Audio Control Bar (Low friction for in-car passenger use) */}
          <div className="audio-control-hub">
            <button
              type="button"
              className={`btn-listen-large ${speechState.isPlaying ? 'playing' : ''}`}
              onClick={handlePlayAudio}
            >
              <span className="audio-icon">
                {speechState.isPlaying && !speechState.isPaused ? '⏸' : '🔊'}
              </span>
              <span className="audio-label">
                {speechState.isPlaying && !speechState.isPaused
                  ? t('pause')
                  : speechState.isPaused
                  ? t('resume')
                  : t('listen')}
              </span>
            </button>

            {speechState.isPlaying && (
              <button
                type="button"
                className="btn-audio-secondary"
                onClick={handleReplayAudio}
                title={t('replay')}
              >
                ↺ {t('replay')}
              </button>
            )}
          </div>

          {/* Full Narration Drawer / Toggle */}
          {currentStop?.narration && (
            <div className="narration-expandable">
              {showFullNarration ? (
                <div className="narration-full-text">
                  <p>{currentStop.narration}</p>
                  <button
                    type="button"
                    className="btn-text-toggle"
                    onClick={() => setShowFullNarration(false)}
                  >
                    ▲ Collapse
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-text-toggle"
                  onClick={() => setShowFullNarration(true)}
                >
                  📖 Read Full Story & Details ▼
                </button>
              )}
            </div>
          )}

          {/* Interesting Facts */}
          {currentStop?.interestingFacts && currentStop.interestingFacts.length > 0 && (
            <div className="facts-section">
              <h3 className="section-subheading">💡 {t('interestingFacts')}</h3>
              <ul className="facts-list">
                {currentStop.interestingFacts.map((fact, idx) => (
                  <li key={idx} className="fact-item">{fact}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Practical Driver & Visitor Facilities */}
          {currentStop?.facilities && (
            <div className="facilities-section">
              <h3 className="section-subheading">🚻 {t('facilities')}</h3>
              <div className="facility-grid">
                {currentStop.facilities.restroom && (
                  <div className="facility-item">
                    <b>Restroom:</b> <span>{currentStop.facilities.restroom}</span>
                  </div>
                )}
                {currentStop.facilities.parking && (
                  <div className="facility-item">
                    <b>Parking:</b> <span>{currentStop.facilities.parking}</span>
                  </div>
                )}
                {currentStop.facilities.pickupSuitability && (
                  <div className="facility-item">
                    <b>Pickup Point:</b> <span>{currentStop.facilities.pickupSuitability}</span>
                  </div>
                )}
                {currentStop.facilities.dressCode && (
                  <div className="facility-item">
                    <b>Dress Code:</b> <span>{currentStop.facilities.dressCode}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Approved Practical / Community Tips */}
          {approvedNotes.length > 0 && (
            <div className="driver-notes-section">
              <h3 className="section-subheading">🚗 Approved Practical Advice</h3>
              {approvedNotes.map((note) => (
                <div key={note.knowledgeId} className="note-card">
                  <div className="note-header">
                    <b>{note.title}</b>
                    <small className="note-reviewer">Verified by {note.reviewer}</small>
                  </div>
                  <p className="note-content">
                    {note.content[language] || note.content.en}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Next Stop Preview */}
          {nextStop && (
            <div className="next-stop-banner" onClick={onNextStop}>
              <div className="next-stop-text">
                <small>{t('next')}</small>
                <h4>{nextStop.name}</h4>
              </div>
              <span className="next-stop-arrow">→</span>
            </div>
          )}
        </div>

        {/* Primary Interactive Action Grid */}
        <div className="passenger-action-grid">
          <button
            type="button"
            className="action-tile ai-tile"
            onClick={onOpenAsk}
          >
            <span className="tile-icon">💬</span>
            <div className="tile-text">
              <b>{t('askGuide')}</b>
              <small>Instant history, facts & tips</small>
            </div>
          </button>

          <button
            type="button"
            className="action-tile share-tile"
            onClick={onOpenShare}
          >
            <span className="tile-icon">✍️</span>
            <div className="tile-text">
              <b>{t('shareSomething')}</b>
              <small>Share a driver tip or comment</small>
            </div>
          </button>
        </div>

        {/* Bottom manual tour navigation controls */}
        <div className="tour-stepper-bar">
          <button
            type="button"
            className="btn-stepper"
            onClick={onPrevStop}
            title="Previous stop"
          >
            ◀ Back
          </button>

          <button
            type="button"
            className="btn-stepper btn-stepper-primary"
            onClick={onNextStop}
          >
            {nextStop ? 'Next Stop ▶' : 'Finish Tour 🏁'}
          </button>

          <button
            type="button"
            className="btn-stepper btn-complete"
            onClick={onCompleteTour}
          >
            Complete Tour
          </button>
        </div>
      </div>
    </div>
  );
}
