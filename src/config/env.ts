/**
 * Application Environment Configuration
 * Centralized access to Vite environment variables with type safety and fallback defaults.
 */

export const ENV = {
  SUPABASE_URL: (import.meta.env.VITE_SUPABASE_URL as string) || 'https://mock-instance.supabase.co',
  SUPABASE_ANON_KEY: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'mock-key',
  PORTAL_BASE_URL: (import.meta.env.VITE_PORTAL_BASE_URL as string) || 'https://patents.muj.manipal.edu',
  INSTITUTION_NAME: (import.meta.env.VITE_INSTITUTION_NAME as string) || 'Manipal University Jaipur',
  INSTITUTION_SHORT_NAME: (import.meta.env.VITE_INSTITUTION_SHORT_NAME as string) || 'MUJ',
  INSTITUTION_WEBSITE_URL: (import.meta.env.VITE_INSTITUTION_WEBSITE_URL as string) || 'https://jaipur.manipal.edu',
  IPR_CELL_URL: (import.meta.env.VITE_IPR_CELL_URL as string) || 'https://jaipur.manipal.edu/research/ipr-cell',
  CONTACT_EMAIL: (import.meta.env.VITE_CONTACT_EMAIL as string) || 'ipr.cell@muj.manipal.edu',
  COORDINATOR_NAME: (import.meta.env.VITE_COORDINATOR_NAME as string) || 'Dr. Dorelal Sharma',
  COORDINATOR_EMAIL: (import.meta.env.VITE_COORDINATOR_EMAIL as string) || 'dorelal.coordinator@muj.manipal.edu',
  ALLOWED_EMAIL_DOMAIN: (import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN as string) || 'muj.manipal.edu',
  STORAGE_BUCKET_DOCS: (import.meta.env.VITE_STORAGE_BUCKET_DOCS as string) || 'patent-documents',
  STORAGE_BUCKET_DRAWINGS: (import.meta.env.VITE_STORAGE_BUCKET_DRAWINGS as string) || 'patent-drawings',
  APP_ENV: (import.meta.env.VITE_APP_ENV as string) || (import.meta.env.MODE as string) || 'development',
  ENABLE_MOCK_FALLBACK: import.meta.env.VITE_ENABLE_MOCK_FALLBACK !== 'false',
} as const;

export type AppEnvironment = typeof ENV;
