import React from 'react';
import { SUPPORTED_LANGUAGES, getTranslation } from '../lib/i18n.js';
import { AppHeader } from './common/AppHeader.jsx';
import { IconArrowRight } from './common/Icons.jsx';

export function WelcomeScreen({ language, onSelectLanguage, onStartTour, onOpenOperator }) {
  const t = (k) => getTranslation(language, k);

  return (
    <div className="welcome-screen-wrap">
      {/* 1. Header */}
      <AppHeader
        rightAction={
          <button
            type="button"
            className="btn-header-operator"
            onClick={onOpenOperator}
            title={t('operatorMode')}
            aria-label={t('operatorMode')}
          >
            ⚙️
          </button>
        }
      />

      {/* 2. Welcome Content */}
      <div className="welcome-main-body">
        {/* Destination Photo / Keepsake Card */}
        <div className="welcome-hero-card" role="img" aria-label="Malaysia destination scenery">
          <div className="welcome-hero-vignette" />
          <div className="welcome-hero-text">
            <span className="welcome-country-badge">MALAYSIA 🇲🇾</span>
            <h1 className="welcome-main-title">
              Welcome to<br />
              <span className="text-highlight">Malaysia</span>
            </h1>
            <p className="welcome-tagline">
              Your journey has a personal digital guide.
            </p>
          </div>
        </div>

        {/* Primary Dominating CTA */}
        <div className="welcome-primary-action-wrap">
          <button
            type="button"
            className="btn-start-live-tour"
            onClick={onStartTour}
            aria-label={t('startTour')}
          >
            <span>{t('startTour').toUpperCase()}</span>
            <IconArrowRight size={22} />
          </button>
        </div>

        {/* Secondary Language Selector */}
        <div className="welcome-language-section">
          <span className="language-section-label">{t('chooseLanguage')}</span>
          <div className="language-pills-grid">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  className={`welcome-lang-pill ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectLanguage(lang.code)}
                  aria-pressed={isSelected}
                >
                  <span className="lang-flag">{lang.flag}</span>
                  <span className="lang-name">{lang.label}</span>
                  {isSelected && <span className="lang-check-mark">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Supporting Brand Promise */}
        <div className="welcome-footer-tagline">
          <p className="tagline-phrase">See more. Hear the story. Understand the journey.</p>
          <small className="tagline-sub">Malaysia • Always a Good Story</small>
        </div>
      </div>
    </div>
  );
}
