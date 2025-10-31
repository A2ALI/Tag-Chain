import { Client, PrivateKey, TokenAssociateTransaction } from '@hashgraph/sdk';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { accountId, tokenId } = JSON.parse(event.body);

    // Validate input
    if (!accountId || !tokenId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Account ID and token ID are required' })
      };
    }

    // Initialize Hedera client
  const network = process.env.HEDERA_NETWORK || process.env.VITE_HEDERA_NETWORK || 'testnet';
    const client = network === 'mainnet' 
      ? Client.forMainnet() 
      : Client.forTestnet();

  const operatorId = process.env.HEDERA_ACCOUNT_ID!;
  const operatorKey = PrivateKey.fromStringED25519(process.env.HEDERA_PRIVATE_KEY!);
    
    client.setOperator(operatorId, operatorKey);

    // Create token association transaction
    const transaction = new TokenAssociateTransaction()
      .setAccountId(accountId)
      .setTokenIds([tokenId]);

    // Sign with the operator key and execute
    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
      statusCode: 200,
      body: JSON.stringify({
        txId: txResponse.transactionId.toString()
      })
    };
  } catch (error) {
    console.error("Error associating token:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}