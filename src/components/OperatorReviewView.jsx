import React, { useState } from 'react';
import { getKnowledgeStore, moderateKnowledge, MODERATION_STATUS } from '../data/knowledge.js';

export function OperatorReviewView({ onBackToBuilder, onClose }) {
  const [store, setStore] = useState(getKnowledgeStore());
  const [filter, setFilter] = useState(MODERATION_STATUS.PENDING_REVIEW);

  const filteredItems = store.filter(item => {
    if (filter === 'all') return true;
    return item.verificationStatus === filter;
  });

  function handleAction(knowledgeId, newStatus) {
    const updated = moderateKnowledge(knowledgeId, newStatus, 'Operator Chief Azman');
    setStore([...updated]);
  }

  return (
    <div className="operator-container">
      <div className="operator-header">
        <div>
          <span className="operator-badge">SAFETY & VERIFICATION GATE</span>
          <h1>Knowledge Moderation Queue</h1>
          <p>
            Review passenger tips and driver notes. Content must be approved before becoming passenger-facing.
          </p>
        </div>
        <div className="operator-header-actions">
          <button type="button" className="btn-secondary" onClick={onBackToBuilder}>
            ← Tour Builder
          </button>
          <button type="button" className="btn-subtle" onClick={onClose}>
            ✕ Exit
          </button>
        </div>
      </div>

      <div className="filter-tabs-row">
        {[
          { id: MODERATION_STATUS.PENDING_REVIEW, label: '⏳ Pending Review' },
          { id: MODERATION_STATUS.APPROVED, label: '✓ Approved' },
          { id: MODERATION_STATUS.REJECTED, label: '✕ Rejected' },
          { id: 'all', label: 'All Items' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`filter-tab ${filter === tab.id ? 'active' : ''}`}
            onClick={() => setFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="review-items-list">
        {filteredItems.length === 0 ? (
          <div className="empty-review-card">
            <p>No contributions found in this moderation state.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const contentText = typeof item.content === 'object'
              ? (item.content.en || Object.values(item.content)[0])
              : String(item.content);

            return (
              <div key={item.knowledgeId} className={`review-card status-${item.verificationStatus}`}>
                <div className="review-card-header">
                  <div>
                    <span className={`badge-pill badge-${item.verificationStatus}`}>
                      {item.verificationStatus.toUpperCase()}
                    </span>
                    <span className="source-tag">{item.sourceType}</span>
                    <span className="place-tag">📍 {item.placeId}</span>
                  </div>
                  <small className="timestamp">
                    {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'System Seed'}
                  </small>
                </div>

                <div className="review-card-body">
                  <h4 className="review-title">{item.title || 'Untitled Contribution'}</h4>
                  <p className="review-content-text">"{contentText}"</p>
                  
                  <div className="review-metadata">
                    {item.submittedBy && <span><b>Submitted By:</b> {item.submittedBy}</span>}
                    {item.reviewer && <span><b>Reviewed By:</b> {item.reviewer}</span>}
                    <span><b>Visibility:</b> {item.visibility}</span>
                  </div>
                </div>

                <div className="review-card-actions">
                  {item.verificationStatus !== MODERATION_STATUS.APPROVED && (
                    <button
                      type="button"
                      className="btn-approve"
                      onClick={() => handleAction(item.knowledgeId, MODERATION_STATUS.APPROVED)}
                    >
                      ✓ Approve for Passengers
                    </button>
                  )}

                  {item.verificationStatus !== MODERATION_STATUS.REJECTED && (
                    <button
                      type="button"
                      className="btn-reject"
                      onClick={() => handleAction(item.knowledgeId, MODERATION_STATUS.REJECTED)}
                    >
                      ✕ Reject
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
