import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function handler(event: any, context: any) {
  try {
    // Parse query parameters
    const { user_id, farm_id, limit = 50, offset = 0 } = event.queryStringParameters || {};
    
    // Validate required fields
    if (!user_id && !farm_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields: either user_id or farm_id'
        })
      };
    }
    
    // Build query
    let query = supabase
      .from('ews_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Filter by farm_id if provided
    if (farm_id) {
      query = query.eq('farm_id', farm_id);
    }
    
    // If filtering by user_id, we need to join with farms to get user's farms
    if (user_id && !farm_id) {
      // First get the user's farms
      const { data: farms, error: farmsError } = await supabase
        .from('farms')
        .select('id')
        .eq('owner_id', user_id);
      
      if (farmsError) {
        throw new Error(`Failed to fetch user farms: ${farmsError.message}`);
      }
      
      if (!farms || farms.length === 0) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            alerts: [],
            count: 0
          })
        };
      }
      
      const farmIds = farms.map(farm => farm.id);
      query = query.in('farm_id', farmIds);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch alerts: ${error.message}`);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        alerts: data,
        count: count || data.length
      })
    };
  } catch (error) {
    console.error('Error fetching alerts:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to fetch alerts',
        message: error.message
      })
    };
  }
}