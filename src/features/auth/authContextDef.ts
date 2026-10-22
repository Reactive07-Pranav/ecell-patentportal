import { createContext } from 'react';
import type { Profile, AppRole } from '../../types/database.types';

export interface AuthContextType {
  currentUser: Profile | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password?: string) => Promise<{ error?: string }>;
  registerUniversityAccount: (details: {
    email: string;
    password: string;
    fullName: string;
    department?: string;
    registrationNumber?: string;
    phone?: string;
  }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  switchUserRoleForTesting: (role: AppRole) => Promise<void>;
  isAal2: boolean;
  verifyTotpMfa: (code: string) => Promise<boolean>;
  mfaVerifiedAt: number | null;
  requireMfaPrompt: boolean;
  setRequireMfaPrompt: (open: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
