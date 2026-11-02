import React from 'react';
import { IconBrandMark } from './Icons.jsx';

export function BrandLogo({ variant = 'header', onClick, className = '' }) {
  const isFull = variant === 'full' || variant === 'landing';
  const isHero = variant === 'welcome';

  return (
    <div
      className={`brand-logo-container brand-${variant} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <IconBrandMark size={isFull ? 56 : isHero ? 48 : 34} />
      <div className="brand-text-block">
        <span className="brand-title">MALAYSIA</span>
        <span className="brand-subtitle">AI TOUR GUIDE</span>
        {isFull && <span className="brand-tagline">Your journey. More understanding.</span>}
      </div>
    </div>
  );
}
