import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function handler(event: any, context: any) {
  try {
    // Parse the request body
    const { subscription_id, user_id, farm_id } = JSON.parse(event.body || '{}');
    
    // Validate required fields
    if (!subscription_id && (!user_id || !farm_id)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: either subscription_id or both user_id and farm_id'
        })
      };
    }
    
    let result: any;
    
    // Delete by subscription_id if provided
    if (subscription_id) {
      const { data, error } = await supabase
        .from('ews_subscriptions')
        .delete()
        .eq('id', subscription_id)
        .select();
      
      if (error) {
        throw new Error(`Failed to delete subscription: ${error.message}`);
      }
      
      result = { data, error: null };
    } else {
      // Delete by user_id and farm_id
      const { data, error } = await supabase
        .from('ews_subscriptions')
        .delete()
        .eq('user_id', user_id)
        .eq('farm_id', farm_id)
        .select();
      
      if (error) {
        throw new Error(`Failed to delete subscription: ${error.message}`);
      }
      
      result = { data, error: null };
    }
    
    if (result.error) {
      throw new Error(`Failed to delete subscription: ${result.error.message}`);
    }
    
    if (result.data.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Subscription not found'
        })
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Subscription deleted successfully',
        deleted: result.data[0]
      })
    };
  } catch (error) {
    console.error('Error deleting subscription:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to delete subscription',
        message: error.message
      })
    };
  }
}