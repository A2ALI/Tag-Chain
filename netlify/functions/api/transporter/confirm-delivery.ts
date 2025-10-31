import { createClient } from '@supabase/supabase-js';
import { Client, TransferTransaction, Hbar } from '@hashgraph/sdk';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const { transport_id } = JSON.parse(event.body);

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
        body: JSON.stringify({ error: 'Only transporters can confirm deliveries' })
      };
    }

    // Fetch the transport record
    const { data: transport, error: fetchError } = await supabase
      .from('transports')
      .select(`
        *,
        escrow_logs(
          id,
          amount,
          currency,
          status,
          buyer_id,
          farmer_id
        )
      `)
      .eq('id', transport_id)
      .eq('transporter_id', user.id)
      .single();

    if (fetchError || !transport) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Transport not found or not assigned to this transporter' })
      };
    }

    // Update the transport record to mark as delivered
    const { data: updatedTransport, error: updateError } = await supabase
      .from('transports')
      .update({
        status: 'delivered',
        actual_delivery: new Date().toISOString()
      })
      .eq('id', transport_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating transport status:', updateError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update transport status' })
      };
    }

    // In a real implementation, we would process the crypto payment here
    // For now, we'll simulate this with a mock transaction
    let paymentTx: string | null = null;
    try {
      // This is a simplified example - in a real implementation you would:
      // 1. Connect to Hedera with operator credentials
      // 2. Create a transfer transaction
      // 3. Execute the transaction
      // 4. Get the transaction ID
      
      // For now, we'll simulate this with a mock transaction ID
      paymentTx = `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}`;
      
      // Update the transport record with the payment transaction
      await supabase
        .from('transports')
        .update({ payment_tx: paymentTx })
        .eq('id', transport_id);
    } catch (paymentError) {
      console.error('Error processing payment:', paymentError);
      // We don't return an error here because the delivery was successfully confirmed
    }

    // Create hash for on-chain storage
    const deliveryData = {
      transport_id,
      transporter_id: user.id,
      delivery_date: new Date().toISOString(),
      payment_tx: paymentTx
    };

    const deliveryString = JSON.stringify(deliveryData);
    const onChainHash = Buffer.from(deliveryString).toString('base64');

    // Update the transport record with the on-chain hash
    await supabase
      .from('transports')
      .update({ on_chain_hash: onChainHash })
      .eq('id', transport_id);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: { ...updatedTransport, payment_tx: paymentTx, on_chain_hash: onChainHash },
        error: null
      })
    };
  } catch (error) {
    console.error('Error in transporter confirm-delivery:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}