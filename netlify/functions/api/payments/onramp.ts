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

interface OnrampRequest {
  userId: string;
  amount_local: number;
  currency: string;
  payment_method: string;
  metadata?: any;
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
    const { userId, amount_local, currency, payment_method, metadata } = JSON.parse(event.body || '{}') as OnrampRequest;

    // Validate required fields
    if (!userId || !amount_local || !currency || !payment_method) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Create pending record in onchain_inbound_events
    const eventId = uuidv4();
    const { data: inboundEvent, error: inboundError } = await supabase
      .from('onchain_inbound_events')
      .insert({
        id: eventId,
        user_id: userId,
        type: 'FIAT_DEPOSIT',
        amount: amount_local,
        token: 'TAGUSD',
        status: 'PENDING',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (inboundError) {
      console.error('Error creating inbound event:', inboundError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Failed to create inbound event' }),
      };
    }

    // Call Flutterwave payment initiation
    const paymentData = {
      tx_ref: eventId,
      amount: amount_local,
      currency: currency,
      redirect_url: process.env.FLW_REDIRECT_URL || 'http://localhost:5173/dashboard',
      payment_options: payment_method,
      customer: {
        email: metadata?.email || 'user@example.com',
        phonenumber: metadata?.phone || '',
        name: metadata?.name || 'TagChain User'
      },
      meta: {
        userId: userId,
        eventId: eventId,
        ...metadata
      }
    };

    // Use real Flutterwave SDK call
    const response = await flw.Payment.initiate(paymentData);

    // Check if payment initiation was successful
    if (response.status !== 'success') {
      throw new Error(`Flutterwave payment initiation failed: ${response.message}`);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: eventId,
        payment_link: response.data.link,
        message: 'Payment initiated successfully'
      }),
    };
  } catch (error: any) {
    console.error('Error in onramp:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};