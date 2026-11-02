import React, { useState } from 'react';
import { getTranslation } from '../lib/i18n.js';
import { submitPassengerContribution } from '../data/knowledge.js';
import { IconClose, IconCheck } from './common/Icons.jsx';

export function PassengerShareModal({ currentStop, language, onClose, onSubmitted }) {
  const [selectedCategory, setSelectedCategory] = useState('practical_tip');
  const [comment, setComment] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const t = (k) => getTranslation(language, k);

  const contributionCategories = [
    { id: 'practical_tip', label: 'Share a practical / local tip', icon: '💡' },
    { id: 'wanted_to_know', label: 'Something I wanted to know', icon: '❓' },
    { id: 'suggest_place', label: 'Suggest a place', icon: '📍' },
    { id: 'interesting_fact', label: 'Something interesting', icon: '✨' },
    { id: 'other_comment', label: 'Other comment', icon: '💬' }
  ];

  function handleSubmit(e) {
    e.preventDefault();
    if (!comment.trim()) return;

    submitPassengerContribution({
      placeId: currentStop?.placeId || 'general',
      tipType: selectedCategory,
      comment: comment.trim(),
      submitterName: submitterName.trim() || 'Fellow Traveler',
      language
    });

    setSubmitted(true);
    if (onSubmitted) onSubmitted();
    setTimeout(() => {
      onClose();
    }, 2200);
  }

  return (
    <div className="modal-backdrop-shell" onClick={onClose}>
      <div className="share-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-sheet-dragger" />

        <div className="modal-sheet-header">
          <div className="header-info-group">
            <h2 className="modal-title">Share Something</h2>
            <p className="modal-subtitle">
              Help make future journeys better. Your contribution will be reviewed before being shared.
            </p>
            {currentStop?.name && (
              <span className="location-context-tag">
                📍 {currentStop.name}
              </span>
            )}
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Close">
            <IconClose size={20} />
          </button>
        </div>

        {submitted ? (
          <div className="share-success-box">
            <div className="share-success-icon-wrap">
              <IconCheck size={32} />
            </div>
            <h3>Thank You!</h3>
            <p>Your contribution was received and queued for review. Every tip helps future passengers understand Malaysia better.</p>
          </div>
        ) : (
          <form className="share-compact-form" onSubmit={handleSubmit}>
            {/* Category Choices */}
            <div className="category-choices-list">
              {contributionCategories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-choice-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                    aria-pressed={isSelected}
                  >
                    <span className="cat-icon">{cat.icon}</span>
                    <span className="cat-label">{cat.label}</span>
                    {isSelected && <span className="cat-check">✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Note / Content Input */}
            <div className="share-input-block">
              <label className="input-field-label">Your Note or Observation</label>
              <textarea
                className="share-textarea"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your tip, question, or note here..."
                required
              />
            </div>

            {/* Optional Name */}
            <div className="share-input-block">
              <label className="input-field-label">Your Name (Optional)</label>
              <input
                type="text"
                className="share-text-input"
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                placeholder="e.g. Alex"
              />
            </div>

            <div className="share-submit-row">
              <button
                type="submit"
                disabled={!comment.trim()}
                className="btn-primary-pill"
              >
                Submit Contribution
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
