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
    const animalId = event.queryStringParameters?.animalId;
    const vetId = event.queryStringParameters?.vetId;

    // Server-side client using service role key
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build the query
    let query = supabase
      .from('vet_records')
      .select(`
        *,
        animals(tag_id, breed),
        users(name)
      `)
      .order('date', { ascending: false });

    // Filter by animal ID if provided
    if (animalId) {
      query = query.eq('animal_id', animalId);
    }

    // Filter by vet ID if provided
    if (vetId) {
      query = query.eq('vet_id', vetId);
    }

    const { data: vetRecords, error } = await query;

    if (error) {
      console.error('Error fetching vet records:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch vet records' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: vetRecords || [],
        error: null
      })
    };
  } catch (error) {
    console.error('Error in vet list-records:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}