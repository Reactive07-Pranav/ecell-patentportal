import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import {
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  Building,
  Phone,
  Hash,
  Lock,
} from 'lucide-react';
import { COORDINATOR } from '../config/constants';
import mujLogo from '../assets/muj-logo.png';

type LoginStep = 'role-select' | 'auth-form';

const DOMAIN = 'muj.manipal.edu';
const fullEmail = (u: string) => { const v = u.trim(); return v.includes('@') ? v : `${v}@${DOMAIN}`; };

export const LoginPage: React.FC = () => {
  const { signInWithEmail, registerUniversityAccount, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<LoginStep>('role-select');
  const [role, setRole] = useState<'student' | 'admin' | null>(null);
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
      const dest = from && from !== '/' && from !== '/login' && from !== '/auth/login'
        ? from
        : currentUser.role === 'super_admin' ? '/superadmin/dashboard'
        : currentUser.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      navigate(dest, { replace: true });
    }
  }, [currentUser, navigate, location]);

  const pick = (r: 'student' | 'admin') => { setRole(r); setStep('auth-form'); setErr(null); setOk(null); if (r === 'admin') setTab('signin'); };
  const back = () => { setStep('role-select'); setRole(null); setErr(null); setOk(null); setTab('signin'); };

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setOk(null);
    if (!username.trim()) { setErr('Please enter your username.'); return; }
    const email = fullEmail(username);
    setBusy(true);
    const r = await signInWithEmail(email, password);
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    setOk('Identity verified. Redirecting…');
    const c = email.toLowerCase();
    const sa = c === 'superadmin@muj.manipal.edu' || c === 'it.admin@muj.manipal.edu';
    const ad = !sa && (c === COORDINATOR.EMAIL.toLowerCase() || c.includes('dorelal') || c.includes('admin') || c === 'patent.admin@muj.manipal.edu');
    setTimeout(() => navigate(sa ? '/superadmin/dashboard' : ad ? '/admin/dashboard' : '/dashboard', { replace: true }), 300);
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setOk(null);
    if (role !== 'student') return;
    if (regPwd !== regPwd2) { setErr('Passwords do not match.'); return; }
    if (regPwd.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    const email = fullEmail(regUser);
    setBusy(true);
    const r = await registerUniversityAccount({ email, password: regPwd, fullName: regName, department: regDept, registrationNumber: regNo, phone: regPhone });
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    setOk('Registered! Redirecting…');
    setTimeout(() => navigate('/dashboard', { replace: true }), 400);
  };

  // ── focus / blur handlers ──
  const onF = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#d35400'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(211,84,0,.08)'; };
  const onB = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#d5d5d5'; e.currentTarget.style.boxShadow = 'none'; };

  return (
    <>
      {/* Google Font */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet" />

      <div style={S.page}>
        <div style={{ ...S.bg, backgroundImage: `url('/assets/login-bg-night.png')` }} />
        <div style={S.overlay} />

        <div style={{ ...S.cardWrap, maxWidth: 600, margin: '0 auto' }} className="login-card-wrap">

          {step === 'role-select' ? (
            /* ═════════ STEP 1 — CHOOSE ROLE ═════════ */
            <div style={S.card} key="s1" className="login-card">
              <div style={S.accent} />

                <p style={S.welcomeLabel}>WELCOME TO</p>
                <div className="login-logos" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: '0 0 8px' }}>
                  <img src={mujLogo} alt="Manipal University Jaipur" style={{ height: 'auto', maxHeight: 56, width: 'auto', objectFit: 'contain' }} />
                  <div style={{ width: 1, height: 40, backgroundColor: '#e0e0e0' }} />
                  <img src="/assets/muj-ecell-logo.png" alt="MUJ E-Cell" style={{ height: 'auto', maxHeight: 56, width: 'auto', objectFit: 'contain' }} />
                </div>

                <p style={{ ...S.portalLabel, marginBottom: 8 }}>E-Cell Patent Portal</p>
                <p style={{ ...S.subtext, marginBottom: 20 }}>Choose how you'd like to sign in</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
                  <button type="button" onClick={() => pick('admin')} style={S.blueBtn}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1a5cb5'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2074d4'; e.currentTarget.style.transform = 'none'; }}>
                    Sign in as MUJ Faculty / Admin
                    <ArrowRight size={16} style={{ opacity: .7 }} />
                  </button>
                  <button type="button" onClick={() => pick('student')} style={S.blueBtn}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1a5cb5'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2074d4'; e.currentTarget.style.transform = 'none'; }}>
Sign in as MUJ Student
                    <ArrowRight size={16} style={{ opacity: .7 }} />
                  </button>
                </div>
              </div>

           ) : (
            /* ═════════ STEP 2 — AUTH FORM ═════════ */
            <div style={S.card} key="s2" className="login-card">
              <div style={S.accent} />

                {/* back */}
                <button type="button" onClick={back} style={S.backBtn}
                  onMouseEnter={e => (e.currentTarget.style.color = '#d35400')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#b0b0b0')}>
                  <ArrowLeft size={14} /> Back
                </button>

                {/* header */}
                <p style={{ ...S.welcomeLabel, fontSize: 11, marginBottom: 2 }}>WELCOME TO</p>
                <div className="login-logos" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: '0 0 8px' }}>
                  <img src={mujLogo} alt="Manipal University Jaipur" style={{ height: 'auto', maxHeight: 56, width: 'auto', objectFit: 'contain' }} />
                  <div style={{ width: 1, height: 40, backgroundColor: '#e0e0e0' }} />
                  <img src="/assets/muj-ecell-logo.png" alt="MUJ E-Cell" style={{ height: 'auto', maxHeight: 56, width: 'auto', objectFit: 'contain' }} />
                </div>
                <p style={{ ...S.portalLabel, fontSize: 12, marginBottom: 2 }}>E-Cell Patent Portal</p>

                <h2 style={{ ...S.formTitle, marginBottom: 4 }}>{tab === 'signin' ? 'Sign In' : 'Create Account'}</h2>
                <p style={{ ...S.roleChip, marginBottom: 16 }}>{role === 'admin' ? 'Faculty / Admin' : 'Student'}</p>

{role === 'student' && (
                <div style={{ ...S.tabRow, height: 44, marginBottom: 16 }}>
                  {(['signin', 'register'] as const).map(t => (
                    <button key={t} type="button"
                      onClick={() => { setTab(t); setErr(null); setOk(null); }}
                      style={{ ...S.tabBtn, ...(tab === t ? S.tabActive : S.tabInactive) }}>
                      {t === 'signin' ? 'Sign In' : 'Register'}
                    </button>
                  ))}
                </div>
                )}

                {/* alerts */}
                {err && <div style={S.alertErr}><AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /><span>{err}</span></div>}
                {ok && <div style={S.alertOk}><CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} /><span>{ok}</span></div>}

                {tab === 'signin' ? (
                  <form onSubmit={onSignIn}>
                    {/* username */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={S.label}>Username</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="text" placeholder="e.g. aryaman.26020*****" value={username}
                          onChange={e => setUsername(e.target.value)} required autoFocus autoComplete="username"
                          style={{ ...S.input, flex: '1 1 0', minWidth: 0 }} onFocus={onF} onBlur={onB} />
                        <span style={S.domainTag}>@muj.manipal.edu</span>
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={S.label}>Password</label>
                      <div className="password-field">
                        <input type={showPwd ? 'text' : 'password'} placeholder="Enter your password"
                          value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                          className="password-input" onFocus={onF} onBlur={onB} />
                        <button type="button" tabIndex={-1} className="password-toggle" aria-label={showPwd ? 'Hide password' : 'Show password'} onClick={() => setShowPwd(p => !p)}>
                          {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <button type="submit" disabled={busy}
                        style={{ ...S.orangeBtn, opacity: busy ? .6 : 1, cursor: busy ? 'not-allowed' : 'pointer' }}
                        onMouseEnter={e => { if (!busy) e.currentTarget.style.backgroundColor = '#b94600'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#d35400'; }}>
                        {busy ? 'Signing In…' : 'Sign In'} <ArrowRight size={15} />
                      </button>
                      <button type="button" style={S.forgotBtn} onClick={() => setShowForgot(true)}
                        onMouseEnter={e => (e.currentTarget.style.color = '#d35400')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#999')}>
                        Forgot Password?
                      </button>
                    </div>
                  </form>

                ) : (
                  <form onSubmit={onRegister}>
                    <div style={{ marginBottom: 14 }}>
                      <label style={S.label}>University Email <span style={S.req}>*</span></label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="text" placeholder="username" value={regUser} onChange={e => setRegUser(e.target.value)} required
                          style={{ ...S.input, flex: '1 1 0', minWidth: 0 }} onFocus={onF} onBlur={onB} />
                        <span style={{ ...S.domainTag, fontSize: 13 }}>@muj.manipal.edu</span>
                      </div>
                    </div>

                    <div className="login-row-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                      <div>
                        <label style={S.label}>Full Name <span style={S.req}>*</span></label>
                        <div style={{ position: 'relative' }}>
                          <span style={S.ico}><User size={15} /></span>
                          <input type="text" placeholder="e.g. Aryaman Sharma" value={regName} onChange={e => setRegName(e.target.value)} required
                            style={S.inputIco} onFocus={onF} onBlur={onB} />
                        </div>
                      </div>
                      <div>
                        <label style={S.label}>Phone</label>
                        <div style={{ position: 'relative' }}><span style={S.ico}><Phone size={15} /></span>
                          <input type="tel" placeholder="98********" value={regPhone} onChange={e => setRegPhone(e.target.value)} style={S.inputIco} onFocus={onF} onBlur={onB} />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                      <div>
                        <label style={S.label}>Department</label>
                        <div style={{ position: 'relative' }}><span style={S.ico}><Building size={15} /></span>
                          <input type="text" placeholder="e.g. CSE" value={regDept} onChange={e => setRegDept(e.target.value)} style={S.inputIco} onFocus={onF} onBlur={onB} />
                        </div>
                      </div>
                      <div>
                        <label style={S.label}>Reg. No.</label>
                        <div style={{ position: 'relative' }}><span style={S.ico}><Hash size={15} /></span>
                          <input type="text" placeholder="e.g. 219301234" value={regNo} onChange={e => setRegNo(e.target.value)} style={S.inputIco} onFocus={onF} onBlur={onB} />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                      <div>
                        <label style={S.label}>Password <span style={S.req}>*</span></label>
                        <div style={{ position: 'relative' }}><span style={S.ico}><Lock size={15} /></span>
                          <input type="password" placeholder="Min 6 chars" value={regPwd} onChange={e => setRegPwd(e.target.value)} required style={S.inputIco} onFocus={onF} onBlur={onB} />
                        </div>
                      </div>
                      <div>
                        <label style={S.label}>Confirm <span style={S.req}>*</span></label>
                        <div style={{ position: 'relative' }}><span style={S.ico}><Lock size={15} /></span>
                          <input type="password" placeholder="Re-enter" value={regPwd2} onChange={e => setRegPwd2(e.target.value)} required style={S.inputIco} onFocus={onF} onBlur={onB} />
                        </div>
                      </div>
                    </div>

                    <button type="submit" disabled={busy}
                      style={{ ...S.orangeBtn, width: '100%', justifyContent: 'center', opacity: busy ? .6 : 1, cursor: busy ? 'not-allowed' : 'pointer' }}
                      onMouseEnter={e => { if (!busy) e.currentTarget.style.backgroundColor = '#b94600'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#d35400'; }}>
                      {busy ? 'Registering…' : 'Complete Registration'} <ArrowRight size={15} />
                    </button>
                  </form>
                )}
                </div>
           )}
         </div>
       </div>

      {/* Forgot Password Dialog */}
      {showForgot && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowForgot(false)}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,.5)' }} />
          <div style={{ ...S.card, position: 'relative', maxWidth: 420, width: '90%', animation: 'cardIn .35s ease both' }}
            onClick={e => e.stopPropagation()}>
              <div style={S.accent} />
              <div className="login-logos" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: '0 0 8px' }}>
                  <img src={mujLogo} alt="Manipal University Jaipur" style={{ height: 'auto', maxHeight: 56, width: 'auto', objectFit: 'contain' }} />
                  <div style={{ width: 1, height: 40, backgroundColor: '#e0e0e0' }} />
                  <img src="/assets/muj-ecell-logo.png" alt="MUJ E-Cell" style={{ height: 'auto', maxHeight: 56, width: 'auto', objectFit: 'contain' }} />
                </div>
              <h3 style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#d35400', margin: '0 0 8px', fontFamily: dm }}>
                Forgot Password?
              </h3>
              <p style={{ textAlign: 'center', fontSize: 14, color: '#555', lineHeight: 1.7, margin: '0 0 8px', fontFamily: dm }}>
                Please contact the <strong>E-Cell MUJ Admin</strong> or your department coordinator to reset your portal password.
              </p>
              <p style={{ textAlign: 'center', fontSize: 13, color: '#888', lineHeight: 1.6, margin: '0 0 16px', fontFamily: dm }}>
                You can reach out via email at<br />
                <a href="mailto:ecell@muj.manipal.edu" style={{ color: '#d35400', fontWeight: 600, textDecoration: 'none' }}>ecell@muj.manipal.edu</a>
              </p>
              <div style={{ textAlign: 'center' }}>
                <button type="button" onClick={() => setShowForgot(false)}
                  style={{ ...S.orangeBtn, padding: '10px 36px' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#b94600'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#d35400'; }}>
                  Got it
                </button>
              </div>
            </div>
        </div>
      )}

      <style>{`
        @keyframes cardIn { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        .password-field { display: flex; align-items: center; height: 44px; border: 1px solid #d5d5d5; border-radius: 8px; background: #fafafa; padding: 0 12px; }
        .password-field:focus-within { border-color: #d35400; box-shadow: 0 0 0 3px rgba(211,84,0,.08); }
        .password-input { flex: 1; min-width: 0; height: 100%; border: 0; outline: 0; background: transparent; padding: 0; font-size: 15px; font-family: inherit; color: #222; }
        .password-toggle { flex: none; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; background: none; border: 0; cursor: pointer; margin-right: -6px; color: #bbb; }
        @media (max-width: 400px) {
          .login-logos img { max-height: 44px !important; }
        }
          .login-card { padding: 20px 16px !important; }
          .login-card-wrap { margin: 16px !important; }
          .login-row-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  Styles                                                            */
/* ═══════════════════════════════════════════════════════════════════ */
const dm = "'DM Sans', 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const pf = "'Playfair Display', Georgia, 'Times New Roman', serif";

const S: Record<string, React.CSSProperties> = {
  page: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: dm, overflow: 'auto', padding: '24px 16px' },
bg: { position: 'fixed', inset: 0, backgroundSize: 'cover', backgroundPosition: 'center 40%', backgroundRepeat: 'no-repeat', zIndex: 0, filter: 'blur(3px)', transform: 'scale(1.05)' },
  overlay: { position: 'fixed', inset: 0, background: 'linear-gradient(135deg, rgba(11,30,68,0.78) 0%, rgba(20,60,120,0.55) 100%)', zIndex: 1 },
  cardWrap: { position: 'relative', zIndex: 2, width: '100%', margin: '0 auto', transition: 'max-width .3s', maxWidth: 600 },
  card: { backgroundColor: '#fff', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.08)', overflow: 'hidden', animation: 'cardIn .5s ease both', width: '100%', boxSizing: 'border-box' as const, padding: '28px 32px', position: 'relative', zIndex: 2 },
  cardPadSm: { padding: '20px 16px' },
  accent: { height: 0, display: 'none' },

  welcomeLabel: { textAlign: 'center', fontSize: 13, fontWeight: 500, color: '#d35400', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 6px', fontFamily: dm, fontStyle: 'normal' },
  uniName: { textAlign: 'center', fontSize: 26, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px', fontFamily: pf, lineHeight: 1.25 },
  ugc: { textAlign: 'center', fontSize: 11.5, color: '#999', fontStyle: 'italic', margin: '0 0 20px', fontFamily: dm },
  divider: { width: 50, height: 2, backgroundColor: '#e0e0e0', margin: '0 auto 22px', borderRadius: 1 },
  portalLabel: { textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#333', letterSpacing: .5, margin: '0 0 4px', fontFamily: dm },
  subtext: { textAlign: 'center', fontSize: 13.5, color: '#aaa', margin: '0 0 0', fontFamily: dm },

  blueBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    width: '100%', padding: '15px 24px',
    backgroundColor: '#2074d4', color: '#fff', border: 'none', borderRadius: 10,
    fontSize: 15, fontWeight: 600, fontFamily: dm, letterSpacing: .2,
    cursor: 'pointer', transition: 'all .2s ease',
    boxShadow: '0 4px 14px rgba(32,116,212,.3)',
    textDecoration: 'none',
  },

  backBtn: { display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#b0b0b0', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16, fontFamily: dm, transition: 'color .15s', fontWeight: 500 },

  formTitle: { textAlign: 'center', color: '#d35400', fontSize: 28, fontWeight: 700, margin: '8px 0 4px', fontFamily: dm },
  roleChip: { textAlign: 'center', fontSize: 12, color: '#bbb', margin: '0 0 8px', fontFamily: dm, fontWeight: 500, letterSpacing: .5 },

  tabRow: { display: 'flex', marginBottom: 22, borderRadius: 8, overflow: 'hidden', border: '1px solid #e8e8e8' },
  tabBtn: { flex: 1, padding: '10px 0', border: 'none', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: dm, transition: 'all .2s', letterSpacing: .3 },
  tabActive: { backgroundColor: '#d35400', color: '#fff' },
  tabInactive: { backgroundColor: '#fafafa', color: '#aaa' },

  alertErr: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#b91c1c', fontFamily: dm },
  alertOk: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#15803d', fontFamily: dm },

  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, fontFamily: dm, letterSpacing: .2 },
  req: { color: '#e74c3c' },

  input: {
    width: '100%', padding: '12px 14px', border: '1px solid #d5d5d5', borderRadius: 8,
    fontSize: 15, height: 44, fontFamily: dm, color: '#222', background: '#fafafa',
    outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color .2s, box-shadow .2s, background .2s',
  },
  inputIco: {
    width: '100%', padding: '12px 14px 12px 40px', border: '1px solid #d5d5d5', borderRadius: 8,
    fontSize: 15, height: 44, fontFamily: dm, color: '#222', background: '#fafafa',
    outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color .2s, box-shadow .2s',
  },
  ico: { position: 'absolute' as const, left: 13, top: '50%', transform: 'translateY(-50%)', color: '#bbb', display: 'flex' },

  domainTag: { fontSize: 14, fontWeight: 600, color: '#333', whiteSpace: 'nowrap' as const, flexShrink: 0, fontFamily: dm, display: 'flex', alignItems: 'center', height: 44 },

  eyeBtn: { position: 'absolute' as const, right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 0 },

  orangeBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    padding: '0 32px', height: 48, backgroundColor: '#d35400', color: '#fff', border: 'none',
    borderRadius: 10, fontSize: 15, fontWeight: 600, fontFamily: dm, letterSpacing: .3,
    cursor: 'pointer', transition: 'background .2s, box-shadow .2s, transform .15s',
    boxShadow: '0 4px 14px rgba(211,84,0,.25)',
    boxSizing: 'border-box' as const,
  },

  forgotBtn: { background: 'none', border: 'none', color: '#999', fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: dm, fontWeight: 500, transition: 'color .15s' },
};

export default LoginPage;
