import { createClient } from '@supabase/supabase-js';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Server-side client using service role key
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch latest EWS forecasts joined with farm metadata
    const { data: forecasts, error: forecastsError } = await supabase
      .from('ews_forecasts')
      .select(`
        *,
        farms (id, name, gps_lat, gps_lng)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (forecastsError) {
      console.error('Error fetching forecasts:', forecastsError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch forecasts', details: forecastsError.message })
      };
    }

    // Fetch latest EWS alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('ews_alerts')
      .select(`
        *,
        farms (id, name, gps_lat, gps_lng)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch alerts', details: alertsError.message })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: {
          forecasts: forecasts || [],
          alerts: alerts || []
        }, 
        error: null 
      })
    };
  } catch (error) {
    console.error('Error in EWS list:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}