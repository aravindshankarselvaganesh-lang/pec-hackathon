import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawSupabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

/**
 * Safely sanitizes and validates a Supabase endpoint URL.
 * Guarantees a valid HTTP/HTTPS URL string so createClient never throws during Vercel CI or build time.
 */
function sanitizeSupabaseUrl(rawUrl: string | undefined): string {
  const fallbackUrl = 'https://placeholder.supabase.co';
  if (!rawUrl || typeof rawUrl !== 'string') return fallbackUrl;

  const trimmed = rawUrl.trim();
  if (
    !trimmed ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed.includes('your-project-id')
  ) {
    return fallbackUrl;
  }

  const candidate =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return candidate;
    }
  } catch {
    // Malformed URL string
  }

  return fallbackUrl;
}

/**
 * Safely sanitizes a Supabase Anon / Publishable API key.
 */
function sanitizeSupabaseKey(rawKey: string | undefined): string {
  const fallbackKey = 'placeholder-anon-key';
  if (!rawKey || typeof rawKey !== 'string') return fallbackKey;

  const trimmed = rawKey.trim();
  if (
    !trimmed ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed.includes('your-anon-key') ||
    trimmed.endsWith('...')
  ) {
    return fallbackKey;
  }

  return trimmed;
}

export const isSupabaseConfigured = (): boolean => {
  const url = sanitizeSupabaseUrl(rawSupabaseUrl);
  const key = sanitizeSupabaseKey(rawSupabaseAnonKey);

  return (
    url !== 'https://placeholder.supabase.co' &&
    !url.includes('your-project-id') &&
    key !== 'placeholder-anon-key' &&
    key.length >= 20 &&
    !key.includes('your-anon-key') &&
    !key.endsWith('...')
  );
};

const createSafeClient = (): SupabaseClient => {
  const targetUrl = sanitizeSupabaseUrl(rawSupabaseUrl);
  const targetKey = sanitizeSupabaseKey(rawSupabaseAnonKey);

  try {
    return createClient(targetUrl, targetKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('[RushLess] Warning: Failed to initialize Supabase client, using dummy client:', err);
    return createClient('https://placeholder.supabase.co', 'placeholder-anon-key');
  }
};

export const supabase: SupabaseClient = createSafeClient();
