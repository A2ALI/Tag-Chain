import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import Flutterwave from 'flutterwave-node-v3';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Flutterwave
const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY!, process.env.FLW_SECRET_KEY!);

interface OfframpRequest {
  userId: string;
  amount_token: number;
  token: string;
  payout_currency: string;
  payout_method: string;
  destination_account: string;
}

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { userId, amount_token, token, payout_currency, payout_method, destination_account } = JSON.parse(event.body || '{}') as OfframpRequest;

    // Validate required fields
    if (!userId || !amount_token || !token || !payout_currency || !payout_method || !destination_account) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Get rate engine for conversion
    // This would typically call our rate engine service
    const rate = await getConversionRate(token, payout_currency);
    const amount_local = amount_token * rate;

    // Create withdrawal record
    const withdrawalId = uuidv4();
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('onchain_withdrawals')
      .insert({
        id: withdrawalId,
        user_id: userId,
        amount: amount_token,
        token: token,
        to_address: destination_account,
        status: 'PENDING',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error('Error creating withdrawal:', withdrawalError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Failed to create withdrawal' }),
      };
    }

    // Create fiat payout record
    const payoutId = uuidv4();
    const { data: payout, error: payoutError } = await supabase
      .from('fiat_payouts')
      .insert({
        id: payoutId,
        user_id: userId,
        amount_local: amount_local,
        currency: payout_currency,
        status: 'PENDING',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (payoutError) {
      console.error('Error creating payout:', payoutError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Failed to create payout' }),
      };
    }

    // Call Flutterwave Transfer API
    const transferData = {
      account_bank: payout_method,
      account_number: destination_account,
      amount: amount_local,
      narration: `TagChain withdrawal for user ${userId}`,
      currency: payout_currency,
      reference: payoutId,
      callback_url: process.env.FLW_WEBHOOK_URL || 'https://yourdomain.com/.netlify/functions/flutterwave-webhook',
      debit_currency: payout_currency
    };

    // Use real Flutterwave SDK call
    const response = await flw.Transfer.initiate(transferData);

    // Check if transfer initiation was successful
    if (response.status !== 'success') {
      throw new Error(`Flutterwave transfer initiation failed: ${response.message}`);
    }

    // Update payout record with transfer ID
    await supabase
      .from('fiat_payouts')
      .update({
        flw_transfer_id: response.data.id
      })
      .eq('id', payoutId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        withdrawalId: withdrawalId,
        payoutId: payoutId,
        transfer_id: response.data.id,
        message: 'Withdrawal initiated successfully'
      }),
    };
  } catch (error: any) {
    console.error('Error in offramp:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};

// Mock function for rate conversion - would be replaced with actual rate engine
async function getConversionRate(fromToken: string, toCurrency: string): Promise<number> {
  // This is a placeholder - in reality, this would call our rate engine
  // For now, we'll return a fixed rate for demonstration
  if (fromToken === 'TAGUSD' && toCurrency === 'NGN') {
    return 1500; // 1 TAGUSD = 1500 NGN (example rate)
  }
  return 1; // Default 1:1 rate
}