import React, { useState } from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { isOtpCode, normalizeOtpInput } from '../features/auth/otp';
import { totpCode } from '../features/auth/totp';
import { getDemoTotpSecret } from '../features/auth/demoAuth';
import { isSupabaseConfigured } from '../lib/supabase';

/** TOTP step for coordinators and super admins: enroll an authenticator app once, then enter its code each sign-in. */
export const MfaGate: React.FC = () => {
  const { mfaStatus, enrollTotp, verifyTotpMfa, signOut, currentUser } = useAuth();
  const [setup, setSetup] = useState<{ qrCode: string; secret: string; otpauthUri?: string } | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [demoCurrentCode, setDemoCurrentCode] = useState<string | null>(null);
  const enrolling = mfaStatus === 'enroll';
  const showCodeForm = !enrolling || setup !== null;
  const demoSecret = isSupabaseConfigured()
    ? null
    : setup?.secret ?? (currentUser ? getDemoTotpSecret(currentUser.id) : null);

  const showDemoCode = async () => {
    if (demoSecret) setDemoCurrentCode(await totpCode(demoSecret));
  };

  const startSetup = async () => {
    setBusy(true);
    setError(null);
    const result = await enrollTotp();
    setBusy(false);
    if ('error' in result) setError(result.error);
    else setSetup(result);
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpCode(code)) {
      setError('Enter the 6-digit code shown in your authenticator app.');
      return;
    }
    setBusy(true);
    setError(null);
    const ok = await verifyTotpMfa(code);
    setBusy(false);
    if (!ok) {
      setCode('');
      setError('That code did not match. Wait for a new code in the app and try again; check your phone clock is set automatically.');
    }
  };

  return (
    <div className="container" style={{ paddingBlock: '64px' }}>
      <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="card-header">
          <h1 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={20} aria-hidden="true" color="var(--accent-primary)" />
            Two-factor authentication
          </h1>
        </div>
        <div className="card-body">
          <p style={{ marginTop: 0 }}>
            {currentUser?.role === 'super_admin' ? 'Super admin' : 'Coordinator'} access needs a 6-digit code from an
            authenticator app such as Microsoft Authenticator, Google Authenticator or Authy.
          </p>

          {enrolling && !setup && (
            <button type="button" className="btn btn-primary" onClick={startSetup} disabled={busy}>
              <span />
              {busy ? 'Preparing…' : 'Set up authenticator app'}
            </button>
          )}

          {setup && setup.qrCode && (
            <div style={{ margin: '16px 0' }}>
              <p style={{ margin: '0 0 8px' }}>1. Scan this QR code with your authenticator app.</p>
              <img
                src={setup.qrCode}
                alt="QR code that adds the MUJ Patent Portal to your authenticator app"
                width={180}
                height={180}
                style={{ display: 'block', background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: 8 }}
              />
              <p style={{ margin: '8px 0 0', fontSize: '0.875rem' }}>
                Can't scan it? Add this key manually:{' '}
                <code style={{ userSelect: 'all', wordBreak: 'break-all' }}>{setup.secret}</code>
              </p>
              <p style={{ margin: '12px 0 0' }}>2. Enter the code the app shows.</p>
            </div>
          )}

          {setup && !setup.qrCode && (
            <div style={{ margin: '16px 0' }}>
              <p style={{ margin: '0 0 8px' }}>
                1. In your authenticator app choose <strong>Add account → Enter a setup key</strong> (time-based) and type:
              </p>
              <code
                style={{
                  display: 'block',
                  userSelect: 'all',
                  wordBreak: 'break-all',
                  fontSize: '1.05rem',
                  letterSpacing: '0.08em',
                  padding: '10px 12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 8,
                }}
              >
                {setup.secret.match(/.{1,4}/g)?.join(' ')}
              </code>
              {setup.otpauthUri && (
                <p style={{ margin: '8px 0 0', fontSize: '0.875rem' }}>
                  On your phone? <a href={setup.otpauthUri}>Open this in your authenticator app</a>.
                </p>
              )}
              <p style={{ margin: '12px 0 0' }}>2. Enter the 6-digit code the app shows.</p>
            </div>
          )}

          {showCodeForm && (
            <form onSubmit={onVerify} noValidate>
              <div className="form-group">
                <label htmlFor="totp-code" className="form-label">
                  Authenticator code
                </label>
                <input
                  id="totp-code"
                  className="form-control"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(normalizeOtpInput(e.target.value))}
                  aria-describedby={error ? 'totp-error' : undefined}
                  autoFocus
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.3em', fontSize: '1.1rem', maxWidth: 200 }}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                <span />
                {busy ? 'Verifying…' : 'Verify and continue'}
              </button>
            </form>
          )}

          {showCodeForm && demoSecret && (
            <details style={{ marginTop: 16, fontSize: '0.875rem' }}>
              <summary style={{ cursor: 'pointer' }}>No authenticator app? (demo mode only)</summary>
              <p style={{ margin: '8px 0' }}>
                Shows the code your authenticator app would show right now. The live portal has no such button.
              </p>
              <button type="button" className="btn btn-outline btn-sm" onClick={showDemoCode}>
                Show current code
              </button>
              {demoCurrentCode && (
                <span style={{ marginLeft: 12, fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.2em' }}>
                  {demoCurrentCode}
                </span>
              )}
            </details>
          )}

          {error && (
            <div id="totp-error" role="alert" className="alert alert-danger" style={{ marginTop: 16 }}>
              <AlertCircle size={16} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="card-footer">
          <button type="button" className="btn btn-outline" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};
