import React from 'react';

export function StatusBadge({ type = 'approaching', label, className = '' }) {
  // Map types to standardized class & default text
  const badgeConfig = {
    approaching: {
      cssClass: 'badge-approaching',
      defaultLabel: 'APPROACHING'
    },
    verified: {
      cssClass: 'badge-verified',
      defaultLabel: 'VERIFIED INFO'
    },
    local: {
      cssClass: 'badge-local',
      defaultLabel: 'LOCAL INSIGHT'
    },
    next: {
      cssClass: 'badge-next',
      defaultLabel: 'NEXT STOP'
    },
    partner: {
      cssClass: 'badge-partner',
      defaultLabel: 'PARTNER / RECOMMENDATION'
    },
    contribution: {
      cssClass: 'badge-contribution',
      defaultLabel: 'PASSENGER CONTRIBUTION'
    }
  };

  const config = badgeConfig[type] || badgeConfig.approaching;
  const text = label || config.defaultLabel;

  return (
    <span className={`status-badge-pill ${config.cssClass} ${className}`}>
      {text}
    </span>
  );
}
