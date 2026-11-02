import React, { useState } from 'react';
import { getTranslation } from '../lib/i18n.js';
import { submitPassengerContribution } from '../data/knowledge.js';

export function PassengerShareModal({ currentStop, language, onClose, onSubmitted }) {
  const [tipType, setTipType] = useState('driver_practical');
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const t = (k) => getTranslation(language, k);

  function handleSubmit(e) {
    e.preventDefault();
    if (!comment.trim()) return;

    submitPassengerContribution({
      placeId: currentStop?.placeId || 'general',
      tipType,
      comment: comment.trim(),
      submitterName: name,
      language
    });

    setSubmitted(true);
    if (onSubmitted) onSubmitted();
    setTimeout(() => {
      onClose();
    }, 2000);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div className="sheet-header">
          <div>
            <small className="sheet-tag">COMMUNITY FEEDBACK</small>
            <h2>{t('shareSomething')}</h2>
            <p className="sheet-subtitle">
              📍 {currentStop?.name || 'General Tour Feedback'}
            </p>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>✕</button>
        </div>

        {submitted ? (
          <div className="submission-success">
            <span className="success-icon">✅</span>
            <h3>{t('contributionReceived')}</h3>
            <p className="success-note">
              Thank you for contributing to fellow travelers in Malaysia!
            </p>
          </div>
        ) : (
          <form className="share-form" onSubmit={handleSubmit}>
            <p className="share-explainer">{t('sharePrompt')}</p>

            <div className="form-group">
              <label className="form-label">{t('shareTypeLabel')}</label>
              <div className="tip-type-selector">
                {[
                  { id: 'driver_practical', label: `🚗 ${t('shareTip')}` },
                  { id: 'suggest_place', label: `📍 ${t('sharePlace')}` },
                  { id: 'passenger_question', label: `❓ ${t('shareQuestion')}` },
                  { id: 'passenger_comment', label: `💬 ${t('shareComment')}` }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    className={`tip-chip ${tipType === type.id ? 'active' : ''}`}
                    onClick={() => setTipType(type.id)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <textarea
                className="form-textarea"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('shareContentPlaceholder')}
                required
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('shareNamePlaceholder')}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={!comment.trim()}
                className="btn-primary btn-large"
              >
                {t('submitContribution')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
