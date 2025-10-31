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
    const userId = event.queryStringParameters?.userId;

    // Server-side client using service role key
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build query for escrow logs
    let query = supabase
      .from('escrow_logs')
      .select(`
        *,
        transactions (
          buyer_id,
          farmer_id,
          amount,
          currency,
          escrow_status,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    // Filter by user if provided
    if (userId) {
      query = query.or(`transactions.buyer_id.eq.${userId},transactions.farmer_id.eq.${userId}`);
    }

    const { data: escrowLogs, error } = await query;

    if (error) {
      console.error('Error fetching escrow logs:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch escrow logs' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: escrowLogs || [],
        error: null
      })
    };
  } catch (error) {
    console.error('Error in escrow list:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}