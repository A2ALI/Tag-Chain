import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

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
    const { userId } = JSON.parse(event.body);

    // Validate input
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' })
      };
    }

    // Generate on-chain ID
    const onChainId = `TAGCHAIN:USER:${randomUUID()}`;

    // Get existing user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Update user with on-chain ID
    // Wallet address will be set when user connects their wallet
    const { error: updateError } = await supabase
      .from('users')
      .update({
        on_chain_id: onChainId
      })
      .eq('id', userId);

    if (updateError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update user' })
      };
    }

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        onChainId,
        walletAddress: user.wallet_address
      })
    };
  } catch (error) {
    console.error('Error in create-onchain:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}
