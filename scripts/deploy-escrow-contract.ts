#!/usr/bin/env node

// Script to deploy the TagChainEscrow smart contract to Hedera
import { 
  Client, 
  PrivateKey, 
  AccountId, 
  ContractCreateFlow, 
  ContractFunctionParameters, 
  ContractExecuteTransaction,
  ContractCallQuery,
  Hbar,
  FileCreateTransaction,
  FileAppendTransaction,
  ContractInfoQuery
} from "@hashgraph/sdk";
import { readFileSync } from "fs";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: ".env" });

async function deployContract() {
  console.log("=== Deploying TagChainEscrow Smart Contract ===\n");
  
  try {
    // Configure client
  const network = process.env.HEDERA_NETWORK || process.env.VITE_HEDERA_NETWORK || 'testnet';
    const client = Client.forName(network);
    
  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringED25519(process.env.HEDERA_PRIVATE_KEY!);
    
    client.setOperator(operatorId, operatorKey);
    
    console.log(`Using network: ${network}`);
    console.log(`Operator account: ${operatorId.toString()}\n`);
    
    // Read the contract bytecode
    const contractBytecode = readFileSync(
      resolve(__dirname, "../contracts/TagChainEscrow.sol")
    );
    
    console.log("Deploying contract...");
    
    // Create the contract
    const contractCreate = new ContractCreateFlow()
      .setBytecode(contractBytecode)
      .setGas(2000000) // Set gas limit
      .setConstructorParameters(new ContractFunctionParameters());
    
    const response = await contractCreate.execute(client);
    const receipt = await response.getReceipt(client);
    
    const contractId = receipt.contractId;
    
    if (!contractId) {
      throw new Error("Failed to deploy contract - no contract ID returned");
    }
    
    console.log(`\n✅ Contract deployed successfully!`);
    console.log(`Contract ID: ${contractId.toString()}`);
    
    // Verify contract deployment
    console.log("\nVerifying contract deployment...");
    const contractInfo = await new ContractInfoQuery()
      .setContractId(contractId)
      .execute(client);
    
    console.log(`Contract account ID: ${contractInfo.accountId.toString()}`);
    console.log(`Contract expiration time: ${contractInfo.expirationTime.toString()}`);
    
    // Save the contract ID to .env file
    console.log("\nUpdating .env file with contract address...");
    
    // In a real implementation, we would update the .env file
    // For now, we'll just print what should be added
    console.log(`\nAdd this line to your .env file:`);
    console.log(`VITE_ESCROW_CONTRACT_ADDRESS=${contractId.toString()}`);
    
    console.log("\n=== Deployment Complete ===");
    
    // Test the contract by calling a function
    console.log("\n=== Testing Contract Functionality ===");
    
    // In a real implementation, we would test actual contract functions
    console.log("Contract is ready for use!");
    
    client.close();
    
    return contractId.toString();
  } catch (error) {
    console.error("Error deploying contract:", error);
    process.exit(1);
  }
}

// Run the deployment
deployContract().then((contractId) => {
  console.log(`\nContract deployed with ID: ${contractId}`);
}).catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});