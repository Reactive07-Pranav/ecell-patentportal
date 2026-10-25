import React from "react";

export const PortalHero: React.FC<{ heading: string; subtitle: string; className?: string }> = ({ heading, subtitle, className = '' }) => (
  <div className={`portal-hero ${className}`.trim()} role="region" aria-label="MUJ Patent Portal welcome banner">
    <div className="portal-hero-photo-wrapper" aria-hidden="true">
      <img src="/assets/muj-campus-night.jpg" alt="" loading="eager" width="600" height="688" className="portal-hero-bg" />
    </div>
    <div className="portal-hero-overlay" aria-hidden="true" />
    <div className="portal-hero-content">
      <h1 className="portal-hero-text">{heading}</h1>
      <p className="portal-hero-sub">{subtitle}</p>
    </div>
  </div>
);
