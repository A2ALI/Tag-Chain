import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import {
  Client,
  PrivateKey,
  AccountId,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  
  TokenMintTransaction,
  TransferTransaction
} from '@hashgraph/sdk';
import { hederaManager } from '../../lib/hederaManager';

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
    const { transaction_id, source_account, method, amount } = JSON.parse(event.body);

    // Validate input
    if (!transaction_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Transaction ID is required' })
      };
    }

    if (!source_account) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Source account is required' })
      };
    }

    if (!method || (method !== 'mint' && method !== 'transfer')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Method must be either "mint" or "transfer"' })
      };
    }

    if (!amount || amount <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Valid amount is required' })
      };
    }

    // Verify transaction exists and escrow_status='pending'
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

    if (transaction.escrow_status !== 'pending') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Transaction escrow status is not pending' })
      };
    }

    let hcsTxId: string | null = null;
    let contractTxId: string | null = null;

    // If FEATURE_ONCHAIN is enabled, interact with smart contract
    if (process.env.FEATURE_ONCHAIN === 'true' && process.env.VITE_ESCROW_CONTRACT_ADDRESS) {
      try {
        // Initialize Hedera client
  const network = process.env.HEDERA_NETWORK || process.env.VITE_HEDERA_NETWORK || 'testnet';
        const client = network === 'mainnet' 
          ? Client.forMainnet() 
          : Client.forTestnet();

  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringED25519(process.env.HEDERA_PRIVATE_KEY!);
        
        client.setOperator(operatorId, operatorKey);

        const tokenId = process.env.VITE_TAGUSD_TOKEN_ID!;
        
        // Interact with the smart contract to confirm funding
        console.log(`Funding escrow via smart contract for transaction ${transaction_id}`);
        
        // The actual funding should have happened during escrow creation
        // Here we just log the funding event to HCS
        
        // Create PRD standard escrow.funded JSON
        const messagePayload = {
          type: 'escrow.funded',
          version: '1.0',
          transaction_id: transaction_id,
          amount: amount.toString(),
          currency: transaction.currency || 'TAGUSD',
          timestamp: new Date().toISOString()
        };

        // Submit message to HCS topic via centralized manager
        try {
          const result = await hederaManager.submitTopicMessage(process.env.VITE_HEDERA_TOPIC_ESCROW!, messagePayload);
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
              message: 'escrow.funded',
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
            escrow_status: 'funded'
          })
          .eq('id', transaction_id);

        if (updateTransactionError) {
          console.error('Error updating transaction:', updateTransactionError);
        }
      } catch (contractError) {
        console.error('Error in escrow fund:', contractError);
        return {
          statusCode: 500,
          body: JSON.stringify({ 
            success: false,
            error: 'Failed to fund escrow',
            message: contractError instanceof Error ? contractError.message : 'Unknown error occurred'
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
            message: 'escrow.funded',
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
          escrow_status: 'funded'
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
        hcs_tx_id: hcsTxId,
        contract_tx_id: contractTxId
      })
    };
  } catch (error) {
    console.error('Error in escrow fund:', error);
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