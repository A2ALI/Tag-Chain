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

    // Fetch certificates grouped by state
    const { data: certificates, error: fetchError } = await supabase
      .from('certificates')
      .select('state');
    
    if (fetchError) {
      console.error('Error fetching certificates:', fetchError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch certificates' })
      };
    }

    // Group and count certificates by state manually
    const stateCounts: { [key: string]: number } = {};
    certificates.forEach((cert: any) => {
      stateCounts[cert.state] = (stateCounts[cert.state] || 0) + 1;
    });

    // Format the data for the frontend
    const certificationData = Object.keys(stateCounts).map(state => ({
      state,
      count: stateCounts[state]
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: certificationData,
        error: null
      })
    };
  } catch (error) {
    console.error('Error in certifications by state:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}