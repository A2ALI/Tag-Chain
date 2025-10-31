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

    // Fetch abattoir facilities
    const { data: abattoirs, error } = await supabase
      .from('abattoirs')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching abattoirs:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch abattoirs' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: abattoirs || [],
        error: null
      })
    };
  } catch (error) {
    console.error('Error in abattoir list:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}