import React from 'react';
import { IconLiveTour, IconJourney, IconAsk, IconMenu } from './Icons.jsx';

export function BottomNav({ activeTab = 'live', onTabSelect }) {
  const tabs = [
    { id: 'live', label: 'Live Tour', icon: IconLiveTour },
    { id: 'journey', label: 'Journey', icon: IconJourney },
    { id: 'ask', label: 'Ask', icon: IconAsk },
    { id: 'more', label: 'More', icon: IconMenu }
  ];

  return (
    <nav className="bottom-nav-shell" aria-label="Passenger Navigation">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onTabSelect(tab.id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="bottom-nav-icon-wrap">
              <IconComponent size={22} />
            </span>
            <span className="bottom-nav-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
