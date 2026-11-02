import React from 'react';
import { StatusBadge } from './StatusBadge.jsx';
import { IconMapPin, IconArrowRight } from './Icons.jsx';

export function NextStopCard({ nextStop, distanceMeters, onClick, className = '' }) {
  if (!nextStop) return null;

  const distanceFormatted = distanceMeters !== null && distanceMeters !== undefined
    ? (distanceMeters < 1000
        ? `${Math.round(distanceMeters)} m away`
        : `${(distanceMeters / 1000).toFixed(1)} km away`)
    : null;

  const thumbnail = nextStop.heroVisual?.imageUrl || null;

  return (
    <div
      className={`next-stop-card-shell ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Next stop: ${nextStop.name}`}
    >
      <div className="next-stop-thumb-wrap">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={nextStop.name}
            className="next-stop-thumb-img"
            loading="lazy"
          />
        ) : (
          <div className="next-stop-thumb-placeholder">
            <IconMapPin size={22} />
          </div>
        )}
      </div>

      <div className="next-stop-info-body">
        <div className="next-stop-badge-row">
          <StatusBadge type="next" label="NEXT STOP" />
        </div>
        <h4 className="next-stop-name">{nextStop.name}</h4>
        {distanceFormatted && (
          <span className="next-stop-distance">
            <IconMapPin size={13} />
            <span>{distanceFormatted}</span>
          </span>
        )}
      </div>

      <div className="next-stop-arrow-wrap" aria-hidden="true">
        <IconArrowRight size={18} />
      </div>
    </div>
  );
}
