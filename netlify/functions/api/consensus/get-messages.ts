import { Client, PrivateKey, TopicId } from '@hashgraph/sdk';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { limit } = JSON.parse(event.body);

    // Initialize Hedera client
    const network = process.env.VITE_HEDERA_NETWORK || 'testnet';
    const client = network === 'mainnet' 
      ? Client.forMainnet() 
      : Client.forTestnet();

  const operatorId = process.env.HEDERA_ACCOUNT_ID!;
  const operatorKey = PrivateKey.fromStringED25519(process.env.HEDERA_PRIVATE_KEY!);
    
    client.setOperator(operatorId, operatorKey);

    // Get topic ID from environment variables
    const topicIdStr = process.env.VITE_HEDERA_CONSENSUS_TOPIC_ID;
    if (!topicIdStr) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'VITE_HEDERA_CONSENSUS_TOPIC_ID not configured' })
      };
    }

    const topicId = TopicId.fromString(topicIdStr);

    // For now, we'll return an empty array as querying consensus messages
    // requires a more complex implementation with message listeners
    console.log(`Retrieving consensus messages from topic: ${topicId.toString()}`);
    
    // In a real implementation, you would query the mirror node for messages
    // This is a placeholder implementation
    const messages: never[] = [];

    return {
      statusCode: 200,
      body: JSON.stringify({
        messages
      })
    };
  } catch (error) {
    console.error("Error getting consensus messages:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}