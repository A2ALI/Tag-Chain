import { createClient } from '@supabase/supabase-js';
import { Client, PrivateKey, AccountId, AccountInfoQuery, TokenId } from '@hashgraph/sdk';

// Initialize Supabase client with service role key for privileged access
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function handler(event: any, context: any) {
  // Support both GET and POST methods
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    let accountId: string;
    
    // Extract account ID from query parameters (GET) or body (POST)
    if (event.httpMethod === 'GET') {
      const urlParams = new URLSearchParams(event.queryStringParameters || '');
      accountId = urlParams.get('account') || '';
    } else {
      const body = JSON.parse(event.body || '{}');
      accountId = body.account || '';
    }

    // Validate input
    if (!accountId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Account ID is required' })
      };
    }

    // Initialize Hedera client
    const network = process.env.VITE_HEDERA_NETWORK || 'testnet';
    let hederaClient: Client;

    if (network === 'mainnet') {
      hederaClient = Client.forMainnet();
    } else {
      hederaClient = Client.forTestnet();
    }

  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringED25519(process.env.HEDERA_PRIVATE_KEY!);
    
  hederaClient.setOperator(operatorId, operatorKey);

    console.log(`Fetching balance for account ${accountId}`);

    // Query account info
    const accountInfo = await new AccountInfoQuery()
      .setAccountId(accountId)
      .execute(hederaClient);
    
    // Get HBAR balance
    const hbarBalance = accountInfo.balance.toTinybars().toNumber() / 100000000; // Convert to HBAR
    
    // Get token balances
    const tokenBalances: Record<string, number> = {};
    
    // Check if VITE_TAGUSD_TOKEN_ID exists
    const tagUsdTokenId = process.env.VITE_TAGUSD_TOKEN_ID;
    
    if (tagUsdTokenId) {
      // Look for TagUSD token balance
      for (const tokenBalance of accountInfo.tokenRelationships.values()) {
        if (tokenBalance.tokenId.toString() === tagUsdTokenId) {
          // Use default decimals if tokenInfo is not available
          const decimals = 2; // Default for TagUSD
          tokenBalances[tagUsdTokenId] = tokenBalance.balance.toNumber() / Math.pow(10, decimals);
          break;
        }
      }
    }

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          accountId,
          hbarBalance,
          tokenBalances,
          fiatConversion: null // Stub for now - would call external API in full implementation
        }
      })
    };
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
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