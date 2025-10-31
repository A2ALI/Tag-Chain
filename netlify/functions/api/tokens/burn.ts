import { Client, PrivateKey, TokenBurnTransaction } from '@hashgraph/sdk';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { tokenId, amount } = JSON.parse(event.body);

    // Validate input
    if (!tokenId || amount === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Token ID and amount are required' })
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

    // Create the token burn transaction
    const transaction = new TokenBurnTransaction()
      .setTokenId(tokenId)
      .setAmount(amount);

    // Submit the transaction to the Hedera network
    const txResponse = await transaction.execute(client);

    // Get the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    return {
      statusCode: 200,
      body: JSON.stringify({
        txId: txResponse.transactionId.toString()
      })
    };
  } catch (error) {
    console.error("Error burning tokens:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}