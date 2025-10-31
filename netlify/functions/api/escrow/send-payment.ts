import { Client, PrivateKey, ContractExecuteTransaction, ContractFunctionParameters } from '@hashgraph/sdk';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { buyerAccountId, sellerAccountId, amount } = JSON.parse(event.body);

    // Validate input
    if (!buyerAccountId || !sellerAccountId || amount === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Buyer account ID, seller account ID, and amount are required' })
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

    // Create the contract execute transaction
    const transaction = new ContractExecuteTransaction()
      .setContractId(contractIdStr)
      .setGas(100000)
      .setFunction("createEscrow", new ContractFunctionParameters()
        .addAddress(buyerAccountId)
        .addAddress(sellerAccountId)
        .addUint256(amount));

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
    console.error("Error sending escrow payment:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}