import React, { useState } from 'react';
import { getTranslation } from '../lib/i18n.js';
import { getGroundedKnowledgeText } from '../data/knowledge.js';
import { IconSend, IconClose, IconAsk } from './common/Icons.jsx';

export function AskGuideModal({ currentStop, tour, language, onClose }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const t = (k) => getTranslation(language, k);

  const sampleQuestionsByLang = {
    en: [
      `What is the history of ${currentStop?.name || 'this landmark'}?`,
      'What local food or snacks should I try nearby?',
      'What is the dress code or visitor etiquette here?',
      'What are the best photo angles?'
    ],
    zh: [
      `关于${currentStop?.name || '这里'}有什么历史故事？`,
      '这附近有什么必吃的地道美食或小吃？',
      '参观这里有什么着装要求或文化礼仪？',
      '有哪些绝佳的拍照取景角度？'
    ],
    ms: [
      `Apakah sejarah di sebalik ${currentStop?.name || 'tempat ini'}?`,
      'Apakah makanan atau snek tempatan yang patut dicuba berdekatan?',
      'Apakah etika pakaian atau pantang larang semasa melawat?',
      'Di manakah tempat bergambar paling menarik?'
    ],
    ja: [
      `${currentStop?.name || 'ここ'}の歴史や背景を教えてください。`,
      '周辺で試すべき名物グルメやスナックは何ですか？',
      '訪問時の服装規定やマナーを教えてください。',
      'おすすめの写真撮影スポットはどこですか？'
    ],
    ko: [
      `${currentStop?.name || '이곳'}의 역사와 배경은 무엇인가요?`,
      '근처에서 꼭 맛봐야 할 로컬 음식이나 간식은 무엇인가요?',
      '방문 시 복장 규정이나 지켜야 할 예절이 있나요?',
      '가장 멋진 사진 촬영 포인트는 어디인가요?'
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

    const knowledgeContext = currentStop?.placeId
      ? getGroundedKnowledgeText(currentStop.placeId, language)
      : '';

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          place: currentStop?.name || 'General Malaysia Tour',
          placeId: currentStop?.placeId || null,
          tourId: tour?.tourId || 'kl-putrajaya-melaka-day-tour',
          language,
          knowledgeContext
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
    <div className="modal-backdrop-shell" onClick={onClose}>
      <div className="ask-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-sheet-dragger" />

        <div className="modal-sheet-header">
          <div className="header-info-group">
            <h2 className="modal-title">{t('askGuide')}</h2>
            <p className="modal-subtitle">
              Curious about what you're seeing? Ask anything.
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

        {/* Suggested Question Chips */}
        <div className="suggested-questions-scroll">
          <span className="suggested-chips-heading">SUGGESTED QUESTIONS</span>
          <div className="chips-row">
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className="guide-question-chip"
                onClick={() => handleAsk(prompt)}
              >
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Responses Display */}
        <div className="ask-chat-output-area">
          {loading && (
            <div className="guide-response-card loading">
              <span className="response-spinner" />
              <p>Consulting Malaysian cultural archives...</p>
            </div>
          )}

          {error && (
            <div className="guide-response-card error">
              <p>⚠️ {error}</p>
            </div>
          )}

          {answer && (
            <div className="guide-response-card success">
              <div className="guide-response-header">
                <span className="guide-badge-pill">🇲🇾 Vetted Knowledge</span>
              </div>
              <p className="guide-answer-text">{answer}</p>
            </div>
          )}
        </div>

        {/* Question Input Field */}
        <form
          className="ask-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
        >
          <div className="ask-pill-input-box">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="ask-pill-text-input"
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="btn-send-question"
              aria-label="Send question"
            >
              <IconSend size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
