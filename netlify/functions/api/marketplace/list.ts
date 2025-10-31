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

    // Fetch all active marketplace listings with animal and seller details
    const { data: listings, error } = await supabase
      .from('marketplace_listings')
      .select(`
        *,
        animals (
          id,
          tag_number,
          breed,
          age,
          image_cid
        ),
        users (
          id,
          full_name
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch marketplace listings' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: listings || [],
        error: null
      })
    };
  } catch (error) {
    console.error('Error in marketplace list:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}