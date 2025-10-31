import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for privileged access
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { buyer_id, amount, currency, escrow_tx } = JSON.parse(event.body);

    // Validate input
    if (!buyer_id || !amount || !currency) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Buyer ID, amount, and currency are required' })
      };
    }

    // Create transaction record
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          buyer_id,
          amount,
          currency,
          escrow_tx,
          status: 'pending_escrow',
          escrow_status: 'pending',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to create transaction' })
      };
    }

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        transaction: data
      })
    };
  } catch (error) {
    console.error('Error in transaction create:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}