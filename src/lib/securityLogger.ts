import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for privileged access
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

// Only create Supabase client if URL and key are provided
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Log a security event to the security_events table
 * @param eventDetails - Details of the security event
 */
export async function logSecurityEvent(eventDetails: {
  userId?: string;
  event: string;
  severity: 'low' | 'medium' | 'high' | 'info' | 'warning' | 'critical';
  details?: string;
  tx_hash?: string;
  wallet_address?: string;
}) {
  // If Supabase is not configured, just log to console
  if (!supabase) {
    console.log('[SECURITY LOG]', eventDetails);
    return { success: true };
  }
  
  try {
    // Sanitize input to prevent injection attacks
    const sanitizedDetails = eventDetails.details 
      ? eventDetails.details.substring(0, 1000) // Limit details length
      : null;
      
    const sanitizedTxHash = eventDetails.tx_hash 
      ? eventDetails.tx_hash.substring(0, 100)
      : null;
      
    const sanitizedWalletAddress = eventDetails.wallet_address 
      ? eventDetails.wallet_address.substring(0, 100)
      : null;

    // Insert the security event
    const { error } = await supabase
      .from('security_events')
      .insert({
        user_id: eventDetails.userId,
        event_type: eventDetails.event,
        severity: eventDetails.severity,
        message: sanitizedDetails,
        tx_hash: sanitizedTxHash,
        wallet_address: sanitizedWalletAddress,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging security event:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in logSecurityEvent:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Log a wallet connection event
 * @param userId - User ID
 * @param walletAddress - Wallet address
 * @param provider - Wallet provider
 */
export async function logWalletConnect(userId: string, walletAddress: string, provider: string) {
  return await logSecurityEvent({
    userId,
    event: 'wallet_connect',
    severity: 'info',
    details: `User connected wallet with ${provider}`,
    wallet_address: walletAddress
  });
}

/**
 * Log a wallet disconnection event
 * @param userId - User ID
 * @param walletAddress - Wallet address
 */
export async function logWalletDisconnect(userId: string, walletAddress: string) {
  return await logSecurityEvent({
    userId,
    event: 'wallet_disconnect',
    severity: 'info',
    details: 'User disconnected wallet',
    wallet_address: walletAddress
  });
}

/**
 * Log a failed wallet connection attempt
 * @param userId - User ID (if available)
 * @param error - Error message
 * @param attempts - Number of failed attempts
 */
export async function logFailedWalletConnect(userId: string | null, error: string, attempts: number = 1) {
  const severity = attempts > 3 ? 'warning' : 'info';
  
  return await logSecurityEvent({
    userId: userId || undefined,
    event: 'failed_wallet_connect',
    severity,
    details: `Failed wallet connect attempt (${attempts}): ${error}`
  });
}