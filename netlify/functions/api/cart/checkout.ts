import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { hederaManager } from '../../lib/hederaManager';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { items, buyer_id } = JSON.parse(event.body);

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Items array is required and cannot be empty' })
      };
    }

    if (!buyer_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Buyer ID is required' })
      };
    }

    // Server-side client using service role key
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Group items by seller
    const itemsBySeller: { [sellerId: string]: any[] } = {};
    for (const item of items) {
      const sellerId = item.seller_id;
      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = [];
      }
      itemsBySeller[sellerId].push(item);
    }

    // Create transactions and escrow records for each seller
    const results: any[] = [];
    for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
      // Calculate total amount for this seller
      const totalAmount = sellerItems.reduce((sum, item) => sum + (item.price || 0), 0);

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert([
          {
            buyer_id: buyer_id,
            farmer_id: sellerId,
            amount: totalAmount,
            currency: 'USDC',
            escrow_status: 'pending'
          }
        ])
        .select()
        .single();

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to create transaction for seller ' + sellerId })
        };
      }

      // Create escrow log record
      const { data: escrowLog, error: escrowError } = await supabase
        .from('escrow_logs')
        .insert([
          {
            transaction_id: transaction.id,
            message: 'cart.checkout:init',
            topic_id: process.env.VITE_HEDERA_TOPIC_ESCROW,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (escrowError) {
        console.error('Error creating escrow log:', escrowError);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to create escrow log for seller ' + sellerId })
        };
      }

      // If FEATURE_ONCHAIN is enabled, submit HCS message
      let hcsTxId: string | null = null;
      if (process.env.FEATURE_ONCHAIN === 'true') {
        try {
          const messagePayload = {
            type: 'escrow.create',
            version: '1.0',
            escrow_id: `escrow-${uuidv4()}`,
            transaction_id: transaction.id,
            buyer_on_chain_id: `TAGCHAIN:USER:${buyer_id}`,
            seller_on_chain_id: `TAGCHAIN:USER:${sellerId}`,
            amount: totalAmount.toString(),
            currency: 'USDC',
            status: 'initiated',
            timestamp: new Date().toISOString(),
            items: sellerItems.map(item => ({
              animal_id: item.animal_id,
              price: item.price
            }))
          };

          try {
            const result = await hederaManager.submitTopicMessage(process.env.VITE_HEDERA_TOPIC_ESCROW!, messagePayload);
            hcsTxId = result.txId;
          } catch (e) {
            console.error('Error submitting HCS message via hederaManager:', e);
          }

          // Update escrow_logs with hcs_tx_id
          const { error: updateLogError } = await supabase
            .from('escrow_logs')
            .update({ hcs_tx_id: hcsTxId })
            .eq('id', escrowLog.id);

          if (updateLogError) {
            console.error('Error updating escrow log with hcs_tx_id:', updateLogError);
          }

          // Update transactions with hcs_tx_id
          const { error: updateTransactionError } = await supabase
            .from('transactions')
            .update({ hcs_tx_id: hcsTxId })
            .eq('id', transaction.id);

          if (updateTransactionError) {
            console.error('Error updating transaction with hcs_tx_id:', updateTransactionError);
          }
        } catch (hcsError) {
          console.error('Error submitting HCS message via hederaManager:', hcsError);
        }
      }

      results.push({
        seller_id: sellerId,
        transaction_id: transaction.id,
        escrow_log_id: escrowLog.id,
        hcs_tx_id: hcsTxId,
        amount: totalAmount,
        items: sellerItems
      });
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'Checkout completed successfully',
        results: results
      })
    };
  } catch (error) {
    console.error('Error in cart checkout:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}