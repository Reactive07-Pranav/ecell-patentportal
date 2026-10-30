import { createContext } from 'react';
import type { Profile, AppRole } from '../../types/database.types';

export interface AuthResult {
  error?: string;
  // The account exists but its mailbox is not verified yet: show the code step
  needsVerification?: boolean;
  // Demo mode only: the code that would have been emailed, shown in an on-page demo inbox
  demoCode?: string;
}

// 'enroll' / 'challenge': a coordinator or super admin must pass TOTP before admin pages load
export type MfaStatus = 'not_required' | 'enroll' | 'challenge' | 'verified';

export interface AuthContextType {
  currentUser: Profile | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password?: string, captchaToken?: string) => Promise<AuthResult>;
  registerUniversityAccount: (details: {
    email: string;
    password: string;
    fullName: string;
    department?: string;
    registrationNumber?: string;
    phone?: string;
    captchaToken?: string;
  }) => Promise<AuthResult>;
  verifyEmailCode: (email: string, code: string, captchaToken?: string) => Promise<AuthResult>;
  resendEmailCode: (email: string, captchaToken?: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  switchUserRoleForTesting: (role: AppRole) => Promise<void>;
  isAal2: boolean;
  mfaStatus: MfaStatus;
  // qrCode is empty in demo mode, where setup uses the key or otpauthUri instead
  enrollTotp: () => Promise<{ qrCode: string; secret: string; otpauthUri?: string } | { error: string }>;
  verifyTotpMfa: (code: string) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
