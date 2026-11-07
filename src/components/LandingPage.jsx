import React, { useState } from 'react';
import { DEFAULT_TOUR_ID, getTourById, fetchTourByIdOrCodeAsync } from '../data/tours.js';
import { BrandLogo } from './common/BrandLogo.jsx';
import { IconArrowRight, IconMapPin, IconListen, IconAsk, IconShare } from './common/Icons.jsx';

export function LandingPage({ onStartTourWithCode, onExploreDefaultTour, onOpenOperator }) {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [isCheckingCode, setIsCheckingCode] = useState(false);

  async function handleSubmitCode(e) {
    e.preventDefault();
    const trimmed = inputCode.trim();
    if (!trimmed) {
      setError('Please enter a tour code (e.g. MYTG-8812)');
      return;
    }
    setIsCheckingCode(true);
    setError('');

    try {
      const found = await fetchTourByIdOrCodeAsync(trimmed);
      if (!found) {
        setError(`Tour code "${trimmed}" was not found. Please verify with your driver.`);
        setIsCheckingCode(false);
        return;
      }
      onStartTourWithCode(found.tourId || found.code);
    } catch {
      setError('Network error checking tour code. Please try again.');
    } finally {
      setIsCheckingCode(false);
    }
  }

  return (
    <div className="landing-screen-wrap">
      {/* 1. Clean Top Header */}
      <header className="landing-navbar">
        <BrandLogo variant="header" />
        <button
          type="button"
          className="btn-header-cta"
          onClick={onExploreDefaultTour}
        >
          Start Journey
        </button>
      </header>

      {/* 2. Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-hero-backdrop" />
        <div className="landing-hero-content">
          <span className="landing-badge">LIVE PASSENGER COMPANION</span>
          
          <h1 className="landing-hero-heading">
            MALAYSIA<br />
            <span className="brand-red-highlight">AI TOUR GUIDE</span>
          </h1>

          <p className="landing-hero-tagline">
            Your journey. More understanding.
          </p>

          <p className="landing-hero-sub-promise">
            See more. Hear the story. Understand the journey.
          </p>

          {/* Action CTAs */}
          <div className="landing-cta-group">
            <button
              type="button"
              className="btn-primary-pill landing-btn-primary"
              onClick={onExploreDefaultTour}
            >
              <span>START YOUR JOURNEY</span>
              <IconArrowRight size={20} />
            </button>

            <button
              type="button"
              className="btn-secondary-pill landing-btn-secondary"
              onClick={() => setShowCodeInput(!showCodeInput)}
            >
              ENTER TOUR CODE
            </button>
          </div>

          {/* Collapsible / Expanding Tour Code Input */}
          {showCodeInput && (
            <div className="landing-code-card-inline">
              <span className="code-card-title">Enter your vehicle or booking tour code:</span>
              <form onSubmit={handleSubmitCode} className="landing-code-form">
                <input
                  type="text"
                  placeholder="e.g. MYTG-8812"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  className="landing-code-input"
                  maxLength={20}
                  autoFocus
                />
                <button type="submit" className="btn-code-submit" disabled={isCheckingCode}>
                  {isCheckingCode ? 'Verifying...' : 'Join Tour →'}
                </button>
              </form>
              {error && <span className="landing-error-msg">{error}</span>}
            </div>
          )}
        </div>
      </section>

      {/* 3. Four Simple Product Ideas / Pillars */}
      <section className="landing-pillars-section">
        <div className="pillars-grid">
          <div className="pillar-item">
            <div className="pillar-icon-circle">
              <IconMapPin size={24} />
            </div>
            <h3>KNOW</h3>
            <p>where you are</p>
          </div>

          <div className="pillar-item">
            <div className="pillar-icon-circle">
              <IconListen size={24} />
            </div>
            <h3>LISTEN</h3>
            <p>while travelling</p>
          </div>

          <div className="pillar-item">
            <div className="pillar-icon-circle">
              <IconAsk size={24} />
            </div>
            <h3>ASK</h3>
            <p>about what you are seeing</p>
          </div>

          <div className="pillar-item">
            <div className="pillar-icon-circle">
              <IconShare size={24} />
            </div>
            <h3>SHARE</h3>
            <p>what you discover</p>
          </div>
        </div>
      </section>

      {/* 4. Grounded Value Summary */}
      <section className="landing-promise-section">
        <p className="landing-promise-quote">
          "Designed specifically for passengers inside tour vans and private-hire vehicles.
          Hands-free audio, battery-friendly geolocation, and verified Malaysian cultural stories."
        </p>
      </section>

      {/* 5. Clean Footer */}
      <footer className="landing-footer-block">
        <p className="footer-motto">Every journey adds to the knowledge.</p>
        <div className="footer-links-row">
          <button type="button" className="btn-footer-link" onClick={onOpenOperator}>
            ⚙️ Operator Suite & Review Queue
          </button>
        </div>
      </footer>
    </div>
  );
}
