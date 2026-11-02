import React from 'react';
import { BrandLogo } from './BrandLogo.jsx';
import { IconMenu } from './Icons.jsx';

export function AppHeader({ onHome, onOpenMenu, title, metaBadge, rightAction }) {
  return (
    <header className="app-header-shell" role="banner">
      <div className="header-left-slot">
        <BrandLogo variant="header" onClick={onHome} />
      </div>

      {title && (
        <div className="header-center-slot">
          <span className="header-title-text">{title}</span>
          {metaBadge && <span className="header-meta-badge">{metaBadge}</span>}
        </div>
      )}

      <div className="header-right-slot">
        {rightAction ? (
          rightAction
        ) : onOpenMenu ? (
          <button
            type="button"
            className="btn-header-menu"
            onClick={onOpenMenu}
            aria-label="Open Navigation Menu"
          >
            <IconMenu size={22} />
          </button>
        ) : null}
      </div>
    </header>
  );
}
