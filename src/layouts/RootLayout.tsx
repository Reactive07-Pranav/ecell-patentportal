import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import {
  LogOut,
  Settings,
  ChevronRight,
  ShieldCheck,
  Shield,
} from 'lucide-react';
import { INSTITUTION, COORDINATOR } from '../config/constants';
import { GuidelinesModal } from '../components/GuidelinesModal';

/* --- Logo helpers -------------------------------------------------------- */

function useLogo(src: string): boolean {
  const [ok, setOk] = React.useState(false);
  React.useEffect(() => {
    const img = new Image();
    img.onload = () => setOk(true);
    img.onerror = () => setOk(false);
    img.src = src;
  }, [src]);
  return ok;
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const MujLogo: React.FC<{ height?: number }> = ({ height = 52 }) => {
  const ok = useLogo('/assets/muj-logo-transparent.png');
  if (ok) {
    return (
      <img
        src="/assets/muj-logo-transparent.png"
        alt="Manipal University Jaipur"
        style={{ height, width: 'auto', objectFit: 'contain', display: 'block' }}
      />
    );
  }
  return (
    <div
      className="portal-logo-placeholder"
      style={{ height }}
      aria-label="Manipal University Jaipur"
    >
      MUJ
    </div>
  );
};

const EcellLogo: React.FC<{ height?: number }> = ({ height = 52 }) => {
  const ok = useLogo('/assets/muj-ecell-logo.png');
  if (ok) {
    return (
      <img
        src="/assets/muj-ecell-logo.png"
        alt="MUJ E-Cell"
        style={{ height, width: 'auto', objectFit: 'contain', display: 'block' }}
      />
    );
  }
  return (
    <div
      className="portal-logo-placeholder"
      style={{ height }}
      aria-label="MUJ E-Cell"
    >
      E-CELL
    </div>
  );
};

/* --- Admin / Super Admin layout ------------------------------------------ */

export const RootLayout: React.FC = () => {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const roleLabel =
    currentUser?.role === 'super_admin'
      ? 'Super Administrator'
      : currentUser?.role === 'admin'
        ? 'Administrator'
        : 'Student Applicant';

  return (
    <div className="portal portal-admin">
      {/* Header */}
      <header className="portal-header" role="banner">
        <div className="portal-header-inner">
          <Link
            to="/"
            className="portal-logo-group"
            aria-label="MUJ Patent Portal home"
            style={{ textDecoration: 'none' }}
          >
            <MujLogo height={52} />
            <span className="portal-logo-divider" aria-hidden="true" />
            <EcellLogo height={52} />
          </Link>

          <div className="portal-user-chip">
            {currentUser ? (
              <>
                <div className="portal-avatar" aria-hidden="true">
                  {initials(currentUser.full_name || 'U')}
                </div>
                <div>
                  <div className="portal-user-name">{currentUser.full_name}</div>
                  <div className="portal-user-role">{roleLabel}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGuidelinesOpen(true)}
                  aria-label="IPR guidelines and help"
                  title="IPR & Patent Filing Rules"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    padding: '6px',
                    borderRadius: '4px',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#0F172A')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                >
                  <Settings size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="btn btn-outline btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.8125rem',
                    color: '#ef4444',
                    borderColor: 'rgba(239,68,68,0.35)',
                  }}
                  title="Sign out"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="btn btn-sm"
                style={{
                  backgroundColor: 'var(--portal-subnav)',
                  color: '#fff',
                  borderColor: 'var(--portal-subnav)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                Sign In <ChevronRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Sub-nav */}
      <nav className="portal-subnav" aria-label="Portal navigation">
        <div className="portal-subnav-inner">
          <ul className="portal-subnav-links" role="list">
            {currentUser?.role === 'admin' && (
              <li>
                <Link
                  to="/admin/dashboard"
                  className={
                    'portal-subnav-link' +
                    (location.pathname.startsWith('/admin') ? ' active' : '')
                  }
                  aria-current={
                    location.pathname.startsWith('/admin') ? 'page' : undefined
                  }
                >
                  <ShieldCheck size={14} aria-hidden="true" />
                  Review Docket
                </Link>
              </li>
            )}

            {currentUser?.role === 'super_admin' && (
              <li>
                <Link
                  to="/superadmin/dashboard"
                  className={
                    'portal-subnav-link' +
                    (location.pathname.startsWith('/superadmin') ? ' active' : '')
                  }
                  aria-current={
                    location.pathname.startsWith('/superadmin') ? 'page' : undefined
                  }
                >
                  <Shield size={14} aria-hidden="true" />
                  Portal Governance
                </Link>
              </li>
            )}

</ul>
          <span className="portal-subnav-date">{todayLabel}</span>
        </div>
      </nav>

      {/* Main content */}
      <main className="portal-main" id="main-content">
        <Outlet />
      </main>

      {/* Statutory Guidelines Modal */}
      <GuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />

      {/* Footer */}
      <footer className="portal-footer" role="contentinfo">
        <div className="portal-footer-inner">
          <EcellLogo height={40} />
          <p className="portal-footer-text" style={{ margin: 0 }}>
            &copy; {new Date().getFullYear()} {INSTITUTION.NAME}. All rights reserved.
            Developed by <strong>E-Cell MUJ</strong> in partnership with the{' '}
            <strong>{INSTITUTION.DEPARTMENTS.IPR_CELL}</strong>.
          </p>
          <p className="portal-footer-text" style={{ margin: 0 }}>
            Patent enquiries:{' '}
            <a href={`mailto:${COORDINATOR.EMAIL}`} style={{ color: 'var(--portal-blue)' }}>
              {COORDINATOR.EMAIL}
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RootLayout;
