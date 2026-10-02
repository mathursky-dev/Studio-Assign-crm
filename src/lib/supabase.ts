import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variable sources (Vite/Vercel standard prefix: VITE_)
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// In-memory runtime override if env vars are configured through setup UI
let runtimeUrl: string | null = null;
let runtimeAnonKey: string | null = null;

let supabaseInstance: SupabaseClient | null = null;

/**
 * Validates that an API key is strictly an anon/publishable key and NEVER a service_role key.
 */
export function validateAnonKey(key: string): { valid: boolean; isServiceRole: boolean; error?: string } {
  if (!key || typeof key !== 'string') {
    return { valid: false, isServiceRole: false, error: 'Key is missing or empty' };
  }

  const trimmed = key.trim();

  // Basic check for obvious service role substrings
  if (trimmed.toLowerCase().includes('service_role') || trimmed.startsWith('sbp_')) {
    return {
      valid: false,
      isServiceRole: true,
      error: 'CRITICAL SECURITY VIOLATION: service_role or admin key detected! Frontend must NEVER use service_role.',
    };
  }

  // Attempt to parse JWT payload to check role claim
  try {
    const parts = trimmed.split('.');
    if (parts.length === 3) {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson = JSON.parse(atob(payloadBase64));
      
      if (payloadJson.role === 'service_role') {
        return {
          valid: false,
          isServiceRole: true,
          error: 'CRITICAL SECURITY VIOLATION: JWT payload specifies role="service_role". Secret keys are strictly prohibited in the client!',
        };
      }
    }
  } catch {
    // If not a standard JWT or cannot decode, will still proceed if not containing service_role
  }

  return { valid: true, isServiceRole: false };
}

/**
 * Get the effective Supabase URL and Anon Key.
 */
export function getSupabaseConfig(): {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'runtime' | 'none';
  securityViolation: boolean;
  securityMessage?: string;
} {
  const url = runtimeUrl || envUrl;
  const anonKey = runtimeAnonKey || envAnonKey;

  const keyValidation = validateAnonKey(anonKey);

  if (keyValidation.isServiceRole) {
    return {
      url,
      anonKey: '',
      isConfigured: false,
      source: runtimeUrl ? 'runtime' : 'env',
      securityViolation: true,
      securityMessage: keyValidation.error,
    };
  }

  const isConfigured = Boolean(url && anonKey && url.startsWith('http'));
  const source = runtimeUrl ? 'runtime' : envUrl ? 'env' : 'none';

  return {
    url,
    anonKey,
    isConfigured,
    source,
    securityViolation: false,
  };
}

/**
 * Update runtime credentials (held only in memory, never persisted as fake data).
 */
export function setRuntimeCredentials(url: string, anonKey: string): { success: boolean; error?: string } {
  const keyValidation = validateAnonKey(anonKey);
  if (keyValidation.isServiceRole) {
    return {
      success: false,
      error: keyValidation.error || 'service_role key rejected.',
    };
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return {
      success: false,
      error: 'Invalid Supabase URL. Must start with https:// (e.g. https://your-project.supabase.co)',
    };
  }

  runtimeUrl = url.trim();
  runtimeAnonKey = anonKey.trim();
  supabaseInstance = null; // Reset cached client
  return { success: true };
}

/**
 * Clear runtime credentials
 */
export function clearRuntimeCredentials() {
  runtimeUrl = null;
  runtimeAnonKey = null;
  supabaseInstance = null;
}

/**
 * Returns the single active Supabase Client instance (Single Source of Truth).
 * Does not fall back to browser storage.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured || config.securityViolation) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return supabaseInstance;
}
