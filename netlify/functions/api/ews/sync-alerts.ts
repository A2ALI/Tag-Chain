import { createClient } from '@supabase/supabase-js';

// This is a simplified example. In a real implementation, you would integrate with
// actual data sources like OpenWeather or FAO APIs to fetch live alerts.
export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Server-side client using service role key
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // In a real implementation, you would fetch live data from external sources
    // For now, we'll simulate this with sample data
    const sampleAlerts = [
      {
        disease_name: 'Foot and Mouth Disease',
        region: 'Northern Region',
        severity: 'high',
        description: 'Confirmed outbreak in 3 farms. Movement restrictions in place.',
        source: 'Ministry of Agriculture',
        alert_date: new Date().toISOString(),
        expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      },
      {
        disease_name: 'Lumpy Skin Disease',
        region: 'Eastern Region',
        severity: 'medium',
        description: 'Suspected cases reported. Vaccination recommended.',
        source: 'Veterinary Services',
        alert_date: new Date().toISOString(),
        expiry_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
      },
      {
        disease_name: 'Blue Tongue',
        region: 'Southern Region',
        severity: 'low',
        description: 'Increased vector activity detected. Monitor livestock.',
        source: 'Animal Health Institute',
        alert_date: new Date().toISOString(),
        expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      }
    ];

    // Insert the alerts into the database
    const { data: insertedAlerts, error } = await supabase
      .from('ews_disease_alerts')
      .insert(sampleAlerts)
      .select();

    if (error) {
      console.error('Error inserting EWS alerts:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to sync EWS alerts' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: insertedAlerts,
        message: `Synced ${insertedAlerts?.length || 0} alerts`,
        error: null
      })
    };
  } catch (error) {
    console.error('Error in EWS sync-alerts:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}