import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

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
    const { transaction_id, raised_by_user_id, reason } = JSON.parse(event.body);

    // Validate input
    if (!transaction_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Transaction ID is required' })
      };
    }

    if (!raised_by_user_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Raised by user ID is required' })
      };
    }

    if (!reason) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Reason is required' })
      };
    }

    // Verify transaction exists
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transaction_id)
      .single();

    if (transactionError) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Transaction not found' })
      };
    }

    let hcsTxId: string | null = null;

    // If FEATURE_ONCHAIN is enabled, submit HCS message
    if (process.env.FEATURE_ONCHAIN === 'true') {
      try {
        const messagePayload = {
          type: 'escrow.dispute',
          version: '1.0',
          transaction_id: transaction_id,
          raised_by_user_id: raised_by_user_id,
          reason: reason,
          timestamp: new Date().toISOString()
        };

        try {
          const result = await (await import('../../lib/hederaManager')).hederaManager.submitTopicMessage(process.env.VITE_HEDERA_TOPIC_ESCROW!, messagePayload);
          hcsTxId = result.txId;
        } catch (e) {
          console.error('Error submitting HCS message via hederaManager:', e);
        }
        
        // Insert escrow_logs with hcs_tx_id
        const { data: logData, error: logError } = await supabase
          .from('escrow_logs')
          .insert([
            {
              transaction_id: transaction_id,
              message: 'escrow.dispute',
              topic_id: process.env.VITE_HEDERA_TOPIC_ESCROW,
              hcs_tx_id: hcsTxId,
              created_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (logError) {
          console.error('Error inserting escrow log:', logError);
        }

        // Update transactions with hcs_tx_id and status
        const { error: updateTransactionError } = await supabase
          .from('transactions')
          .update({ 
            hcs_tx_id: hcsTxId,
            escrow_status: 'disputed'
          })
          .eq('id', transaction_id);

        if (updateTransactionError) {
          console.error('Error updating transaction:', updateTransactionError);
        }
      } catch (hcsError) {
        console.error('Error in escrow dispute:', hcsError);
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            success: false,
            error: 'Failed to dispute escrow',
            message: hcsError instanceof Error ? hcsError.message : 'Unknown error occurred'
          })
        };
      }
    } else {
      // If FEATURE_ONCHAIN is disabled, only update DB
      // Insert escrow_logs
      const { data: logData, error: logError } = await supabase
        .from('escrow_logs')
        .insert([
          {
            transaction_id: transaction_id,
            message: 'escrow.dispute',
            topic_id: process.env.VITE_HEDERA_TOPIC_ESCROW,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (logError) {
        console.error('Error inserting escrow log:', logError);
      }

      // Update transactions status only
      const { error: updateTransactionError } = await supabase
        .from('transactions')
        .update({ 
          escrow_status: 'disputed'
        })
        .eq('id', transaction_id);

      if (updateTransactionError) {
        console.error('Error updating transaction:', updateTransactionError);
      }
    }

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        hcs_tx_id: hcsTxId
      })
    };
  } catch (error) {
    console.error('Error in escrow dispute:', error);
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