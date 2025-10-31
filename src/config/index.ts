// Lightweight runtime validation for client-side envs.
// We avoid pulling zod into the client bundle to keep dependencies small.

function ensureString(key: string, value: unknown, required = true): string | undefined {
  if (value == null) {
    if (required) throw new Error(`Missing required env var: ${key}`);
    return undefined;
  }
  if (typeof value !== 'string') throw new Error(`Expected string for env var ${key}`);
  return value;
}

const raw = import.meta.env as Record<string, unknown>;

const VITE_SUPABASE_URL = ensureString('VITE_SUPABASE_URL', raw.VITE_SUPABASE_URL);
try {
  // basic URL validation
  new URL(VITE_SUPABASE_URL as string);
} catch (e) {
  throw new Error('VITE_SUPABASE_URL is not a valid URL');
}

export const config = {
  VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: ensureString('VITE_SUPABASE_ANON_KEY', raw.VITE_SUPABASE_ANON_KEY),
  VITE_FEATURE_ONCHAIN: (raw.VITE_FEATURE_ONCHAIN as string | undefined) || 'false',
  VITE_HEDERA_TOPIC_USERS: raw.VITE_HEDERA_TOPIC_USERS as string | undefined,
  VITE_HEDERA_TOPIC_ANIMALS: raw.VITE_HEDERA_TOPIC_ANIMALS as string | undefined,
  VITE_HEDERA_TOPIC_CERTS: raw.VITE_HEDERA_TOPIC_CERTS as string | undefined,
  VITE_HEDERA_TOPIC_ESCROW: raw.VITE_HEDERA_TOPIC_ESCROW as string | undefined,
};