#!/usr/bin/env node
import { Client, PrivateKey, AccountId, TopicCreateTransaction, TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { config } from 'dotenv';
import * as fs from 'fs';

// Load environment variables
config({ path: '.env' });

async function createTopics() {
  try {
    // Initialize client based on network from environment
  const network = process.env.HEDERA_NETWORK || process.env.VITE_HEDERA_NETWORK || 'testnet';
    let client: Client;

    if (network === 'mainnet') {
      client = Client.forMainnet();
    } else {
      client = Client.forTestnet();
    }

  const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
  const operatorKey = PrivateKey.fromStringED25519(process.env.HEDERA_PRIVATE_KEY!);
    
    client.setOperator(operatorId, operatorKey);

    console.log(`Creating HCS topics on ${network} network...`);

    // Get operator info
    const operator = {
      accountId: operatorId,
      publicKey: operatorKey.publicKey
    };

    console.log(`Operator: ${operator.accountId.toString()}`);

    // Create topics for each entity type
    const topics = {
      users: null as string | null,
      animals: null as string | null,
      certs: null as string | null
    };

    // Check if topics already exist in env
    const envContent = fs.readFileSync('.env', 'utf8');
    
    // Create Users topic if not exists
    if (!process.env.VITE_HEDERA_TOPIC_USERS || process.env.VITE_HEDERA_TOPIC_USERS === '0.0.7119910') {
      console.log('Creating Users HCS topic...');
      const usersTopicTx = await new TopicCreateTransaction()
        .setSubmitKey(operator.publicKey)
        .freezeWith(client)
        .sign(operatorKey);
        
      const usersTopicResponse = await usersTopicTx.execute(client);
      const usersTopicReceipt = await usersTopicResponse.getReceipt(client);
      topics.users = usersTopicReceipt.topicId!.toString();
      console.log(`Users topic created: ${topics.users}`);
    } else {
      topics.users = process.env.VITE_HEDERA_TOPIC_USERS;
      console.log(`Users topic already exists: ${topics.users}`);
    }

    // Create Animals topic if not exists
    if (!process.env.VITE_HEDERA_TOPIC_ANIMALS || process.env.VITE_HEDERA_TOPIC_ANIMALS === '0.0.7119910') {
      console.log('Creating Animals HCS topic...');
      const animalsTopicTx = await new TopicCreateTransaction()
        .setSubmitKey(operator.publicKey)
        .freezeWith(client)
        .sign(operatorKey);
        
      const animalsTopicResponse = await animalsTopicTx.execute(client);
      const animalsTopicReceipt = await animalsTopicResponse.getReceipt(client);
      topics.animals = animalsTopicReceipt.topicId!.toString();
      console.log(`Animals topic created: ${topics.animals}`);
    } else {
      topics.animals = process.env.VITE_HEDERA_TOPIC_ANIMALS;
      console.log(`Animals topic already exists: ${topics.animals}`);
    }

    // Create Certificates topic if not exists
    if (!process.env.VITE_HEDERA_TOPIC_CERTS || process.env.VITE_HEDERA_TOPIC_CERTS === '0.0.7119910') {
      console.log('Creating Certificates HCS topic...');
      const certsTopicTx = await new TopicCreateTransaction()
        .setSubmitKey(operator.publicKey)
        .freezeWith(client)
        .sign(operatorKey);
        
      const certsTopicResponse = await certsTopicTx.execute(client);
      const certsTopicReceipt = await certsTopicResponse.getReceipt(client);
      topics.certs = certsTopicReceipt.topicId!.toString();
      console.log(`Certificates topic created: ${topics.certs}`);
    } else {
      topics.certs = process.env.VITE_HEDERA_TOPIC_CERTS;
      console.log(`Certificates topic already exists: ${topics.certs}`);
    }

    // Output the topic IDs
    console.log('\n=== HCS TOPICS CREATED ===');
    console.log(`VITE_HEDERA_TOPIC_USERS=${topics.users}`);
    console.log(`VITE_HEDERA_TOPIC_ANIMALS=${topics.animals}`);
    console.log(`VITE_HEDERA_TOPIC_CERTS=${topics.certs}`);
    console.log('\nPlease add these lines to your .env file if they are not already present.');

    // Test each topic by submitting a message
    console.log('\n=== TESTING TOPICS ===');
    const testMessage = JSON.stringify({
      type: "system.test",
      version: "1.0",
      message: "topic-create-check",
      timestamp: new Date().toISOString()
    });

    // Test Users topic
    console.log('Testing Users topic...');
    const usersTx = await new TopicMessageSubmitTransaction()
      .setTopicId(topics.users!)
      .setMessage(testMessage)
      .freezeWith(client)
      .sign(operatorKey);
      
    const usersResponse = await usersTx.execute(client);
    const usersReceipt = await usersResponse.getReceipt(client);
    console.log(`Users topic test message submitted: ${usersResponse.transactionId.toString()}`);

    // Test Animals topic
    console.log('Testing Animals topic...');
    const animalsTx = await new TopicMessageSubmitTransaction()
      .setTopicId(topics.animals!)
      .setMessage(testMessage)
      .freezeWith(client)
      .sign(operatorKey);
      
    const animalsResponse = await animalsTx.execute(client);
    const animalsReceipt = await animalsResponse.getReceipt(client);
    console.log(`Animals topic test message submitted: ${animalsResponse.transactionId.toString()}`);

    // Test Certificates topic
    console.log('Testing Certificates topic...');
    const certsTx = await new TopicMessageSubmitTransaction()
      .setTopicId(topics.certs!)
      .setMessage(testMessage)
      .freezeWith(client)
      .sign(operatorKey);
      
    const certsResponse = await certsTx.execute(client);
    const certsReceipt = await certsResponse.getReceipt(client);
    console.log(`Certificates topic test message submitted: ${certsResponse.transactionId.toString()}`);

    console.log('\n=== ALL TOPICS CREATED AND TESTED SUCCESSFULLY ===');

  } catch (error) {
    console.error('Error creating topics:', error);
    process.exit(1);
  }
}

// Run the script
createTopics();