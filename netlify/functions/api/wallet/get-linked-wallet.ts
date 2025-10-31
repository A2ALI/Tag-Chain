import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for privileged access
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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
  
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
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
    
    // Get user's wallet information from the database
    const { data: userData, error: selectError } = await supabase
      .from('users')
      .select('wallet_type, onchain_id, onchain_address')
      .eq('id', user.id)
      .single();
    
    if (selectError) {
      console.error('Error fetching user wallet info:', selectError);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: 'Failed to fetch wallet information'
        })
      };
    }
    
    // Check if user has a linked wallet
    if (!userData.wallet_type || !userData.onchain_address) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          linked: false,
          message: 'No wallet linked to this account'
        })
      };
    }
    
    // Return wallet information
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        linked: true,
        wallet: {
          wallet_type: userData.wallet_type,
          onchain_address: userData.onchain_address
        }
      })
    };
    
  } catch (error: any) {
    console.error('Error in get linked wallet:', error);
    
    // Log the error to security_events
    try {
      await supabase
        .from('security_events')
        .insert({
          event_type: 'get_linked_wallet_error',
          severity: 'warning',
          message: `Get linked wallet error: ${error.message}`,
          timestamp: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging get linked wallet error:', logError);
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