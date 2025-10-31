const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Initialize Supabase client with service role key for privileged access
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async function(event, context) {
  try {
    // Verify header
    const verifHash = event.headers['verif-hash'] || event.headers['Verif-Hash'];
    
  if (verifHash !== (process.env.FLW_ENCRYPTION_KEY || process.env.VITE_FLW_ENCRYPTION_KEY)) {
      console.log('Invalid verification hash');
      return { 
        statusCode: 401, 
        body: 'Invalid verification hash' 
      };
    }

    // Parse payload
    const payload = JSON.parse(event.body);
    
    // Log to webhook_logs
    const { data: logData, error: logError } = await supabase
      .from('webhook_logs')
      .insert([
        {
          provider: 'flutterwave',
          event_type: payload.event,
          raw_payload: payload,
          received_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (logError) {
      console.error('Error inserting webhook log:', logError);
    }

    // Handle specific events
    if (payload.event === 'charge.completed' || payload.event === 'transfer.completed') {
      // Find the matching transaction in Supabase via tx_ref or escrow_tx
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .or(`escrow_tx.eq.${payload.data.tx_ref},id.eq.${payload.data.tx_ref}`)
        .single();

      if (transactionError) {
        console.error('Transaction not found:', transactionError);
        return { 
          statusCode: 404, 
          body: 'Transaction not found' 
        };
      }

      // Update transactions.escrow_status = 'funded'
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ 
          escrow_status: 'funded'
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
      }

      // Insert a record in escrow_logs
      const { error: escrowLogError } = await supabase
        .from('escrow_logs')
        .insert([
          {
            transaction_id: transaction.id,
            message: 'flutterwave:funded',
            topic_id: process.env.VITE_HEDERA_TOPIC_ESCROW,
            created_at: new Date().toISOString()
          }
        ]);

      if (escrowLogError) {
        console.error('Error inserting escrow log:', escrowLogError);
      }

      // If FEATURE_ONCHAIN is enabled, fund the escrow
      if (process.env.FEATURE_ONCHAIN === 'true') {
        try {
          // Import Hedera SDK dynamically
          const hedera = await import('@hashgraph/sdk');
          
          // Initialize Hedera client
          const network = process.env.HEDERA_NETWORK || process.env.VITE_HEDERA_NETWORK || 'testnet';
          const client = network === 'mainnet' 
            ? hedera.Client.forMainnet() 
            : hedera.Client.forTestnet();

          const operatorId = process.env.HEDERA_ACCOUNT_ID;
          const operatorKey = hedera.PrivateKey.fromStringED25519(process.env.HEDERA_PRIVATE_KEY);
          
          client.setOperator(operatorId, operatorKey);

          const tokenId = process.env.VITE_TAGUSD_TOKEN_ID;
          const escrowAccountId = process.env.HEDERA_ESCROW_ACCOUNT_ID;

          // Transfer tokens to escrow account
          const transferTx = new hedera.TransferTransaction()
            .addTokenTransfer(tokenId, operatorId, -transaction.amount)
            .addTokenTransfer(tokenId, escrowAccountId, transaction.amount);

          const transferTxResponse = await transferTx.execute(client);
          await transferTxResponse.getReceipt(client);
          console.log(`Transferred ${transaction.amount} tokens to escrow account`);

          // Create PRD standard escrow.funded JSON
          const messagePayload = {
            type: 'escrow.funded',
            version: '1.0',
            transaction_id: transaction.id,
            amount: transaction.amount.toString(),
            currency: transaction.currency || 'TAGUSD',
            timestamp: new Date().toISOString()
          };

          // Submit message to HCS topic via centralized hederaManager
          try {
            const { hederaManager } = await import('./lib/hederaManager');
            const result = await hederaManager.submitTopicMessage(process.env.VITE_HEDERA_TOPIC_ESCROW, messagePayload);
            const hcsTxId = result.txId;

            // Update escrow_logs with hcs_tx_id
            const { error: updateLogError } = await supabase
              .from('escrow_logs')
              .update({ hcs_tx_id: hcsTxId })
              .eq('transaction_id', transaction.id)
              .eq('message', 'flutterwave:funded');

            if (updateLogError) {
              console.error('Error updating escrow log with hcs_tx_id:', updateLogError);
            }
          } catch (hcsError) {
            console.error('Error submitting HCS message via hederaManager:', hcsError);
          }
          
        } catch (hcsError) {
          console.error('Error in escrow funding:', hcsError);
        }
      }
    }

    return { 
      statusCode: 200, 
      body: 'Webhook processed successfully' 
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return { 
      statusCode: 500, 
      body: 'Internal Server Error' 
    };
  }
};