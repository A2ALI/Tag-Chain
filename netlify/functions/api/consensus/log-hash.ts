import { hederaManager } from '../../lib/hederaManager';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { hash, metadata } = JSON.parse(event.body);

    // Validate input
    if (!hash) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Hash is required' })
      };
    }

    // Get topic ID from environment variables
    const topicIdStr = process.env.VITE_HEDERA_CONSENSUS_TOPIC_ID;
    if (!topicIdStr) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'VITE_HEDERA_CONSENSUS_TOPIC_ID not configured' })
      };
    }
    // Submit message via centralized hederaManager
    try {
      const result = await hederaManager.submitTopicMessage(topicIdStr, { hash, metadata, timestamp: new Date().toISOString() });
      return {
        statusCode: 200,
        body: JSON.stringify({ txId: result.txId })
      };
    } catch (e) {
      console.error('Error submitting consensus log via hederaManager:', e);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to submit consensus log', message: e instanceof Error ? e.message : String(e) })
      };
    }
  } catch (error) {
    console.error("Error logging certificate hash:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}