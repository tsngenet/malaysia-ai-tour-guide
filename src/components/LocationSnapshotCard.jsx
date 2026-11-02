import React, { useState } from 'react';
import { getTranslation } from '../lib/i18n.js';
import { JOURNEY_STATUS } from '../lib/journeyEngine.js';
import { getStaticLocationVisual } from '../lib/staticMapProvider.js';
import { StatusBadge } from './common/StatusBadge.jsx';
import { ListenButton } from './common/ListenButton.jsx';
import { IconMapPin, IconAsk } from './common/Icons.jsx';

export function LocationSnapshotCard({
  attraction,
  currentStatus,
  distanceMeters,
  isGpsActive,
  language = 'en',
  speechState = { isPlaying: false, isPaused: false },
  onListen,
  onAskAi,
  onViewPlace
}) {
  const [imageError, setImageError] = useState(false);
  const t = (k) => getTranslation(language, k);

  if (!attraction) return null;

  const attractionName = attraction.name || 'Malaysia Landmark';
  const coords = attraction.coordinates || null;
  const heroVisual = attraction.heroVisual || {
    type: 'satellite',
    imageUrl: '',
    fallbackUrl: '',
    alt: `Visual snapshot of ${attractionName}`,
    attribution: '',
    focalPoint: 'center'
  };

  // 1. Resolve image source: static map provider -> heroVisual.imageUrl -> fallback
  const staticMapUrl = coords
    ? getStaticLocationVisual({
        latitude: coords.lat,
        longitude: coords.lng,
        zoom: 16,
        width: 640,
        height: 360,
        mapType: heroVisual.type === 'photo' ? 'roadmap' : 'satellite',
        markerLabel: attractionName
      })
    : null;

  const candidateImageUrl = staticMapUrl || heroVisual.imageUrl || null;
  const showImage = Boolean(candidateImageUrl && !imageError);

  // 2. Format distance
  const distanceFormatted = distanceMeters !== null && distanceMeters !== undefined
    ? (distanceMeters < 1000
        ? `${Math.round(distanceMeters)} m away`
        : `${(distanceMeters / 1000).toFixed(1)} km away`)
    : null;

  // 3. Map status to badge type
  let badgeType = 'approaching';
  let badgeLabel = 'APPROACHING';

  if (currentStatus === JOURNEY_STATUS.HERE) {
    badgeType = 'verified';
    badgeLabel = 'YOU ARE HERE';
  } else if (currentStatus === JOURNEY_STATUS.APPROACHING) {
    badgeType = 'approaching';
    badgeLabel = 'APPROACHING';
  } else if (currentStatus === JOURNEY_STATUS.VISITED || currentStatus === JOURNEY_STATUS.COMPLETED) {
    badgeType = 'local';
    badgeLabel = 'VISITED';
  } else if (currentStatus === JOURNEY_STATUS.UPCOMING && distanceMeters !== null) {
    badgeType = 'next';
    badgeLabel = 'UPCOMING';
  } else {
    badgeType = 'approaching';
    badgeLabel = 'APPROACHING';
  }

  const isAudioPlaying = speechState.isPlaying && !speechState.isPaused;
  const isAudioPaused = speechState.isPaused;

  return (
    <article className="location-snapshot-card" aria-label={`Location card for ${attractionName}`}>
      {/* 1. Visual Postcard Media */}
      <div className="snapshot-visual-container">
        {showImage ? (
          <img
            src={candidateImageUrl}
            alt={heroVisual.alt || `Visual of ${attractionName}`}
            className="snapshot-media"
            style={{ objectPosition: heroVisual.focalPoint || 'center' }}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          /* Polished Topographic Neutral Fallback */
          <div className="snapshot-fallback-graphic" role="img" aria-label={`Location graphic for ${attractionName}`}>
            <svg
              className="topographic-pattern"
              viewBox="0 0 400 225"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="neutralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1F1F1F" />
                  <stop offset="50%" stopColor="#2D2D2D" />
                  <stop offset="100%" stopColor="#1A1A1A" />
                </linearGradient>
                <pattern id="dotPattern" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="12" cy="12" r="1.5" fill="rgba(255,255,255,0.06)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#neutralGrad)" />
              <rect width="100%" height="100%" fill="url(#dotPattern)" />
              <path
                d="M -20,130 Q 80,70 180,120 T 380,90 T 450,150"
                fill="none"
                stroke="rgba(244, 180, 0, 0.28)"
                strokeWidth="2.5"
              />
              <path
                d="M -30,170 Q 90,120 200,170 T 400,140"
                fill="none"
                stroke="rgba(200, 16, 46, 0.3)"
                strokeWidth="2"
              />
              <circle cx="200" cy="112" r="48" fill="none" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
              <circle cx="200" cy="112" r="12" fill="rgba(200, 16, 46, 0.4)" />
            </svg>
          </div>
        )}

        <div className="snapshot-vignette-overlay" aria-hidden="true" />

        {/* Top Badges */}
        <div className="snapshot-top-badges">
          <StatusBadge type={badgeType} label={badgeLabel} />
          {heroVisual.type && (
            <span className="snapshot-type-tag">
              {heroVisual.type === 'satellite' ? '🛰️ Satellite' : heroVisual.type === 'aerial' ? '🚁 Aerial' : '📷 Photo'}
            </span>
          )}
        </div>

        {/* Attribution Badge */}
        {heroVisual.attribution && (
          <div className="snapshot-attribution-tag">
            <small>{heroVisual.attribution}</small>
          </div>
        )}
      </div>

      {/* 2. Destination Details */}
      <div className="snapshot-content-body">
        <div className="snapshot-header-block">
          <h2 className="snapshot-place-name">{attractionName}</h2>
          <div className="snapshot-distance-row">
            <IconMapPin size={16} />
            <span>{distanceFormatted || (isGpsActive ? 'Locating position...' : 'Approaching Attraction')}</span>
            {isGpsActive && <span className="gps-live-dot" title="GPS Active" />}
          </div>
        </div>

        {/* Short Approved Description */}
        {attraction.shortIntro && (
          <p className="snapshot-description">{attraction.shortIntro}</p>
        )}

        {/* Large Listen Button (Dominating Primary Control) */}
        <div className="snapshot-listen-row">
          <ListenButton
            isPlaying={isAudioPlaying}
            isPaused={isAudioPaused}
            onClick={onListen}
          />
        </div>

        {/* Secondary Actions Row */}
        <div className="snapshot-secondary-actions">
          <button
            type="button"
            className="btn-action-ask-guide"
            onClick={onAskAi}
            aria-label={t('askGuide')}
          >
            <IconAsk size={18} />
            <span>{t('askGuide')}</span>
          </button>

          {attraction.placeId && onViewPlace && (
            <button
              type="button"
              className="btn-action-view-place"
              onClick={() => onViewPlace(attraction.placeId)}
              aria-label={`${t('viewPlace')}: ${attractionName}`}
            >
              <span>{t('viewPlace')} →</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
