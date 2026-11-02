import React from 'react';
import { IconListen, IconPause, IconPlay } from './Icons.jsx';

export function ListenButton({
  isPlaying = false,
  isPaused = false,
  onClick,
  label,
  className = '',
  disabled = false
}) {
  let displayLabel = label;
  if (!displayLabel) {
    if (isPlaying && !isPaused) {
      displayLabel = 'PLAYING GUIDE...';
    } else if (isPaused) {
      displayLabel = 'CONTINUE LISTENING';
    } else {
      displayLabel = 'LISTEN TO GUIDE';
    }
  }

  const renderIcon = () => {
    if (isPlaying && !isPaused) {
      return <IconPause size={22} />;
    } else if (isPaused) {
      return <IconPlay size={20} />;
    }
    return <IconListen size={22} />;
  };

  return (
    <button
      type="button"
      className={`btn-listen-primary ${isPlaying && !isPaused ? 'playing' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={displayLabel}
    >
      <span className="listen-icon-wrap" aria-hidden="true">
        {renderIcon()}
      </span>
      <span className="listen-text-label">{displayLabel}</span>
      {isPlaying && !isPaused && (
        <span className="audio-sound-wave" aria-hidden="true">
          <span className="bar bar-1" />
          <span className="bar bar-2" />
          <span className="bar bar-3" />
        </span>
      )}
    </button>
  );
}
