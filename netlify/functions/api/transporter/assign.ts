import { createClient } from '@supabase/supabase-js';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const { transport_id, scheduled_pickup } = JSON.parse(event.body);

    // Validate required fields
    if (!transport_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required field: transport_id' })
      };
    }

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
        body: JSON.stringify({ error: 'Only transporters can assign deliveries' })
      };
    }

    // Update the transport record
    const { data: transport, error: updateError } = await supabase
      .from('transports')
      .update({
        transporter_id: user.id,
        status: 'assigned',
        scheduled_pickup: scheduled_pickup || new Date().toISOString()
      })
      .eq('id', transport_id)
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
      .single();

    if (updateError) {
      console.error('Error assigning transport:', updateError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to assign transport' })
      };
    }

    if (!transport) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Transport not found' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: transport,
        error: null
      })
    };
  } catch (error) {
    console.error('Error in transporter assign:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}