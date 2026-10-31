import React, { useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Profile, AppRole } from '../../types/database.types';
import { fetchCurrentProfile, upsertProfile } from '../../lib/api';
import { isAllowedUniversityEmail } from './authUtils';
import { isOtpCode } from './otp';
import { generateTotpSecret, otpauthUri, verifyTotp } from './totp';
import {
  checkDemoCode,
  getDemoTotpSecret,
  isDemoVerified,
  issueDemoCode,
  saveDemoRegistration,
  removeDemoTotpSecret,
  saveDemoTotpSecret,
  takeDemoRegistration,
  type DemoRegistration,
} from './demoAuth';
import { COORDINATOR, DEMO_PERSONAS, INSTITUTION, SECURITY_RULES, STORAGE_KEYS } from '../../config/constants';
import { AuthContext, type AuthContextType, type AuthResult, type MfaStatus } from './authContextDef';

export { AuthContext, type AuthContextType };

const LOCAL_AUTH_USER_KEY = STORAGE_KEYS.AUTH_USER;
const MFA_TIMESTAMP_KEY = STORAGE_KEYS.MFA_TIMESTAMP;
// Demo mode only (no Supabase): these addresses open the coordinator persona. Live roles come from the database.
const DEMO_ADMIN_EMAILS = [COORDINATOR.EMAIL.toLowerCase(), 'patent.admin@muj.manipal.edu'];
const GENERIC_CODE_ERROR = 'That code is invalid or has expired. Request a new code and try again.';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const live = isSupabaseConfigured();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mfaStatus, setMfaStatus] = useState<MfaStatus>('not_required');
  // Set while a forgot-password reset holds a recovery session, so the login page does not redirect
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const recoveryEmail = useRef<string | null>(null);
  // Lost authenticator: the password session's token, kept while the emailed code replaces the session
  const passwordSessionToken = useRef<string | null>(null);
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);
  // Demo mode: authenticator secret shown during setup, saved once its first code checks out
  const [pendingDemoSecret, setPendingDemoSecret] = useState<string | null>(null);
  // Demo mode stand-in for an AAL2 session
  const [mfaVerifiedAt, setMfaVerifiedAt] = useState<number | null>(() => {
    const saved = localStorage.getItem(MFA_TIMESTAMP_KEY);
    return saved ? parseInt(saved, 10) : null;
  });

  const isAal2 = mfaStatus === 'verified' || mfaStatus === 'not_required';

  useEffect(() => {
    if (mfaVerifiedAt) {
      localStorage.setItem(MFA_TIMESTAMP_KEY, mfaVerifiedAt.toString());
    } else {
      localStorage.removeItem(MFA_TIMESTAMP_KEY);
    }
  }, [mfaVerifiedAt]);

  // Every role needs an aal2 (TOTP) session; the database enforces the same rule
  const refreshMfa = async (profile: Profile | null) => {
    if (!profile) {
      setMfaStatus('not_required');
      return;
    }
    if (!live) {
      // Read storage directly: state may still hold a timestamp cleared in this same tick
      const verifiedAt = Number(localStorage.getItem(MFA_TIMESTAMP_KEY) || 0);
      if (verifiedAt && Date.now() - verifiedAt < SECURITY_RULES.MFA_MAX_AGE_MS) setMfaStatus('verified');
      else setMfaStatus(getDemoTotpSecret(profile.id) ? 'challenge' : 'enroll');
      return;
    }
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || !data) {
      setMfaStatus('challenge');
    } else if (data.currentLevel === 'aal2') {
      setMfaStatus('verified');
    } else {
      setMfaStatus(data.nextLevel === 'aal2' ? 'challenge' : 'enroll');
    }
  };

  const loadProfile = async (userId: string) => {
    const profile = await fetchCurrentProfile(userId);
    setCurrentUser(profile);
    await refreshMfa(profile);
    return profile;
  };

  // Demo mode: local personas only. Every sign-in asks for a fresh authenticator code.
  const signInDemo = async (email: string, details?: DemoRegistration) => {
    const isAdmin = DEMO_ADMIN_EMAILS.includes(email);
    const userId = isAdmin ? COORDINATOR.ID : `student-${email.split('@')[0]}`;
    const fallbackName = email
      .split('@')[0]
      .split('.')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
    const profile = await upsertProfile({
      id: userId,
      university_email: email,
      full_name: isAdmin ? COORDINATOR.FULL_NAME : details?.fullName || fallbackName,
      role: isAdmin ? 'admin' : 'student',
      department: isAdmin ? INSTITUTION.DEPARTMENTS.IPR_CELL : details?.department || INSTITUTION.DEPARTMENTS.CSE,
      registration_number: details?.registrationNumber || null,
      phone: details?.phone || null,
    });
    localStorage.setItem(LOCAL_AUTH_USER_KEY, profile.id);
    localStorage.removeItem(MFA_TIMESTAMP_KEY);
    setMfaVerifiedAt(null);
    setCurrentUser(profile);
    await refreshMfa(profile);
    return profile;
  };

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    async function initAuth() {
      try {
        if (live) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!isMounted) return;
          // A profile exists only once the mailbox is verified
          if (session?.user) await loadProfile(session.user.id);

          const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            // Deferred: awaiting Supabase calls inside this callback can deadlock the auth client
            setTimeout(() => {
              if (!isMounted) return;
              if (session?.user) {
                void loadProfile(session.user.id);
              } else {
                setCurrentUser(null);
                setMfaStatus('not_required');
              }
            }, 0);
          });
          authSubscription = authListener.subscription;
        } else {
          const savedUserId = localStorage.getItem(LOCAL_AUTH_USER_KEY);
          if (savedUserId && isMounted) await loadProfile(savedUserId);
        }
      } catch (err) {
        console.error('Error initializing authentication:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithEmail = async (email: string, password?: string, captchaToken?: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!isAllowedUniversityEmail(normalizedEmail)) {
        return { error: SECURITY_RULES.RESTRICTED_EMAIL_ERROR };
      }
      if (!password) {
        return { error: 'Please enter your account password to verify identity.' };
      }

      if (live) {
        // Failures never fall back to demo profiles
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
          options: { captchaToken },
        });
        if (error) {
          if (error.code === 'email_not_confirmed') {
            return {
              needsVerification: true,
              error: 'Your university email is not verified yet. Send yourself a code and enter it below.',
            };
          }
          if (error.code === 'captcha_failed') return { error: 'Please complete the security check and try again.' };
          return { error: 'Invalid email or password.' };
        }
        const profile = await loadProfile(data.user.id);
        if (!profile) return { error: 'Your account is not active yet. Please contact the IPR cell.' };
        return {};
      }

      // Demo mode mirrors the live rule: an unverified address must enter an emailed code first
      if (!isDemoVerified(normalizedEmail)) {
        return {
          needsVerification: true,
          error: 'Your university email is not verified yet. Send yourself a code and enter it below.',
        };
      }
      await signInDemo(normalizedEmail);
      return {};
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Authentication failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const registerUniversityAccount: AuthContextType['registerUniversityAccount'] = async (details) => {
    setIsLoading(true);
    try {
      const normalizedEmail = details.email.trim().toLowerCase();
      if (!isAllowedUniversityEmail(normalizedEmail)) {
        return { error: SECURITY_RULES.RESTRICTED_EMAIL_ERROR };
      }
      if (!details.password || details.password.length < 6) {
        return { error: 'Password must be at least 6 characters in length.' };
      }
      if (!details.fullName || details.fullName.trim().length < 2) {
        return { error: 'Please enter your full legal name as registered in university records.' };
      }

      if (live) {
        // Supabase Auth emails a 6-digit code; the account works only after verifyEmailCode.
        // An already-registered address gets the same response and no email (no account enumeration).
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: details.password,
          options: {
            captchaToken: details.captchaToken,
            data: {
              full_name: details.fullName.trim(),
              department: details.department?.trim() || null,
              registration_number: details.registrationNumber?.trim() || null,
              phone: details.phone?.trim() || null,
            },
          },
        });
        if (error) {
          if (error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit') {
            return { error: 'Too many requests. Please wait a minute and try again.' };
          }
          if (error.code === 'captcha_failed') return { error: 'Please complete the security check and try again.' };
          return { error: error.message || 'Failed to register university account.' };
        }
        // "Confirm email" off in the dashboard: Supabase signs the new account in at once
        if (data.session) {
          await loadProfile(data.session.user.id);
          return {};
        }
        return { needsVerification: true };
      }

      saveDemoRegistration(normalizedEmail, {
        fullName: details.fullName.trim(),
        department: details.department?.trim(),
        registrationNumber: details.registrationNumber?.trim(),
        phone: details.phone?.trim(),
      });
      return { needsVerification: true, demoCode: issueDemoCode(normalizedEmail) };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmailCode = async (email: string, code: string, captchaToken?: string): Promise<AuthResult> => {
    if (!isOtpCode(code)) return { error: 'Enter the 6-digit code from the email.' };
    if (!live) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!checkDemoCode(normalizedEmail, code)) return { error: GENERIC_CODE_ERROR };
      await signInDemo(normalizedEmail, takeDemoRegistration(normalizedEmail));
      return {};
    }
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code,
      type: 'email',
      options: { captchaToken },
    });
    if (error || !data.user) return { error: GENERIC_CODE_ERROR };
    const profile = await loadProfile(data.user.id);
    return profile ? {} : { error: 'Your email is verified, but the account is not active yet. Please contact the IPR cell.' };
  };

  const resendEmailCode = async (email: string, captchaToken?: string): Promise<AuthResult> => {
    if (!live) return { demoCode: issueDemoCode(email.trim().toLowerCase()) };
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: { captchaToken },
    });
    if (error?.code === 'over_email_send_rate_limit' || error?.code === 'over_request_rate_limit') {
      return { error: 'Please wait before requesting another code.' };
    }
    if (error?.code === 'captcha_failed') return { error: 'Please complete the security check and try again.' };
    // Any other outcome looks the same, so the response does not reveal whether the address is registered
    return {};
  };

  const enrollTotp: AuthContextType['enrollTotp'] = async () => {
    if (!live) {
      const secret = generateTotpSecret();
      setPendingDemoSecret(secret);
      return { qrCode: '', secret, otpauthUri: otpauthUri(secret, currentUser?.university_email || 'coordinator') };
    }
    const { data: factors } = await supabase.auth.mfa.listFactors();
    // A previous enrollment that was never confirmed would block a new one
    for (const factor of factors?.all ?? []) {
      if (factor.factor_type === 'totp' && factor.status === 'unverified') {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
    }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'MUJ Patent Portal' });
    if (error || !data) return { error: error?.message || 'Could not start authenticator setup.' };
    setPendingFactorId(data.id);
    return { qrCode: data.totp.qr_code, secret: data.totp.secret };
  };

  const verifyTotpMfa = async (code: string): Promise<boolean> => {
    const trimmed = code.trim();
    if (!isOtpCode(trimmed)) return false;
    if (!live) {
      if (!currentUser) return false;
      const secret = pendingDemoSecret ?? getDemoTotpSecret(currentUser.id);
      if (!secret || !(await verifyTotp(secret, trimmed))) return false;
      if (pendingDemoSecret) {
        saveDemoTotpSecret(currentUser.id, pendingDemoSecret);
        setPendingDemoSecret(null);
      }
      const now = Date.now();
      localStorage.setItem(MFA_TIMESTAMP_KEY, String(now));
      setMfaVerifiedAt(now);
      setMfaStatus('verified');
      return true;
    }
    let factorId = pendingFactorId;
    if (!factorId) {
      const { data } = await supabase.auth.mfa.listFactors();
      factorId = data?.totp[0]?.id ?? null;
    }
    if (!factorId) return false;
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: trimmed });
    if (error) return false;
    setPendingFactorId(null);
    await refreshMfa(currentUser);
    return true;
  };

  const rateLimitError = (code?: string) =>
    code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit'
      ? 'Too many emails were requested. Please wait a few minutes and try again.'
      : code === 'captcha_failed'
      ? 'Please complete the security check and try again.'
      : null;

  // Forgot password, step 1: Supabase emails a 6-digit recovery code (same reply whether or not the account exists)
  const requestPasswordReset: AuthContextType['requestPasswordReset'] = async (email, captchaToken) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!isAllowedUniversityEmail(normalizedEmail)) return { error: SECURITY_RULES.RESTRICTED_EMAIL_ERROR };
    if (!live) return isDemoVerified(normalizedEmail) ? { demoCode: issueDemoCode(normalizedEmail) } : {};
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { captchaToken });
    const limited = rateLimitError(error?.code);
    return limited ? { error: limited } : {};
  };

  // Step 2: the code opens a recovery session. Accounts with an authenticator must also pass TOTP (step 3).
  const verifyPasswordResetCode: AuthContextType['verifyPasswordResetCode'] = async (email, code, captchaToken) => {
    if (!isOtpCode(code)) return { error: 'Enter the 6-digit code from the email.' };
    const normalizedEmail = email.trim().toLowerCase();
    setPasswordRecovery(true);
    if (!live) {
      if (!checkDemoCode(normalizedEmail, code)) {
        setPasswordRecovery(false);
        return { error: GENERIC_CODE_ERROR };
      }
      recoveryEmail.current = normalizedEmail;
      return {};
    }
    const { error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: code,
      type: 'recovery',
      options: { captchaToken },
    });
    if (error) {
      setPasswordRecovery(false);
      return { error: GENERIC_CODE_ERROR };
    }
    recoveryEmail.current = normalizedEmail;
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return { needsTotp: data?.nextLevel === 'aal2' && data.currentLevel !== 'aal2' };
  };

  // Step 3: new password (plus the authenticator code when the account has one), then sign out
  const completePasswordReset: AuthContextType['completePasswordReset'] = async (newPassword, totp) => {
    if (newPassword.length < 6) return { error: 'Password must be at least 6 characters in length.' };
    if (!live) {
      setPasswordRecovery(false);
      recoveryEmail.current = null;
      return {};
    }
    if (totp) {
      const { data } = await supabase.auth.mfa.listFactors();
      const factorId = data?.totp[0]?.id;
      if (!factorId || (await supabase.auth.mfa.challengeAndVerify({ factorId, code: totp.trim() })).error) {
        return { error: 'That authenticator code did not match. Try the current code.', needsTotp: true };
      }
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      if (error.code === 'insufficient_aal') {
        return { error: 'Enter the code from your authenticator app to change the password.', needsTotp: true };
      }
      if (error.code === 'same_password') return { error: 'Choose a password you have not used for this account.' };
      if (error.code === 'weak_password') return { error: error.message };
      return { error: 'The password could not be changed. Request a new code and try again.' };
    }
    await supabase.auth.signOut();
    setCurrentUser(null);
    setMfaStatus('not_required');
    setPasswordRecovery(false);
    recoveryEmail.current = null;
    return {};
  };

  const cancelPasswordReset = async () => {
    if (live && passwordRecovery) {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setMfaStatus('not_required');
    }
    setPasswordRecovery(false);
    recoveryEmail.current = null;
  };

  // Lost authenticator, step 1: the student is signed in with their password (aal1); email them a code
  const sendAuthenticatorResetCode: AuthContextType['sendAuthenticatorResetCode'] = async (captchaToken) => {
    if (!currentUser) return { error: 'Please sign in again.' };
    if (currentUser.role !== 'student') return { error: 'Coordinators and super admins: ask a super admin to reset your authenticator.' };
    if (!live) return { demoCode: issueDemoCode(currentUser.university_email) };
    const { data } = await supabase.auth.getSession();
    passwordSessionToken.current = data.session?.access_token ?? null;
    const { error } = await supabase.auth.signInWithOtp({
      email: currentUser.university_email,
      options: { shouldCreateUser: false, captchaToken },
    });
    const limited = rateLimitError(error?.code);
    if (limited) return { error: limited };
    return error ? { error: 'The code could not be sent. Please try again shortly.' } : {};
  };

  // Step 2: the emailed code plus the earlier password session prove both factors; the server removes the
  // old authenticator and the gate asks for a new one
  const confirmAuthenticatorReset: AuthContextType['confirmAuthenticatorReset'] = async (code, captchaToken) => {
    if (!currentUser) return { error: 'Please sign in again.' };
    if (!isOtpCode(code)) return { error: 'Enter the 6-digit code from the email.' };
    if (!live) {
      if (!checkDemoCode(currentUser.university_email, code)) return { error: GENERIC_CODE_ERROR };
      removeDemoTotpSecret(currentUser.id);
      setMfaStatus('enroll');
      return {};
    }
    const passwordToken = passwordSessionToken.current;
    if (!passwordToken) return { error: 'Please send a new code first.' };
    const { error } = await supabase.auth.verifyOtp({
      email: currentUser.university_email,
      token: code,
      type: 'email',
      options: { captchaToken },
    });
    if (error) return { error: GENERIC_CODE_ERROR };
    const { error: resetError } = await supabase.functions.invoke('reset-authenticator', {
      body: { password_access_token: passwordToken },
    });
    passwordSessionToken.current = null;
    if (resetError) return { error: 'The authenticator could not be reset. Sign out, sign in again and retry.' };
    await supabase.auth.refreshSession();
    await refreshMfa(currentUser);
    return {};
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (live) await supabase.auth.signOut();
      localStorage.removeItem(LOCAL_AUTH_USER_KEY);
      localStorage.removeItem(MFA_TIMESTAMP_KEY);
      setCurrentUser(null);
      setMfaVerifiedAt(null);
      setMfaStatus('not_required');
    } finally {
      setIsLoading(false);
    }
  };

  const switchUserRoleForTesting = async (role: AppRole) => {
    setIsLoading(true);
    try {
      const targetId = role === 'admin' ? COORDINATOR.ID : DEMO_PERSONAS.STUDENT_ADITYA.id;
      const profile = await fetchCurrentProfile(targetId);
      if (profile) {
        setCurrentUser(profile);
        localStorage.setItem(LOCAL_AUTH_USER_KEY, profile.id);
        setMfaVerifiedAt(role === 'admin' ? Date.now() : null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        signInWithEmail,
        registerUniversityAccount,
        verifyEmailCode,
        resendEmailCode,
        signOut,
        switchUserRoleForTesting,
        isAal2,
        mfaStatus,
        enrollTotp,
        verifyTotpMfa,
        passwordRecovery,
        requestPasswordReset,
        verifyPasswordResetCode,
        completePasswordReset,
        cancelPasswordReset,
        sendAuthenticatorResetCode,
        confirmAuthenticatorReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from './useAuth';
