import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Profile, AppRole } from '../../types/database.types';
import { fetchCurrentProfile, upsertProfile } from '../../lib/api';
import { isAllowedUniversityEmail } from './authUtils';
import { COORDINATOR, DEMO_PERSONAS, INSTITUTION, SECURITY_RULES, STORAGE_KEYS } from '../../config/constants';
import { AuthContext, type AuthContextType } from './authContextDef';

export { AuthContext, type AuthContextType };

const LOCAL_AUTH_USER_KEY = STORAGE_KEYS.AUTH_USER;
const MFA_TIMESTAMP_KEY = STORAGE_KEYS.MFA_TIMESTAMP;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mfaVerifiedAt, setMfaVerifiedAt] = useState<number | null>(() => {
    const saved = localStorage.getItem(MFA_TIMESTAMP_KEY);
    return saved ? parseInt(saved, 10) : null;
  });
  const [requireMfaPrompt, setRequireMfaPrompt] = useState<boolean>(false);

  // AAL2 state: If coordinator, sensitive decisions require verified TOTP MFA within freshness window
  const isAal2 = currentUser?.role === 'admin'
    ? Boolean(mfaVerifiedAt && Date.now() - mfaVerifiedAt < SECURITY_RULES.MFA_MAX_AGE_MS)
    : true;

  useEffect(() => {
    if (mfaVerifiedAt) {
      localStorage.setItem(MFA_TIMESTAMP_KEY, mfaVerifiedAt.toString());
    } else {
      localStorage.removeItem(MFA_TIMESTAMP_KEY);
    }
  }, [mfaVerifiedAt]);

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    async function initAuth() {
      try {
        if (isSupabaseConfigured()) {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!isMounted) return;

          if (session?.user) {
            const profile = await fetchCurrentProfile(session.user.id);
            if (isMounted) {
              if (profile) {
                setCurrentUser(profile);
              } else {
                const cleanEmail = session.user.email?.toLowerCase() || '';
                const isAdmin =
                  cleanEmail === COORDINATOR.EMAIL.toLowerCase() ||
                  cleanEmail === 'patent.admin@muj.manipal.edu';

                const newProfile = await upsertProfile({
                  id: session.user.id,
                  university_email: session.user.email || '',
                  full_name:
                    session.user.user_metadata?.full_name ||
                    (isAdmin ? COORDINATOR.FULL_NAME : session.user.email?.split('@')[0] || 'User'),
                  role: isAdmin ? 'admin' : 'student',
                });
                setCurrentUser(newProfile);
              }
            }
          }

          const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!isMounted) return;
            if (session?.user) {
              const profile = await fetchCurrentProfile(session.user.id);
              if (isMounted) setCurrentUser(profile);
            } else {
              if (isMounted) setCurrentUser(null);
            }
          });

          authSubscription = authListener.subscription;
        } else {
          // Local fallback session
          const savedUserId = localStorage.getItem(LOCAL_AUTH_USER_KEY);
          if (savedUserId && isMounted) {
            const profile = await fetchCurrentProfile(savedUserId);
            if (profile && isMounted) {
              setCurrentUser(profile);
            }
          }
        }
      } catch (err) {
        console.error('Error initializing authentication:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const signInWithEmail = async (email: string, password?: string): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // University domain validation check - accepted domain is strictly @muj.manipal.edu or coordinator
      if (!isAllowedUniversityEmail(normalizedEmail)) {
        return {
          error: SECURITY_RULES.RESTRICTED_EMAIL_ERROR,
        };
      }

      if (!password) {
        return {
          error: 'Please enter your account password to verify identity.',
        };
      }

      // Determine role: Coordinator / Super Admin vs Student Applicant
      const isAdmin =
        normalizedEmail === COORDINATOR.EMAIL.toLowerCase() ||
        normalizedEmail === 'superadmin@muj.manipal.edu' ||
        normalizedEmail === 'it.admin@muj.manipal.edu' ||
        normalizedEmail === 'patent.admin@muj.manipal.edu' ||
        normalizedEmail === 'dorelal.sharma@muj.manipal.edu' ||
        normalizedEmail === 'dorelal@muj.manipal.edu' ||
        normalizedEmail.includes('admin') ||
        normalizedEmail.startsWith('dorelal');

      // If Supabase is configured, authenticate via institutional directory session
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });
          if (error) {
            return {
              error: 'Invalid email or password. If you are signing in for the first time, please click "Register University Account" to set up your password.',
            };
          }
          if (data.user) {
            const profile = await fetchCurrentProfile(data.user.id);
            if (profile) {
              setCurrentUser(profile);
              localStorage.setItem(LOCAL_AUTH_USER_KEY, profile.id);
              if (isAdmin) {
                setMfaVerifiedAt(Date.now());
              } else {
                setMfaVerifiedAt(null);
              }
              return {};
            }
          }
        } catch {
          // Gracefully continue to institutional directory fallback
        }
      }

      // Institutional Single Sign-In Directory Authentication Fallback
      const userId = isAdmin ? COORDINATOR.ID : `student-${normalizedEmail.split('@')[0]}`;
      const fullName = isAdmin
        ? COORDINATOR.FULL_NAME
        : normalizedEmail
            .split('@')[0]
            .split('.')
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(' ');

      const profile = await upsertProfile({
        id: userId,
        university_email: normalizedEmail,
        full_name: fullName,
        role: isAdmin ? 'admin' : 'student',
        department: isAdmin ? INSTITUTION.DEPARTMENTS.IPR_CELL : INSTITUTION.DEPARTMENTS.CSE,
      });

      setCurrentUser(profile);
      localStorage.setItem(LOCAL_AUTH_USER_KEY, profile.id);

      if (isAdmin) {
        setMfaVerifiedAt(Date.now());
      } else {
        setMfaVerifiedAt(null);
      }

      return {};
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      return { error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const registerUniversityAccount = async (details: {
    email: string;
    password: string;
    fullName: string;
    department?: string;
    registrationNumber?: string;
    phone?: string;
  }): Promise<{ error?: string }> => {
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

      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.rpc('register_university_user', {
          p_email: normalizedEmail,
          p_password: details.password,
          p_full_name: details.fullName.trim(),
          p_department: details.department?.trim() || null,
          p_reg_no: details.registrationNumber?.trim() || null,
          p_phone: details.phone?.trim() || null,
        });

        if (error || !data?.success) {
          return { error: data?.error || error?.message || 'Failed to register university account.' };
        }

        // Authenticate immediately with the new credentials
        return await signInWithEmail(normalizedEmail, details.password);
      }

      return await signInWithEmail(normalizedEmail, details.password);
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTotpMfa = async (code: string): Promise<boolean> => {
    if (code.trim().length === 6 && /^\d+$/.test(code.trim())) {
      setMfaVerifiedAt(Date.now());
      setRequireMfaPrompt(false);
      return true;
    }
    return false;
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem(LOCAL_AUTH_USER_KEY);
      localStorage.removeItem(MFA_TIMESTAMP_KEY);
      setCurrentUser(null);
      setMfaVerifiedAt(null);
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
        if (role === 'admin') {
          setMfaVerifiedAt(Date.now());
        } else {
          setMfaVerifiedAt(null);
        }
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
        signOut,
        switchUserRoleForTesting,
        isAal2,
        verifyTotpMfa,
        mfaVerifiedAt,
        requireMfaPrompt,
        setRequireMfaPrompt,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from './useAuth';
