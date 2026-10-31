// Live-mode sign-up, sign-in and password-reset outcomes, with the Supabase client mocked
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, useContext } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AuthContext, type AuthContextType } from '../features/auth/authContextDef';

const auth = vi.hoisted(() => ({
  getSession: vi.fn(async () => ({ data: { session: null } })),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: () => {} } } })),
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(async () => ({ error: null })),
  resetPasswordForEmail: vi.fn(),
  verifyOtp: vi.fn(),
  updateUser: vi.fn(),
  mfa: {
    getAuthenticatorAssuranceLevel: vi.fn(),
    listFactors: vi.fn(),
    challengeAndVerify: vi.fn(),
  },
}));
const fetchCurrentProfile = vi.hoisted(() => vi.fn());

vi.mock('../lib/supabase', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/supabase')>()),
  isSupabaseConfigured: () => true,
  supabase: { auth },
}));
vi.mock('../lib/api', () => ({ fetchCurrentProfile, upsertProfile: vi.fn() }));

const { AuthProvider } = await import('../features/auth/AuthContext');

let root: Root;
let ctx: AuthContextType;
const Grab = () => {
  ctx = useContext(AuthContext)!;
  return null;
};

beforeEach(async () => {
  vi.clearAllMocks();
  auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal1' }, error: null });
  root = createRoot(document.createElement('div'));
  await act(async () => root.render(<AuthProvider><Grab /></AuthProvider>));
});
afterEach(() => act(() => root.unmount()));

const EMAIL = 'pranav.1@muj.manipal.edu';
const register = () => act(() => ctx.registerUniversityAccount({ email: EMAIL, password: 'secret12', fullName: 'Pranav Singh' }));

describe('live sign-up', () => {
  it('asks for the emailed code when Supabase holds the account unconfirmed', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { id: 'u1' }, session: null }, error: null });
    expect(await register()).toEqual({ needsVerification: true });
    expect(fetchCurrentProfile).not.toHaveBeenCalled();
  });

  it('signs straight in if "Confirm email" is off', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { id: 'u1' }, session: { user: { id: 'u1' } } }, error: null });
    fetchCurrentProfile.mockResolvedValue({ id: 'u1', role: 'student' });
    expect(await register()).toEqual({});
  });

  it('sends an unconfirmed sign-in to the code step', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: { code: 'email_not_confirmed' } });
    const r = await act(() => ctx.signInWithEmail(EMAIL, 'secret12'));
    expect(r.needsVerification).toBe(true);
  });
});

describe('live password reset', () => {
  it('gives the same reply whether or not the account exists', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    expect(await act(() => ctx.requestPasswordReset(EMAIL))).toEqual({});
    auth.resetPasswordForEmail.mockResolvedValue({ error: { code: 'over_email_send_rate_limit' } });
    expect((await act(() => ctx.requestPasswordReset(EMAIL))).error).toContain('wait a few minutes');
  });

  it('needs the authenticator code when the account has one, then changes the password and signs out', async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: null });
    auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: 'aal1', nextLevel: 'aal2' }, error: null });
    expect(await act(() => ctx.verifyPasswordResetCode(EMAIL, '123456'))).toEqual({ needsTotp: true });
    expect(auth.verifyOtp).toHaveBeenCalledWith(expect.objectContaining({ type: 'recovery', token: '123456' }));
    expect(ctx.passwordRecovery).toBe(true);

    auth.mfa.listFactors.mockResolvedValue({ data: { totp: [{ id: 'f1' }] } });
    auth.mfa.challengeAndVerify.mockResolvedValue({ error: null });
    auth.updateUser.mockResolvedValue({ error: null });
    expect(await act(() => ctx.completePasswordReset('newpass1', '654321'))).toEqual({});
    expect(auth.mfa.challengeAndVerify).toHaveBeenCalledWith({ factorId: 'f1', code: '654321' });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'newpass1' });
    expect(auth.signOut).toHaveBeenCalled();
    expect(ctx.passwordRecovery).toBe(false);
  });

  it('rejects a wrong recovery code', async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: { code: 'otp_expired' } });
    expect((await act(() => ctx.verifyPasswordResetCode(EMAIL, '000000'))).error).toContain('invalid or has expired');
    expect(ctx.passwordRecovery).toBe(false);
  });

  it('asks for the authenticator code if Supabase refuses the change at aal1', async () => {
    auth.updateUser.mockResolvedValue({ error: { code: 'insufficient_aal' } });
    const r = await act(() => ctx.completePasswordReset('newpass1'));
    expect(r.needsTotp).toBe(true);
  });
});
