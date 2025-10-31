/// <reference types="vite/client" />

/**
 * Application Configuration
 * 
 * This file exports environment variables that are safe to use in the browser.
 * All variables prefixed with VITE_ are bundled into the client-side code.
 * 
 * IMPORTANT: Never put server secrets (like SUPABASE_SERVICE_ROLE_KEY) here!
 * Server secrets should only be used in Netlify Functions.
 */

export const config = {
  // Supabase Configuration (Client-side safe)
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  
  // Hedera Configuration (Public values - safe to expose)
  VITE_HEDERA_NETWORK: import.meta.env.VITE_HEDERA_NETWORK || 'testnet',
  VITE_HEDERA_TOPIC_ANIMALS: import.meta.env.VITE_HEDERA_TOPIC_ANIMALS || '',
  VITE_HEDERA_TOPIC_ESCROW: import.meta.env.VITE_HEDERA_TOPIC_ESCROW || '',
  VITE_HEDERA_TOKEN_ID: import.meta.env.VITE_HEDERA_TOKEN_ID || '',
  VITE_HEDERA_ESCROW_CONTRACT_ID: import.meta.env.VITE_HEDERA_ESCROW_CONTRACT_ID || '',
  
  // Flutterwave Configuration (Public key - safe to expose)
  VITE_FLUTTERWAVE_PUBLIC_KEY: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '',
  
  // Feature Flags (fallback to non-VITE versions for compatibility)
  VITE_FEATURE_ONCHAIN: (import.meta.env.VITE_FEATURE_ONCHAIN || import.meta.env.FEATURE_ONCHAIN) === 'true',
  VITE_FEATURE_WALLET: (import.meta.env.VITE_FEATURE_WALLET || import.meta.env.FEATURE_WALLET_CONNECT) === 'true',
  VITE_FEATURE_EWS: (import.meta.env.VITE_FEATURE_EWS || import.meta.env.FEATURE_EWS) === 'true',
} as const;

// Type-safe environment variables
export type Config = typeof config;

