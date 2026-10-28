import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { 
  FileText, 
  LogOut, 
  Shield, 
  User, 
  BookOpen, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  PlusCircle,
  FolderKanban
} from 'lucide-react';
import { INSTITUTION, COORDINATOR } from '../config/constants';
import { GuidelinesModal } from '../components/GuidelinesModal';

export const RootLayout: React.FC = () => {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Institutional & E-Cell Notification Bar */}
      <div
        style={{
          backgroundColor: '#07111e',
          color: '#cbd5e1',
          fontSize: '0.78125rem',
          padding: '7px 0',
          borderBottom: '1px solid #1e293b',
          letterSpacing: '0.01em',
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'rgba(217, 119, 6, 0.18)',
                color: '#f59e0b',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                border: '1px solid rgba(245, 158, 11, 0.35)',
              }}
            >
              <Sparkles size={11} />
              E-CELL MUJ INNOVATION ZONE
            </span>
            <span style={{ color: '#94a3b8' }}>
              {INSTITUTION.NAME} • {INSTITUTION.DEPARTMENTS.IPR_CELL}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              onClick={() => setIsGuidelinesOpen(true)}
              style={{
                background: 'transparent',
                color: '#38bdf8',
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 6px',
                borderRadius: '4px',
                transition: 'all 0.15s ease',
              }}
              className="hover:underline"
            >
              <BookOpen size={13} />
              <span>IPR &amp; Patent Filing Rules</span>
            </button>

            {currentUser ? (
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                Signed in: <strong style={{ color: '#f1f5f9' }}>{currentUser.full_name}</strong>
              </span>
            ) : (
              <Link
                to="/login"
                style={{
                  color: '#38bdf8',
                  fontSize: '0.75rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                Sign In <ChevronRight size={12} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Official Header */}
      <header
        className="site-header"
        style={{
          backgroundColor: '#0a192f',
          borderBottom: '2px solid #1e3a8a',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div className="container">
          <div className="header-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            {/* E-Cell MUJ Brand Logo & Title */}
            <Link
              to="/"
              className="brand-wrapper"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  backgroundColor: '#1e3a8a',
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
                  border: '1.5px solid #38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                  boxShadow: '0 2px 8px rgba(56, 189, 248, 0.25)',
                }}
              >
                <FileText size={22} />
              </div>
              <div className="brand-text-block">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      color: '#ffffff',
                      letterSpacing: '0.02em',
                    }}
                  >
                    E-CELL MUJ
                  </span>
                  <span
                    style={{
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '3px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    PATENT ZONE
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.2, marginTop: '2px' }}>
                  Directorate of Research &amp; IPR Cell • Manipal University Jaipur
                </div>
              </div>
            </Link>

            {/* Navigation Bar (Role-Aware, No Redundant Links) */}
            <nav className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Student Navigation */}
              {currentUser?.role === 'student' && (
                <>
                  <Link
                    to="/dashboard"
                    className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      color: location.pathname === '/dashboard' ? '#ffffff' : '#cbd5e1',
                      backgroundColor: location.pathname === '/dashboard' ? '#1e293b' : 'transparent',
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: location.pathname === '/dashboard' ? '1px solid #334155' : '1px solid transparent',
                    }}
                  >
                    <FolderKanban size={15} />
                    My Disclosures
                  </Link>
                  <Link
                    to="/applications/new"
                    className={`nav-item ${location.pathname === '/applications/new' ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      color: '#ffffff',
                      backgroundColor: '#2563eb',
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
                    }}
                  >
                    <PlusCircle size={15} />
                    New Patent Disclosure
                  </Link>
                </>
              )}

              {/* Coordinator Admin Navigation */}
              {currentUser?.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  className={`nav-item ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    color: '#ffffff',
                    backgroundColor: '#0d9488',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    boxShadow: '0 2px 6px rgba(13, 148, 136, 0.3)',
                  }}
                >
                  <Shield size={15} />
                  Coordinator Review Docket &amp; Queue
                </Link>
              )}

              {/* Super Admin Navigation */}
              {currentUser?.role === 'super_admin' && (
                <Link
                  to="/superadmin/dashboard"
                  className={`nav-item ${location.pathname.startsWith('/superadmin') ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    color: '#ffffff',
                    backgroundColor: '#7c3aed',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)',
                  }}
                >
                  <Shield size={15} />
                  Portal Governance &amp; Users
                </Link>
              )}
            </nav>

            {/* User Session Chip / Actions */}
            <div className="nav-user-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {currentUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {currentUser.role === 'super_admin' ? (
                      <Shield size={16} color="#c084fc" />
                    ) : currentUser.role === 'admin' ? (
                      <Shield size={16} color="#2dd4bf" />
                    ) : (
                      <User size={16} color="#38bdf8" />
                    )}
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.8125rem', lineHeight: 1.2 }}>
                        {currentUser.full_name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color:
                            currentUser.role === 'super_admin'
                              ? '#c084fc'
                              : currentUser.role === 'admin'
                              ? '#2dd4bf'
                              : '#94a3b8',
                          fontWeight: 500,
                        }}
                      >
                        {currentUser.role === 'super_admin'
                          ? 'Super Admin (IT Governance)'
                          : currentUser.role === 'admin'
                          ? 'IPR Coordinator (Dorelal Ji)'
                          : 'Student Applicant'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="btn btn-outline btn-sm"
                    style={{
                      color: '#ef4444',
                      borderColor: 'rgba(239, 68, 68, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.78125rem',
                      padding: '6px 12px',
                    }}
                    title="Sign Out of Portal"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Link
                    to="/login"
                    className="btn btn-primary btn-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 16px',
                      fontWeight: 600,
                    }}
                  >
                    <User size={14} />
                    Portal Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Application Content */}
      <main className="main-content" style={{ flex: '1 0 auto', paddingBottom: '40px' }}>
        <Outlet />
      </main>

      {/* Statutory Guidelines Modal */}
      <GuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />

      {/* Enhanced E-Cell MUJ Institutional Footer */}
      <footer
        className="site-footer"
        style={{
          backgroundColor: '#07111e',
          color: '#cbd5e1',
          borderTop: '2px solid #1e3a8a',
          padding: '36px 0 24px',
          marginTop: 'auto',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '28px',
              paddingBottom: '28px',
              borderBottom: '1px solid #1e293b',
            }}
          >
            {/* Col 1: E-Cell MUJ & Directorate Collaboration */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  E-CELL MUJ
                </div>
                <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem' }}>
                  Patent &amp; IPR Zone
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94a3b8', lineHeight: 1.6 }}>
                Engineered &amp; deployed by the <strong>Entrepreneurship Cell (E-Cell MUJ)</strong> in strategic partnership with the <strong>Directorate of Research &amp; IPR Cell</strong>, Manipal University Jaipur.
              </p>
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }}
                >
                  Patents Act 1970 Compliant
                </span>
                <span
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }}
                >
                  First-to-File Shielded
                </span>
              </div>
            </div>

            {/* Col 2: Institutional Governance */}
            <div>
              <h4 style={{ color: '#f8fafc', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Institutional Governance
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8125rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsGuidelinesOpen(true)}
                    style={{ background: 'none', border: 'none', padding: 0, color: '#38bdf8', cursor: 'pointer', textAlign: 'left', fontSize: '0.8125rem' }}
                  >
                    • Statutory Invention Disclosure Guidelines
                  </button>
                </li>
                <li>
                  <a
                    href="https://ipindia.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    • Indian Patent Office (CGPDTM) <ExternalLink size={11} />
                  </a>
                </li>
                <li>
                  <a
                    href={INSTITUTION.WEBSITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    • Manipal University Jaipur Official Portal <ExternalLink size={11} />
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: IPR Cell & Support Contacts */}
            <div>
              <h4 style={{ color: '#f8fafc', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Coordination &amp; Support
              </h4>
              <div style={{ fontSize: '0.8125rem', color: '#94a3b8', lineHeight: 1.6 }}>
                <div>
                  <strong>Patent Coordinator:</strong> {COORDINATOR.FULL_NAME}
                </div>
                <div>
                  <strong>Direct Desk:</strong>{' '}
                  <a href={`mailto:${COORDINATOR.EMAIL}`} style={{ color: '#38bdf8', textDecoration: 'none' }}>
                    {COORDINATOR.EMAIL}
                  </a>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <strong>E-Cell MUJ Tech Support:</strong>{' '}
                  <a href={`mailto:${INSTITUTION.CONTACT_EMAIL}`} style={{ color: '#38bdf8', textDecoration: 'none' }}>
                    {INSTITUTION.CONTACT_EMAIL}
                  </a>
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                  Dehmi Kalan, Jaipur-Ajmer Expressway, Rajasthan 303007
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Verification Line */}
          <div
            style={{
              paddingTop: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '0.75rem',
              color: '#64748b',
            }}
          >
            <div>
              &copy; {new Date().getFullYear()} Manipal University Jaipur. All Rights Reserved. Conceptualized &amp; Developed by <strong>E-Cell MUJ</strong>.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span>Version 2.4-Production</span>
              <span>•</span>
              <span>Confidential Invention Repository</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RootLayout;
