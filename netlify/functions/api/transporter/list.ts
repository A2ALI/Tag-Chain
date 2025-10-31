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

    // Get the authenticated user
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Missing authorization header' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid authorization token' })
      };
    }

    // Verify the user is a transporter
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'transporter') {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Only transporters can view available deliveries' })
      };
    }

    // Fetch available transports (pending assignments)
    const { data: transports, error } = await supabase
      .from('transports')
      .select(`
        *,
        animals(tag_id, breed),
        escrow_logs(
          id,
          amount,
          currency,
          status
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transports:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch transports' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: transports || [],
        error: null
      })
    };
  } catch (error) {
    console.error('Error in transporter list:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}