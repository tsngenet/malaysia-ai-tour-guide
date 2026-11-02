import React, { useState, useEffect } from 'react';
import { getAttractionById } from '../data/attractions.js';
import { getApprovedPlaceKnowledge } from '../data/knowledge.js';
import { speechEngine } from '../lib/speechEngine.js';
import { getTranslation } from '../lib/i18n.js';
import { AppHeader } from './common/AppHeader.jsx';
import { ListenButton } from './common/ListenButton.jsx';
import { StatusBadge } from './common/StatusBadge.jsx';

export function PlaceDetailView({ placeId, language = 'en', onBack }) {
  const [speechState, setSpeechState] = useState({ isPlaying: false, isPaused: false });
  const attraction = getAttractionById(placeId);
  const t = (k) => getTranslation(language, k);

  useEffect(() => {
    speechEngine.onStateChange = (state) => {
      setSpeechState({ isPlaying: state.isPlaying, isPaused: state.isPaused });
    };
    return () => {
      speechEngine.stop();
    };
  }, []);

  if (!attraction) {
    return (
      <div className="place-detail-shell empty-state">
        <AppHeader onHome={onBack} />
        <div className="empty-place-card">
          <h2>Attraction Not Found</h2>
          <p>The requested place ID "{placeId}" does not exist in the library.</p>
          <button type="button" className="btn-primary-pill" onClick={onBack}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const name = attraction.name?.[language] || attraction.name?.en || attraction.placeId;
  const intro = attraction.shortIntro?.[language] || attraction.shortIntro?.en || '';
  const story = attraction.narration?.[language] || attraction.narration?.en || '';
  const facts = (attraction.interestingFacts || []).map(f => f[language] || f.en);
  const approvedNotes = getApprovedPlaceKnowledge(placeId);

  function handlePlayAudio() {
    if (speechState.isPlaying && !speechState.isPaused) {
      speechEngine.pause();
    } else if (speechState.isPaused) {
      speechEngine.resume();
    } else {
      speechEngine.speak(`${name}. ${story || intro}`, language);
    }
  }

  return (
    <div className="place-detail-shell">
      <AppHeader
        onHome={onBack}
        title={name}
        rightAction={
          <button type="button" className="btn-back-pill" onClick={onBack}>
            ← Back
          </button>
        }
      />

      <div className="place-detail-scroll-body">
        {/* Hero Card */}
        <div className="place-hero-detail-card">
          <StatusBadge type="verified" label="VETTED CULTURAL LANDMARK" />
          <h1 className="place-detail-title">{name}</h1>
          <p className="place-detail-intro">{intro}</p>

          <div className="place-listen-row">
            <ListenButton
              isPlaying={speechState.isPlaying && !speechState.isPaused}
              isPaused={speechState.isPaused}
              onClick={handlePlayAudio}
            />
          </div>
        </div>

        {/* Story Section */}
        {story && (
          <section className="place-detail-section">
            <h3>📖 Historical & Cultural Story</h3>
            <p className="place-story-body">{story}</p>
          </section>
        )}

        {/* Interesting Facts */}
        {facts.length > 0 && (
          <section className="place-detail-section">
            <h3>💡 Did You Know?</h3>
            <ul className="place-facts-list">
              {facts.map((fact, idx) => (
                <li key={idx} className="place-fact-item">
                  <span className="fact-star">✦</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Facilities */}
        {attraction.facilities && (
          <section className="place-detail-section">
            <h3>🏛️ Facilities & Practical Etiquette</h3>
            <div className="facilities-detail-grid">
              {attraction.facilities.restroom && (
                <div className="fac-item-card">
                  <b>Restroom:</b>
                  <span>{attraction.facilities.restroom}</span>
                </div>
              )}
              {attraction.facilities.parking && (
                <div className="fac-item-card">
                  <b>Parking:</b>
                  <span>{attraction.facilities.parking}</span>
                </div>
              )}
              {attraction.facilities.dressCode && (
                <div className="fac-item-card">
                  <b>Dress Code:</b>
                  <span>{attraction.facilities.dressCode}</span>
                </div>
              )}
              {attraction.facilities.prayerRoom && (
                <div className="fac-item-card">
                  <b>Prayer Room:</b>
                  <span>{attraction.facilities.prayerRoom}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Approved Driver Observations */}
        {approvedNotes.length > 0 && (
          <section className="place-detail-section">
            <h3>🚐 Approved Driver Practical Notes</h3>
            <div className="driver-notes-container">
              {approvedNotes.map(note => (
                <div key={note.knowledgeId} className="driver-advice-box">
                  <b>{note.title}</b>
                  <p>{note.content?.[language] || note.content?.en}</p>
                  <small>Verified by {note.reviewer || 'Tour Ops'}</small>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Back to Tour Button */}
        <div className="place-detail-bottom-action">
          <button type="button" className="btn-secondary-pill full-width" onClick={onBack}>
            ← Back to Live Tour
          </button>
        </div>
      </div>
    </div>
  );
}
