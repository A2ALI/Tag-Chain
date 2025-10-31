import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function handler(event: any, context: any) {
  try {
    // Parse the request body
    const { user_id, farm_id, notify_email, notify_push } = JSON.parse(event.body || '{}');
    
    // Validate required fields
    if (!user_id || !farm_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: user_id and farm_id'
        })
      };
    }
    
    // Insert subscription record
    const { data, error } = await supabase
      .from('ews_subscriptions')
      .insert({
        user_id,
        farm_id,
        notify_email: notify_email !== undefined ? notify_email : true,
        notify_push: notify_push !== undefined ? notify_push : false,
        created_at: new Date()
      })
      .select();
    
    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
    
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Subscription created successfully',
        subscription: data[0]
      })
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to create subscription',
        message: error.message
      })
    };
  }
}