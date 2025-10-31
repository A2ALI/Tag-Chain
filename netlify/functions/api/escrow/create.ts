import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import {
  Client,
  PrivateKey,
  AccountId,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  TopicMessageSubmitTransaction
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
    const { transaction_id } = JSON.parse(event.body);

    // Validate input
    if (!transaction_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Transaction ID is required' })
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

    // Insert log: "escrow.create:init"
    const { data: logData, error: logError } = await supabase
      .from('escrow_logs')
      .insert([
        {
          transaction_id: transaction_id,
          message: 'escrow.create:init',
          topic_id: process.env.VITE_HEDERA_TOPIC_ESCROW,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (logError) {
      console.error('Error inserting escrow log:', logError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to create escrow log' })
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

        // Generate unique order ID
        const orderId = `order-${uuidv4()}`;

        // Call smart contract to create escrow
        const contractExecuteTx = new ContractExecuteTransaction()
          .setContractId(process.env.VITE_ESCROW_CONTRACT_ADDRESS)
          .setGas(1000000)
          .setFunction("createEscrow", 
            new ContractFunctionParameters()
              .addString(orderId)
              .addAddress(transaction.seller_id)
          )
          .setPayableAmount(transaction.amount); // Send the payment amount

        const contractResponse = await contractExecuteTx.execute(client);
        const contractReceipt = await contractResponse.getReceipt(client);
        contractTxId = contractResponse.transactionId.toString();

        console.log(`Smart contract escrow created with transaction ID: ${contractTxId}`);

        // Create PRD standard escrow.create JSON
        const messagePayload = {
          type: 'escrow.create',
          version: '1.0',
          escrow_id: orderId,
          transaction_id: transaction_id,
          buyer_on_chain_id: `TAGCHAIN:USER:${transaction.buyer_id}`,
          seller_on_chain_id: `TAGCHAIN:USER:${transaction.seller_id}`,
          amount: transaction.amount.toString(),
          currency: transaction.currency || 'TAGUSD',
          status: 'initiated',
          timestamp: new Date().toISOString(),
          contract_tx_id: contractTxId
        };

        // Submit message to HCS topic via centralized manager
        try {
          const result = await hederaManager.submitTopicMessage(process.env.VITE_HEDERA_TOPIC_ESCROW!, messagePayload);
          hcsTxId = result.txId;
        } catch (e) {
          console.error('Error submitting HCS message via hederaManager:', e);
        }

        // Update escrow_logs with hcs_tx_id and contract_tx_id
        const { error: updateLogError } = await supabase
          .from('escrow_logs')
          .update({ 
            hcs_tx_id: hcsTxId,
            contract_tx_id: contractTxId
          })
          .eq('id', logData.id);

        if (updateLogError) {
          console.error('Error updating escrow log with transaction IDs:', updateLogError);
        }

        // Update transactions with hcs_tx_id and contract_tx_id
        const { error: updateTransactionError } = await supabase
          .from('transactions')
          .update({ 
            hcs_tx_id: hcsTxId,
            contract_tx_id: contractTxId
          })
          .eq('id', transaction_id);

        if (updateTransactionError) {
          console.error('Error updating transaction with transaction IDs:', updateTransactionError);
        }
      } catch (contractError) {
        console.error('Error interacting with smart contract:', contractError);
        // We don't fail the whole operation if contract interaction fails
      }
    }

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        escrow_log_id: logData.id,
        hcs_tx_id: hcsTxId,
        contract_tx_id: contractTxId
      })
    };
  } catch (error) {
    console.error('Error in escrow create:', error);
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