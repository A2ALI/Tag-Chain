#!/usr/bin/env node

// Deploy Hedera testnet assets for Tag Chain
import dotenv from 'dotenv';
dotenv.config();

import {
  Client,
  TokenCreateTransaction,
  TopicCreateTransaction
} from "@hashgraph/sdk";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function deployAssets() {
  console.log('Deploying Hedera testnet assets for Tag Chain...');
  
  try {
    // Initialize client
    const client = Client.forTestnet();
    client.setOperator(
  process.env.HEDERA_ACCOUNT_ID!,
  process.env.HEDERA_PRIVATE_KEY!
    );
    
    // 1. Deploy TagUSD token
    console.log('\n1. Deploying TagUSD token...');
    const tokenId = await createToken(client);
    console.log(`✓ Token deployed with ID: ${tokenId}`);
    
    // 2. Create consensus topic
    console.log('\n2. Creating consensus topic...');
    const topicId = await createConsensusTopic(client);
    console.log(`✓ Consensus topic created with ID: ${topicId}`);
    
    // 3. Update .env file with the topic ID
    console.log('\n3. Updating .env file with topic ID...');
    await updateEnvFile(topicId);
    
    // 4. Print verification information
    console.log('\n=== DEPLOYMENT COMPLETE ===');
    console.log(`Token ID: ${tokenId}`);
    console.log(`Topic ID: ${topicId}`);
    console.log('\nPlease verify these assets on HashScan Testnet:');
    console.log(`Token: https://hashscan.io/testnet/token/${tokenId}`);
    console.log(`Topic: https://hashscan.io/testnet/topic/${topicId}`);
    
  } catch (error) {
    console.error('Error deploying assets:', error);
    process.exit(1);
  }
}

async function createToken(client: any): Promise<string> {
  try {
    // Create the token creation transaction
    const transaction = new TokenCreateTransaction()
      .setTokenName("TagUSD")
      .setTokenSymbol("TUSD")
      .setDecimals(2)
      .setInitialSupply(0) // 0 initial supply as requested
      .setTreasuryAccountId(client.operatorAccountId!)
      .setAdminKey(client.operatorPublicKey!)
      .setFreezeKey(client.operatorPublicKey!)
      .setWipeKey(client.operatorPublicKey!)
      .setSupplyKey(client.operatorPublicKey!);

    // Submit the transaction to the Hedera network
    const txResponse = await transaction.execute(client);

    // Get the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Get the token ID from the receipt
    const tokenId = receipt.tokenId!.toString();

    return tokenId;
  } catch (error) {
    console.error("Error creating token:", error);
    throw error;
  }
}

async function createConsensusTopic(client: any): Promise<string> {
  try {
    // Create the topic creation transaction
    const transaction = new TopicCreateTransaction()
      .setTopicMemo("Tag Chain Certificate and Cattle Hashes")
      .setSubmitKey(client.operatorPublicKey);

    // Submit the transaction to the Hedera network
    const txResponse = await transaction.execute(client);

    // Get the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Get the topic ID from the receipt
    const topicId = receipt.topicId!;
    
    return topicId.toString();
  } catch (error) {
    console.error("Error creating consensus topic:", error);
    throw error;
  }
}

async function updateEnvFile(topicId: string) {
  const envPath = path.resolve(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update or add the VITE_HEDERA_CONSENSUS_TOPIC_ID line
  if (envContent.includes('VITE_HEDERA_CONSENSUS_TOPIC_ID=')) {
    envContent = envContent.replace(
      /VITE_HEDERA_CONSENSUS_TOPIC_ID=.*/,
      `VITE_HEDERA_CONSENSUS_TOPIC_ID=${topicId}`
    );
  } else {
    envContent += `\nVITE_HEDERA_CONSENSUS_TOPIC_ID=${topicId}`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✓ .env file updated with consensus topic ID');
}

// Run the deployment
deployAssets();