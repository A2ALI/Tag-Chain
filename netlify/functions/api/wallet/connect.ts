import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for privileged access
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Simple in-memory rate limiter
const rateLimiter = new Map();

const isRateLimited = (userId: string) => {
  const now = Date.now();
  const userLimit = rateLimiter.get(userId);
  
  if (!userLimit || now - userLimit.lastReset > 60000) { // Reset every minute
    rateLimiter.set(userId, {
      count: 1,
      lastReset: now
    });
    return false;
  }
  
  if (userLimit.count >= 5) { // Max 5 requests per minute
    return true;
  }
  
  userLimit.count++;
  return false;
};

exports.handler = async function(event: any, context: any) {
  // Check if wallet connect feature is enabled
  if (process.env.FEATURE_WALLET_CONNECT !== 'true') {
    return {
      statusCode: 501,
      body: JSON.stringify({
        success: false,
        error: 'Wallet connect feature is not enabled'
      })
    };
  }
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed'
      })
    };
  }
  
  try {
    // Get the user from the session
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          error: 'Unauthorized: No authorization header'
        })
      };
    }
    
    // Verify the user session
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          error: 'Unauthorized: Invalid session'
        })
      };
    }
    
    // Check rate limit
    if (isRateLimited(user.id)) {
      return {
        statusCode: 429,
        body: JSON.stringify({
          success: false,
          error: 'Too many requests. Please try again later.'
        })
      };
    }
    
    // Parse the request body
    const { provider, account } = JSON.parse(event.body || '{}');
    
    // Validate input
    if (!provider || !account) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Missing provider or account'
        })
      };
    }
    
    // Validate provider
    const validProviders = ['hashpack', 'blade', 'walletconnect'];
    if (!validProviders.includes(provider)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Invalid provider. Must be one of: hashpack, blade, walletconnect'
        })
      };
    }
    
    // Validate account format (Hedera account ID format)
    const hederaAccountRegex = /^0\.0\.\d+$/;
    if (!hederaAccountRegex.test(account)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Invalid account format. Must be a valid Hedera account ID (e.g., 0.0.123456)'
        })
      };
    }
    
    // Validate input length
    if (account.length > 100) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Account too long'
        })
      };
    }
    
    // Update user's wallet information in the database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        wallet_type: provider,
        onchain_id: account,
        onchain_address: account
      })
      .eq('id', user.id)
      .select('id, wallet_type, onchain_id, onchain_address')
      .single();
    
    if (updateError) {
      console.error('Error updating user wallet info:', updateError);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: 'Failed to update wallet information'
        })
      };
    }
    
    // Log the event to security_events
    const { error: logError } = await supabase
      .from('security_events')
      .insert({
        event_type: 'wallet_connect',
        severity: 'info',
        user_id: user.id,
        wallet_address: account,
        message: `User connected wallet with ${provider}`,
        timestamp: new Date().toISOString()
      });
    
    if (logError) {
      console.error('Error logging wallet connect event:', logError);
      // Don't fail the request if logging fails, but log the error
    }
    
    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        user: {
          id: updatedUser.id,
          wallet_type: updatedUser.wallet_type,
          onchain_address: updatedUser.onchain_address
        }
      })
    };
    
  } catch (error: any) {
    console.error('Error in wallet connect:', error);
    
    // Log the error to security_events
    // Note: We don't have user context here if there was an error, so we'll log with minimal info
    try {
      await supabase
        .from('security_events')
        .insert({
          event_type: 'wallet_connect_error',
          severity: 'warning',
          message: `Wallet connect error: ${error.message}`,
          timestamp: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging wallet connect error:', logError);
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    };
  }
};