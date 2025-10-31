import { Client, PrivateKey, TokenCreateTransaction } from '@hashgraph/sdk';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { tokenName, tokenSymbol, decimals, initialSupply } = JSON.parse(event.body);

    // Validate input
    if (!tokenName || !tokenSymbol) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Token name and symbol are required' })
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

    // Create the token creation transaction
    const transaction = new TokenCreateTransaction()
      .setTokenName(tokenName)
      .setTokenSymbol(tokenSymbol)
      .setDecimals(decimals !== undefined ? decimals : 2)
      .setInitialSupply(initialSupply !== undefined ? initialSupply : 0)
      .setTreasuryAccountId(operatorId)
      .setAdminKey(operatorKey.publicKey)
      .setFreezeKey(operatorKey.publicKey)
      .setWipeKey(operatorKey.publicKey)
      .setSupplyKey(operatorKey.publicKey);

    // Submit the transaction to the Hedera network
    const txResponse = await transaction.execute(client);

    // Get the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Get the token ID from the receipt
    const tokenId = receipt.tokenId!.toString();

    return {
      statusCode: 200,
      body: JSON.stringify({
        tokenId,
        txId: txResponse.transactionId.toString()
      })
    };
  } catch (error) {
    console.error("Error creating token:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}