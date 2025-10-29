import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for privileged access
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
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
    
    // Remove user's wallet information from the database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        wallet_type: null,
        onchain_id: null,
        onchain_address: null
      })
      .eq('id', user.id)
      .select('id')
      .single();
    
    if (updateError) {
      console.error('Error removing user wallet info:', updateError);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: 'Failed to remove wallet information'
        })
      };
    }
    
    // Log the event to security_events
    const { error: logError } = await supabase
      .from('security_events')
      .insert({
        event_type: 'wallet_disconnect',
        severity: 'info',
        user_id: user.id,
        message: 'User disconnected wallet',
        timestamp: new Date().toISOString()
      });
    
    if (logError) {
      console.error('Error logging wallet disconnect event:', logError);
      // Don't fail the request if logging fails, but log the error
    }
    
    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Wallet disconnected successfully'
      })
    };
    
  } catch (error: any) {
    console.error('Error in wallet disconnect:', error);
    
    // Log the error to security_events
    try {
      await supabase
        .from('security_events')
        .insert({
          event_type: 'wallet_disconnect_error',
          severity: 'warning',
          message: `Wallet disconnect error: ${error.message}`,
          timestamp: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Error logging wallet disconnect error:', logError);
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