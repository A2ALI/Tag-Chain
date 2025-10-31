import { createClient } from '@supabase/supabase-js';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get query parameters
    const region = event.queryStringParameters?.region;
    const severity = event.queryStringParameters?.severity;
    const limit = event.queryStringParameters?.limit || '10';

    // Server-side client using service role key
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build the query
    let query = supabase
      .from('ews_disease_alerts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Filter by region if provided
    if (region) {
      query = query.eq('region', region);
    }

    // Filter by severity if provided
    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data: alerts, error } = await query;

    if (error) {
      console.error('Error fetching EWS alerts:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch EWS alerts' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: alerts || [],
        error: null
      })
    };
  } catch (error) {
    console.error('Error in EWS list-alerts:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}