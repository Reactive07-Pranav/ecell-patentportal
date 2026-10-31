// Demo mode only (no Supabase configured): simulates the emailed verification code and the
// coordinator's authenticator app inside this browser, with the same rules the live backend
// applies. Nothing here is a security control; the live portal uses Supabase Auth instead.
import { COORDINATOR, DEMO_PERSONAS } from '../../config/constants';
import { generateOtpCode } from './otp';

const CODES_KEY = 'muj_patent_portal_demo_codes';
const VERIFIED_KEY = 'muj_patent_portal_demo_verified';
const PENDING_KEY = 'muj_patent_portal_demo_pending';
const TOTP_KEY = 'muj_patent_portal_demo_totp';

export const DEMO_CODE_TTL_MS = 10 * 60 * 1000;
export const DEMO_CODE_MAX_ATTEMPTS = 5;

interface DemoCode {
  code: string;
  expiresAt: number;
  attempts: number;
}

export interface DemoRegistration {
  fullName: string;
  department?: string;
  registrationNumber?: string;
  phone?: string;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

const norm = (email: string) => email.trim().toLowerCase();

// Seeded demo personas count as already verified
const SEEDED = [
  DEMO_PERSONAS.STUDENT_ADITYA.email,
  DEMO_PERSONAS.STUDENT_PRIYA.email,
  COORDINATOR.EMAIL,
  'patent.admin@muj.manipal.edu',
].map(norm);

export function isDemoVerified(email: string): boolean {
  return SEEDED.includes(norm(email)) || read<string[]>(VERIFIED_KEY, []).includes(norm(email));
}

export function saveDemoRegistration(email: string, details: DemoRegistration): void {
  write(PENDING_KEY, { ...read<Record<string, DemoRegistration>>(PENDING_KEY, {}), [norm(email)]: details });
}

export function takeDemoRegistration(email: string): DemoRegistration | undefined {
  const pending = read<Record<string, DemoRegistration>>(PENDING_KEY, {});
  const details = pending[norm(email)];
  delete pending[norm(email)];
  write(PENDING_KEY, pending);
  return details;
}

/** Issues a fresh code for the address; any earlier code stops working. */
export function issueDemoCode(email: string, now = Date.now()): string {
  const code = generateOtpCode();
  write(CODES_KEY, {
    ...read<Record<string, DemoCode>>(CODES_KEY, {}),
    [norm(email)]: { code, expiresAt: now + DEMO_CODE_TTL_MS, attempts: 0 },
  });
  return code;
}

/** Single use, 10-minute expiry, 5 wrong attempts kill the code. Marks the address verified on success. */
export function checkDemoCode(email: string, code: string, now = Date.now()): boolean {
  const codes = read<Record<string, DemoCode>>(CODES_KEY, {});
  const entry = codes[norm(email)];
  if (!entry || entry.expiresAt < now || entry.attempts >= DEMO_CODE_MAX_ATTEMPTS) return false;
  if (entry.code !== code) {
    entry.attempts += 1;
    write(CODES_KEY, codes);
    return false;
  }
  delete codes[norm(email)];
  write(CODES_KEY, codes);
  write(VERIFIED_KEY, Array.from(new Set([...read<string[]>(VERIFIED_KEY, []), norm(email)])));
  return true;
}

export function getDemoTotpSecret(userId: string): string | null {
  return read<Record<string, string>>(TOTP_KEY, {})[userId] ?? null;
}

export function saveDemoTotpSecret(userId: string, secret: string): void {
  write(TOTP_KEY, { ...read<Record<string, string>>(TOTP_KEY, {}), [userId]: secret });
}
