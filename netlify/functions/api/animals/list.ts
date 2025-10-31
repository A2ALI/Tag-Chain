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

    // Get query parameters
    const ownerId = event.queryStringParameters?.ownerId;
    const unverified = event.queryStringParameters?.unverified === 'true';

    let query = supabase.from('animals').select('*').order('registered_at', { ascending: false }).limit(200);

    // Filter by owner if provided
    if (ownerId) {
      query = query.eq('farmer_id', ownerId);
    }

    // Filter for unverified animals if requested
    if (unverified) {
      query = query.is('verified_at', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching animals:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch animals', details: error.message })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data, error: null })
    };
  } catch (error) {
    console.error('Error in animals list:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}