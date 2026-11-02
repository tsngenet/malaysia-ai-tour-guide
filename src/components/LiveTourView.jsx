import React, { useState, useEffect } from 'react';
import { getTranslation } from '../lib/i18n.js';
import { speechEngine } from '../lib/speechEngine.js';
import { getApprovedPlaceKnowledge } from '../data/knowledge.js';
import { AppHeader } from './common/AppHeader.jsx';
import { BottomNav } from './common/BottomNav.jsx';
import { LocationSnapshotCard } from './LocationSnapshotCard.jsx';
import { NextStopCard } from './common/NextStopCard.jsx';
import { IconShare, IconArrowRight } from './common/Icons.jsx';

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
  onBackToWelcome,
  onViewPlace
}) {
  const [speechState, setSpeechState] = useState({ isPlaying: false, isPaused: false });
  const [showFullNarration, setShowFullNarration] = useState(false);
  const [activeTab, setActiveTab] = useState('live');

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

  // Reset narration toggle and stop previous audio on stop change
  useEffect(() => {
    setShowFullNarration(false);
    speechEngine.stop();
  }, [currentStop?.stopId]);

  const approvedNotes = currentStop?.placeId ? getApprovedPlaceKnowledge(currentStop.placeId) : [];

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

  function handleBottomTabSelect(tabId) {
    if (tabId === 'live') {
      setActiveTab('live');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tabId === 'journey') {
      onOpenItinerary();
    } else if (tabId === 'ask') {
      onOpenAsk();
    } else if (tabId === 'more') {
      onOpenItinerary();
    }
  }

  return (
    <div className="live-tour-view-shell">
      {/* 1. Quiet, Functional Header */}
      <AppHeader
        onHome={onBackToWelcome}
        title={tour.title?.[language] || tour.title?.en}
        metaBadge={isGpsActive ? '● GPS' : '○ Manual'}
        onOpenMenu={onOpenItinerary}
      />

      {/* 2. Main Scrollable Content */}
      <div className="live-tour-scroll-body">
        {/* Postcard Location Card */}
        <LocationSnapshotCard
          attraction={currentStop}
          currentStatus={currentStatus}
          distanceMeters={distanceMeters}
          isGpsActive={isGpsActive}
          language={language}
          speechState={speechState}
          onListen={handlePlayAudio}
          onAskAi={onOpenAsk}
          onViewPlace={onViewPlace}
        />

        {/* Next Stop Card */}
        {nextStop && (
          <div className="live-next-stop-container">
            <NextStopCard
              nextStop={nextStop}
              distanceMeters={null}
              onClick={onNextStop}
            />
          </div>
        )}

        {/* Deep Historical Story / Narration */}
        {currentStop?.narration && (
          <section className="tour-section-card story-card">
            <div className="section-card-header">
              <h3>📖 Historical & Cultural Context</h3>
            </div>
            <p className={`story-paragraph ${showFullNarration ? 'expanded' : 'collapsed'}`}>
              {currentStop.narration}
            </p>
            <button
              type="button"
              className="btn-story-toggle"
              onClick={() => setShowFullNarration(!showFullNarration)}
            >
              {showFullNarration ? '▲ Show Less' : '▼ Read Full Cultural Story'}
            </button>
          </section>
        )}

        {/* Interesting Facts */}
        {currentStop?.interestingFacts && currentStop.interestingFacts.length > 0 && (
          <section className="tour-section-card facts-card">
            <div className="section-card-header">
              <h3>💡 {t('interestingFacts')}</h3>
            </div>
            <ul className="facts-clean-list">
              {currentStop.interestingFacts.map((fact, idx) => (
                <li key={idx} className="fact-item-row">
                  <span className="fact-bullet">✦</span>
                  <span className="fact-text">{fact}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Facilities & Practical Etiquette */}
        {currentStop?.facilities && (
          <section className="tour-section-card facilities-card">
            <div className="section-card-header">
              <h3>🏛️ {t('facilities')} & Etiquette</h3>
            </div>
            <div className="facilities-pill-grid">
              {currentStop.facilities.restroom && (
                <div className="facility-mini-item">
                  <span className="facility-label">🚻 Restroom</span>
                  <span className="facility-value">{currentStop.facilities.restroom}</span>
                </div>
              )}
              {currentStop.facilities.parking && (
                <div className="facility-mini-item">
                  <span className="facility-label">🅿️ Parking</span>
                  <span className="facility-value">{currentStop.facilities.parking}</span>
                </div>
              )}
              {currentStop.facilities.dressCode && (
                <div className="facility-mini-item">
                  <span className="facility-label">👗 Dress Code</span>
                  <span className="facility-value">{currentStop.facilities.dressCode}</span>
                </div>
              )}
              {currentStop.facilities.pickupSuitability && (
                <div className="facility-mini-item">
                  <span className="facility-label">🚐 Pickup</span>
                  <span className="facility-value">{currentStop.facilities.pickupSuitability}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Approved Driver Observations */}
        {approvedNotes.length > 0 && (
          <section className="tour-section-card advice-card">
            <div className="section-card-header">
              <h3>🚗 Approved Local Advice</h3>
            </div>
            <div className="advice-items-list">
              {approvedNotes.map((note) => (
                <div key={note.knowledgeId} className="advice-bubble">
                  <b>{note.title}</b>
                  <p>{note.content[language] || note.content.en}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Passenger Contribution Tile */}
        <div className="share-tile-wrap">
          <button
            type="button"
            className="passenger-share-banner-btn"
            onClick={onOpenShare}
          >
            <div className="share-icon-circle">
              <IconShare size={20} />
            </div>
            <div className="share-btn-text">
              <span className="share-btn-title">{t('shareSomething')}</span>
              <small className="share-btn-sub">Share a tip, photo spot or practical feedback</small>
            </div>
            <IconArrowRight size={18} />
          </button>
        </div>

        {/* Stepper Controls (for manual skip or next stop) */}
        <div className="tour-manual-stepper">
          <button
            type="button"
            className="btn-stepper-subtle"
            onClick={onPrevStop}
          >
            ‹ Previous Stop
          </button>
          <button
            type="button"
            className="btn-stepper-advance"
            onClick={nextStop ? onNextStop : onCompleteTour}
          >
            {nextStop ? 'Next Stop ›' : 'Complete Tour 🏁'}
          </button>
        </div>
      </div>

      {/* 3. Persistent Standard Passenger Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabSelect={handleBottomTabSelect}
      />
    </div>
  );
}
