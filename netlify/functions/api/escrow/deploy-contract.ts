import { Client, PrivateKey, ContractCreateFlow, ContractFunctionParameters } from '@hashgraph/sdk';

// Simple escrow contract bytecode placeholder
// In a real implementation, this would be compiled from Solidity
const ESCROW_CONTRACT_BYTECODE = "608060405234801561001057600080fd5b506101d4806100206000396000f3fe60806040523073ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16141561005557600080fd5b60008082600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b60008082600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505056";

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { contractName } = JSON.parse(event.body);

    // Validate input
    if (!contractName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Contract name is required' })
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

    // Create the contract creation transaction
    const transaction = new ContractCreateFlow()
      .setBytecode(ESCROW_CONTRACT_BYTECODE)
      .setGas(100000)
      .setConstructorParameters(new ContractFunctionParameters().addString(contractName));

    // Submit the transaction to the Hedera network
    const txResponse = await transaction.execute(client);

    // Get the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Get the contract ID from the receipt
    const contractId = receipt.contractId!.toString();

    return {
      statusCode: 200,
      body: JSON.stringify({
        contractId,
        txId: txResponse.transactionId.toString()
      })
    };
  } catch (error) {
    console.error("Error deploying escrow contract:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}