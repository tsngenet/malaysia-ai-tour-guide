import React from 'react';
import { SUPPORTED_LANGUAGES, getTranslation } from '../lib/i18n.js';

export function WelcomeScreen({ language, onSelectLanguage, onStartTour, onOpenOperator }) {
  const t = (k) => getTranslation(language, k);

  return (
    <div className="welcome-screen">
      <div className="welcome-hero">
        <div className="welcome-badge">LIVE PASSENGER COMPANION</div>
        <h1 className="welcome-title">{t('welcomeHeading')}</h1>
        <p className="welcome-subtitle">{t('welcomeBody')}</p>
      </div>

      <div className="language-selector-section">
        <label className="section-label">{t('chooseLanguage')}</label>
        <div className="language-grid">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                className={`lang-card ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectLanguage(lang.code)}
              >
                <span className="lang-flag">{lang.flag}</span>
                <span className="lang-label">{lang.label}</span>
                {isSelected && <span className="lang-check">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="welcome-actions">
        <button
          type="button"
          className="btn-primary btn-large btn-glow"
          onClick={onStartTour}
        >
          🚀 {t('startTour')}
        </button>

        <p className="welcome-disclaimer">
          {t('locationPrePromptNote')}
        </p>

        <button
          type="button"
          className="btn-subtle operator-link"
          onClick={onOpenOperator}
        >
          ⚙️ {t('operatorMode')}
        </button>
      </div>
    </div>
  );
}
