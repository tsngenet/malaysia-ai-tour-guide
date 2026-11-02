import React from 'react';
import { getTranslation } from '../lib/i18n.js';
import { IconMapPin } from './common/Icons.jsx';

export function LocationPromptModal({ language, onAllowLocation, onContinueManual }) {
  const t = (k) => getTranslation(language, k);

  return (
    <div className="modal-backdrop-shell">
      <div className="location-prompt-card">
        <div className="location-prompt-icon-circle">
          <IconMapPin size={32} />
        </div>

        <h2 className="location-prompt-title">{t('locationPrePromptTitle')}</h2>
        
        <p className="location-prompt-body">
          {t('locationPrePromptDesc')}
        </p>

        <div className="location-privacy-box">
          <span className="privacy-badge-pill">🔒 Privacy First</span>
          <p>{t('locationPrePromptNote')}</p>
        </div>

        <div className="location-prompt-actions">
          <button
            type="button"
            className="btn-primary-pill full-width"
            onClick={onAllowLocation}
          >
            {t('allowLocationBtn')}
          </button>
          
          <button
            type="button"
            className="btn-secondary-pill full-width"
            onClick={onContinueManual}
          >
            {t('continueWithoutGps')}
          </button>
        </div>
      </div>
    </div>
  );
}
