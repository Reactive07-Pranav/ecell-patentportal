import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  Building,
  Phone,
  Hash,
  Sparkles,
} from 'lucide-react';
import { COORDINATOR, INSTITUTION } from '../config/constants';
import mujLogo from '../assets/muj-logo.png';
import ecellLogo from '../assets/ecell-logo.png';

const DOMAIN = 'muj.manipal.edu';
const fullEmail = (u: string) => {
  const v = u.trim();
  return v.includes('@') ? v : `${v}@${DOMAIN}`;
};

export const LoginPage: React.FC = () => {
  const { signInWithEmail, registerUniversityAccount, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tab, setTab] = useState<'signin' | 'register'>('signin');
  const [showPwd, setShowPwd] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [regUser, setRegUser] = useState('');
  const [regName, setRegName] = useState('');
  const [regDept, setRegDept] = useState('');
  const [regNo, setRegNo] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPwd, setRegPwd] = useState('');
  const [regPwd2, setRegPwd2] = useState('');

  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  React.useEffect(() => {
    if (currentUser) {
      const from = (location.state as any)?.from?.pathname;
      const dest =
        from && from !== '/' && from !== '/login' && from !== '/auth/login'
          ? from
          : currentUser.role === 'super_admin'
          ? '/superadmin/dashboard'
          : currentUser.role === 'admin'
          ? '/admin/dashboard'
          : '/dashboard';
      navigate(dest, { replace: true });
    }
  }, [currentUser, navigate, location]);

  const fillDemo = (u: string, p: string = 'password123') => {
    setUsername(u);
    setPassword(p);
    setErr(null);
  };

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(null);
    if (!username.trim()) {
      setErr('Please enter your username.');
      return;
    }
    const email = fullEmail(username);
    setBusy(true);
    const r = await signInWithEmail(email, password);
    setBusy(false);
    if (r.error) {
      setErr(r.error);
      return;
    }
    setOk('Identity verified. Redirecting…');
    const c = email.toLowerCase();
    const sa = c === 'superadmin@muj.manipal.edu' || c === 'it.admin@muj.manipal.edu';
    const ad =
      !sa &&
      (c === COORDINATOR.EMAIL.toLowerCase() ||
        c.includes('admin') ||
        c.includes('coord') ||
        c === 'patent.admin@muj.manipal.edu');
    setTimeout(() => {
      navigate(sa ? '/superadmin/dashboard' : ad ? '/admin/dashboard' : '/dashboard', { replace: true });
    }, 300);
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(null);
    if (regPwd !== regPwd2) {
      setErr('Passwords do not match.');
      return;
    }
    if (regPwd.length < 6) {
      setErr('Password must be at least 6 characters.');
      return;
    }
    const email = fullEmail(regUser);
    setBusy(true);
    const r = await registerUniversityAccount({
      email,
      password: regPwd,
      fullName: regName,
      department: regDept,
      registrationNumber: regNo,
      phone: regPhone,
    });
    setBusy(false);
    if (r.error) {
      setErr(r.error);
      return;
    }
    setOk('Registered successfully! Redirecting…');
    setTimeout(() => navigate('/dashboard', { replace: true }), 400);
  };

  return (
    <div style={S.page}>
      <div style={S.cardWrap}>
        <div className="editorial-card" style={{ padding: '40px 38px', borderRadius: 28 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <img
                src={ecellLogo}
                alt="E-CELL MUJ"
                style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: '50%', backgroundColor: '#fff' }}
              />
              <span style={S.welcomeTag}>
                <Sparkles size={11} /> E-CELL MUJ &bull; IPR CELL
              </span>
            </div>

            <img
              src={mujLogo}
              alt="Manipal University Jaipur"
              style={{ display: 'block', margin: '0 auto 14px', maxWidth: 260, width: '100%', height: 'auto' }}
            />

            <h1 style={S.portalTitle}>Patent Application &amp; Invention Portal</h1>
            <p style={S.subtext}>Sign in with your official university credentials</p>
          </div>

          {/* Pill Tab Switcher */}
          <div style={S.tabRow}>
            {(['signin', 'register'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t);
                  setErr(null);
                  setOk(null);
                }}
                style={{ ...S.tabBtn, ...(tab === t ? S.tabActive : S.tabInactive) }}
              >
                {t === 'signin' ? 'Sign In' : 'Register Account'}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {err && (
            <div style={S.alertErr}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{err}</span>
            </div>
          )}
          {ok && (
            <div style={S.alertOk}>
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{ok}</span>
            </div>
          )}

          {tab === 'signin' ? (
            <form onSubmit={onSignIn}>
              {/* 1-Click Demo Quick-Fill Pills */}
              <div style={{ marginBottom: 18, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6385B2' }}>Demo Quick-Fill:</span>
                <button
                  type="button"
                  onClick={() => fillDemo('aditya.sharma')}
                  style={S.quickFillPill}
                >
                  <Sparkles size={11} />
                  Aditya Sharma (Student)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('patent.admin')}
                  style={S.quickFillPillSecondary}
                >
                  Patent Coordinator (Admin)
                </button>
              </div>

              {/* Username Input */}
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>Institutional Username</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="e.g. aditya.sharma"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                    autoComplete="username"
                    style={{ ...S.input, flex: '1 1 0', minWidth: 0 }}
                  />
                  <span style={S.domainTag}>@{INSTITUTION.DOMAIN}</span>
                </div>
              </div>

              {/* Password Input */}
              <div style={{ marginBottom: 24, position: 'relative' }}>
                <label style={S.label}>Password</label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter your university password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ ...S.input, paddingRight: 44 }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd((p) => !p)}
                  style={S.eyeBtn}
                >
                  {showPwd ? <EyeOff size={17} color="#6385B2" /> : <Eye size={17} color="#6385B2" />}
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <button
                  type="submit"
                  disabled={busy}
                  className="btn btn-primary"
                  style={{ padding: '11px 32px', opacity: busy ? 0.6 : 1, cursor: busy ? 'not-allowed' : 'pointer' }}
                >
                  <span />
                  {busy ? 'Authenticating…' : 'Sign In'} <ArrowRight size={15} />
                </button>

                <button
                  type="button"
                  style={S.forgotBtn}
                  onClick={() => setShowForgot(true)}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#204E96')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#6385B2')}
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={onRegister}>
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>
                  University Username <span style={S.req}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="username"
                    value={regUser}
                    onChange={(e) => setRegUser(e.target.value)}
                    required
                    style={{ ...S.input, flex: '1 1 0', minWidth: 0 }}
                  />
                  <span style={S.domainTag}>@{INSTITUTION.DOMAIN}</span>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>
                  Full Name <span style={S.req}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={S.ico}>
                    <User size={15} color="#6385B2" />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Aditya Sharma"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    style={S.inputIco}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={S.label}>Department</label>
                  <div style={{ position: 'relative' }}>
                    <span style={S.ico}>
                      <Building size={15} color="#6385B2" />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. CSE"
                      value={regDept}
                      onChange={(e) => setRegDept(e.target.value)}
                      style={S.inputIco}
                    />
                  </div>
                </div>
                <div>
                  <label style={S.label}>Registration No.</label>
                  <div style={{ position: 'relative' }}>
                    <span style={S.ico}>
                      <Hash size={15} color="#6385B2" />
                    </span>
                    <input
                      type="text"
                      placeholder="229301045"
                      value={regNo}
                      onChange={(e) => setRegNo(e.target.value)}
                      style={S.inputIco}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <span style={S.ico}>
                    <Phone size={15} color="#6385B2" />
                  </span>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    style={S.inputIco}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
                <div>
                  <label style={S.label}>
                    Password <span style={S.req}>*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={regPwd}
                    onChange={(e) => setRegPwd(e.target.value)}
                    required
                    style={S.input}
                  />
                </div>
                <div>
                  <label style={S.label}>
                    Confirm Password <span style={S.req}>*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter password"
                    value={regPwd2}
                    onChange={(e) => setRegPwd2(e.target.value)}
                    required
                    style={S.input}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px 24px', opacity: busy ? 0.6 : 1 }}
              >
                <span />
                {busy ? 'Registering…' : 'Complete Registration'} <ArrowRight size={15} />
              </button>
            </form>
          )}

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.8125rem', color: '#6385B2' }}>
            Institutional Access Strictly Restricted to{' '}
            <strong style={{ color: '#152E5A' }}>@{INSTITUTION.DOMAIN}</strong>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(21, 46, 90, 0.45)',
            backdropFilter: 'blur(4px)',
            padding: 16,
          }}
          onClick={() => setShowForgot(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 28,
              border: '1px solid #EBE5D5',
              padding: '36px 32px',
              maxWidth: 440,
              width: '100%',
              boxShadow: '0 20px 50px rgba(21, 46, 90, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: '#E8EEF6',
                  color: '#204E96',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <AlertCircle size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#152E5A', margin: '0 0 10px' }}>
                Institutional Password Assistance
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#354F77', lineHeight: 1.6, margin: '0 0 20px' }}>
                Password resets for @{INSTITUTION.DOMAIN} accounts are managed through the university central IT
                directory or Patent Review Cell at{' '}
                <strong style={{ color: '#204E96' }}>{INSTITUTION.CONTACT_EMAIL}</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="btn btn-primary"
                style={{ padding: '10px 32px' }}
              >
                <span />
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  Styles - Matching Reference Warm Cream & Royal Navy               */
/* ═══════════════════════════════════════════════════════════════════ */
const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF7EE',
    padding: '40px 16px',
  },
  cardWrap: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: 500,
    margin: '0 auto',
  },
  welcomeTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8EEF6',
    color: '#204E96',
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '3px 12px',
    borderRadius: 9999,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  portalTitle: {
    textAlign: 'center',
    fontSize: '1.45rem',
    fontWeight: 800,
    color: '#152E5A',
    margin: '0 0 6px',
    letterSpacing: '-0.02em',
  },
  subtext: {
    textAlign: 'center',
    fontSize: '0.875rem',
    color: '#354F77',
    margin: 0,
    lineHeight: 1.5,
  },
  tabRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
    backgroundColor: '#F4EFE0',
    padding: 4,
    borderRadius: 9999,
    border: '1px solid #EBE5D5',
  },
  tabBtn: {
    flex: 1,
    padding: '8px 0',
    border: 'none',
    fontWeight: 600,
    fontSize: '0.8125rem',
    cursor: 'pointer',
    borderRadius: 9999,
    transition: 'all .2s ease',
  },
  tabActive: {
    backgroundColor: '#204E96',
    color: '#FFFFFF',
    boxShadow: '0 2px 6px rgba(32, 78, 150, 0.25)',
  },
  tabInactive: {
    backgroundColor: 'transparent',
    color: '#354F77',
  },
  alertErr: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '12px 16px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FCA5A5',
    borderRadius: 14,
    marginBottom: 16,
    fontSize: '0.8125rem',
    color: '#B91C1C',
  },
  alertOk: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '12px 16px',
    backgroundColor: '#F0FDF4',
    border: '1px solid #86EFAC',
    borderRadius: 14,
    marginBottom: 16,
    fontSize: '0.8125rem',
    color: '#15803D',
  },
  quickFillPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '5px 14px',
    borderRadius: 9999,
    backgroundColor: '#E8EEF6',
    color: '#204E96',
    border: '1px solid #CBDDF2',
    cursor: 'pointer',
  },
  quickFillPillSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '5px 14px',
    borderRadius: 9999,
    backgroundColor: '#FAF7EE',
    color: '#354F77',
    border: '1px solid #EBE5D5',
    cursor: 'pointer',
  },
  label: {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#152E5A',
    marginBottom: 6,
  },
  req: {
    color: '#DC2626',
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    border: '1.5px solid #E0D9C8',
    borderRadius: 12,
    fontSize: '0.875rem',
    color: '#152E5A',
    background: '#FFFFFF',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color .15s ease, box-shadow .15s ease',
  },
  inputIco: {
    width: '100%',
    padding: '11px 14px 11px 38px',
    border: '1.5px solid #E0D9C8',
    borderRadius: 12,
    fontSize: '0.875rem',
    color: '#152E5A',
    background: '#FFFFFF',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color .15s ease, box-shadow .15s ease',
  },
  ico: {
    position: 'absolute' as const,
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
  },
  domainTag: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#204E96',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  eyeBtn: {
    position: 'absolute' as const,
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
  },
  forgotBtn: {
    background: 'none',
    border: 'none',
    color: '#6385B2',
    fontSize: '0.8125rem',
    cursor: 'pointer',
    padding: 0,
    fontWeight: 500,
    transition: 'color .15s',
  },
};

export default LoginPage;
