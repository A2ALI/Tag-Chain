import { createClient } from '@supabase/supabase-js';
import { Client, PrivateKey, TokenAssociateTransaction, AccountId } from '@hashgraph/sdk';

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
    const { accountId } = JSON.parse(event.body);

    // Validate input
    if (!accountId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Account ID is required' })
      };
    }

    // Check if VITE_TAGUSD_TOKEN_ID exists
    const tokenId = process.env.VITE_TAGUSD_TOKEN_ID;
    
    if (!tokenId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'TagUSD token ID not configured' })
      };
    }

    // Initialize Hedera client
  const network = process.env.HEDERA_NETWORK || process.env.VITE_HEDERA_NETWORK || 'testnet';
    let hederaClient: Client;

    if (network === 'mainnet') {
      hederaClient = Client.forMainnet();
    } else {
      hederaClient = Client.forTestnet();
    }

  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringED25519(process.env.HEDERA_PRIVATE_KEY!);
    
  hederaClient.setOperator(operatorId, operatorKey);

    console.log(`Associating account ${accountId} with token ${tokenId}`);

    // Create token association transaction
    const transaction = new TokenAssociateTransaction()
      .setAccountId(accountId)
      .setTokenIds([tokenId]);

    // Sign with the operator key and execute
    const txResponse = await transaction.execute(hederaClient);
    const receipt = await txResponse.getReceipt(hederaClient);
    
    console.log(`Token association completed: ${txResponse.transactionId.toString()}`);

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          transactionId: txResponse.transactionId.toString(),
          status: receipt.status.toString()
        },
        message: `Account ${accountId} successfully associated with token ${tokenId}`
      })
    };
  } catch (error) {
    console.error('Error in token association:', error);
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