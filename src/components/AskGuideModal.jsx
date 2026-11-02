import React, { useState } from 'react';
import { getTranslation } from '../lib/i18n.js';

export function AskGuideModal({ currentStop, tour, language, onClose }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const t = (k) => getTranslation(language, k);

  const sampleQuestionsByLang = {
    en: [
      'What are the most popular photo spots here?',
      'What local food or snacks should I try nearby?',
      'What is the dress code or cultural etiquette here?'
    ],
    zh: [
      '这里最佳的拍照取景点在哪里？',
      '这附近有什么必吃的地道美食或小吃？',
      '参观这里有什么着装要求或文化礼仪？'
    ],
    ms: [
      'Di manakah tempat bergambar paling menarik di sini?',
      'Apakah makanan atau snek tempatan yang patut dicuba berdekatan?',
      'Apakah etika pakaian atau pantang larang semasa melawat?'
    ],
    ja: [
      'ここでおすすめの写真撮影スポットはどこですか？',
      '周辺で試すべき名物グルメやスナックは何ですか？',
      '訪問時の服装規定やマナーを教えてください。'
    ],
    ko: [
      '이곳의 가장 멋진 포토존은 어디인가요?',
      '근처에서 꼭 맛봐야 할 로컬 음식이나 간식은 무엇인가요?',
      '방문 시 복장 규정이나 지켜야 할 예절이 있나요?'
    ]
  };

  const samplePrompts = sampleQuestionsByLang[language] || sampleQuestionsByLang.en;

  async function handleAsk(qText) {
    const query = (qText || question).trim();
    if (!query) return;

    setLoading(true);
    setError(null);
    setAnswer('');
    if (qText) setQuestion(qText);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          place: currentStop?.name || 'General Malaysia Tour',
          placeId: currentStop?.placeId || null,
          tourId: tour?.tourId || 'kl-putrajaya-melaka-day-tour',
          language
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to query guide.');
      }
      setAnswer(data.answer || 'No response returned from the guide.');
    } catch (err) {
      setError(err.message || 'The AI guide server could not be reached.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        
        <div className="sheet-header">
          <div>
            <small className="sheet-tag">AI LIVE ASSISTANT</small>
            <h2>{t('askGuide')}</h2>
            <p className="sheet-subtitle">
              📍 {currentStop?.name || 'Malaysia Journey'}
            </p>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="quick-questions">
          <small className="quick-label">SUGGESTED QUESTIONS</small>
          <div className="quick-list">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className="quick-chip"
                onClick={() => handleAsk(prompt)}
              >
                💬 {prompt}
              </button>
            ))}
          </div>
        </div>

        <form
          className="ask-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
        >
          <div className="ask-input-row">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t('askGuidePlaceholder')}
              className="ask-input"
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="btn-primary ask-submit-btn"
            >
              {loading ? t('asking') : t('askBtn')}
            </button>
          </div>
        </form>

        {loading && (
          <div className="answer-card loading-state">
            <span className="pulse-spinner" />
            <p>{t('asking')}</p>
          </div>
        )}

        {error && (
          <div className="answer-card error-state">
            <p>⚠️ {error}</p>
          </div>
        )}

        {answer && (
          <div className="answer-card success-state">
            <div className="answer-header">
              <span className="guide-avatar">🇲🇾</span>
              <b>Guide Assistant</b>
            </div>
            <p className="answer-text">{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
