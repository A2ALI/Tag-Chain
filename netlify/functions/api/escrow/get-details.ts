import { Client, PrivateKey, ContractCallQuery, ContractFunctionParameters } from '@hashgraph/sdk';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { escrowId } = JSON.parse(event.body);

    // Validate input
    if (!escrowId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Escrow ID is required' })
      };
    }

    // Initialize Hedera client
    const network = process.env.VITE_HEDERA_NETWORK || 'testnet';
    const client = network === 'mainnet' 
      ? Client.forMainnet() 
      : Client.forTestnet();

  const operatorId = process.env.HEDERA_ACCOUNT_ID!;
  const operatorKey = PrivateKey.fromStringED25519(process.env.HEDERA_PRIVATE_KEY!);
    
    client.setOperator(operatorId, operatorKey);

    // Get contract ID from environment variables
    const contractIdStr = process.env.VITE_ESCROW_CONTRACT_ADDRESS;
    if (!contractIdStr) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'VITE_ESCROW_CONTRACT_ADDRESS not configured' })
      };
    }

    // Create the contract call query
    const query = new ContractCallQuery()
      .setContractId(contractIdStr)
      .setGas(100000)
      .setFunction("getEscrow", new ContractFunctionParameters()
        .addString(escrowId));

    // Submit the query to the Hedera network
    const response = await query.execute(client);

    return {
      statusCode: 200,
      body: JSON.stringify({
        details: response
      })
    };
  } catch (error) {
    console.error("Error getting escrow details:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}