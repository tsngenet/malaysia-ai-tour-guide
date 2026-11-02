import React from 'react';
import { getTranslation } from '../lib/i18n.js';

export function LocationPromptModal({ language, onAllowLocation, onContinueManual }) {
  const t = (k) => getTranslation(language, k);

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-icon-header">📍</div>
        <h2>{t('locationPrePromptTitle')}</h2>
        
        <p className="modal-body-text">
          {t('locationPrePromptDesc')}
        </p>

        <div className="privacy-callout">
          <span className="privacy-badge">🔒 Privacy First</span>
          <p>{t('locationPrePromptNote')}</p>
        </div>

        <div className="modal-buttons">
          <button
            type="button"
            className="btn-primary btn-large"
            onClick={onAllowLocation}
          >
            {t('allowLocationBtn')}
          </button>
          
          <button
            type="button"
            className="btn-secondary"
            onClick={onContinueManual}
          >
            {t('continueWithoutGps')}
          </button>
        </div>
      </div>
    </div>
  );
}
