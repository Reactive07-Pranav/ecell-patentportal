import { describe, it, expect, beforeEach } from 'vitest';
import { base32Decode, base32Encode, generateTotpSecret, totpCode, verifyTotp } from '../features/auth/totp';
import { generateOtpCode, isOtpCode } from '../features/auth/otp';
import { checkDemoCode, isDemoVerified, issueDemoCode, DEMO_CODE_TTL_MS } from '../features/auth/demoAuth';

// RFC 6238 appendix B, SHA-1 seed "12345678901234567890" (last 6 digits of the 8-digit vectors)
const RFC_SECRET = base32Encode(new TextEncoder().encode('12345678901234567890'));

describe('TOTP (RFC 6238)', () => {
  it('matches the RFC test vectors', async () => {
    expect(RFC_SECRET).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    expect(await totpCode(RFC_SECRET, 59_000)).toBe('287082');
    expect(await totpCode(RFC_SECRET, 1_111_111_109_000)).toBe('081804');
    expect(await totpCode(RFC_SECRET, 1_234_567_890_000)).toBe('005924');
    expect(await totpCode(RFC_SECRET, 20_000_000_000_000)).toBe('353130');
  });

  it('accepts one step of clock drift but not two', async () => {
    const t = 1_111_111_109_000;
    const code = await totpCode(RFC_SECRET, t);
    expect(await verifyTotp(RFC_SECRET, code, t + 30_000)).toBe(true);
    expect(await verifyTotp(RFC_SECRET, code, t + 61_000)).toBe(false);
  });

  it('round-trips base32 secrets of 160 bits', () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(base32Encode(base32Decode(secret))).toBe(secret);
  });
});

describe('verification codes', () => {
  it('generates 6-digit codes', () => {
    for (let i = 0; i < 2000; i++) expect(isOtpCode(generateOtpCode())).toBe(true);
  });
});

describe('demo email code rules', () => {
  beforeEach(() => localStorage.clear());

  it('works once and marks the address verified', () => {
    const code = issueDemoCode('new@muj.manipal.edu');
    expect(isDemoVerified('new@muj.manipal.edu')).toBe(false);
    expect(checkDemoCode('NEW@muj.manipal.edu', code)).toBe(true);
    expect(isDemoVerified('new@muj.manipal.edu')).toBe(true);
    expect(checkDemoCode('new@muj.manipal.edu', code)).toBe(false);
  });

  it('dies after 5 wrong attempts and after 10 minutes', () => {
    const now = 1_000_000;
    const code = issueDemoCode('a@muj.manipal.edu', now);
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) expect(checkDemoCode('a@muj.manipal.edu', wrong, now)).toBe(false);
    expect(checkDemoCode('a@muj.manipal.edu', code, now)).toBe(false);

    const late = issueDemoCode('b@muj.manipal.edu', now);
    expect(checkDemoCode('b@muj.manipal.edu', late, now + DEMO_CODE_TTL_MS + 1)).toBe(false);
  });

  it('replaces the previous code on resend', () => {
    const first = issueDemoCode('c@muj.manipal.edu');
    let second = issueDemoCode('c@muj.manipal.edu');
    while (second === first) second = issueDemoCode('c@muj.manipal.edu');
    expect(checkDemoCode('c@muj.manipal.edu', first)).toBe(false);
    expect(checkDemoCode('c@muj.manipal.edu', second)).toBe(true);
  });

  it('treats seeded demo personas as verified', () => {
    expect(isDemoVerified('aditya.sharma@muj.manipal.edu')).toBe(true);
    expect(isDemoVerified('patent.admin@muj.manipal.edu')).toBe(true);
  });
});
