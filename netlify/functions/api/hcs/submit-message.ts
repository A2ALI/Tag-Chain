import { hederaManager } from '../../lib/hederaManager';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { topicId, payload, table, rowId } = JSON.parse(event.body);

    // Validate input
    if (!topicId || !payload) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Topic ID and payload are required' })
      };
    }

    // Submit the message to HCS via centralized manager
    const result = await hederaManager.submitTopicMessage(topicId, payload);
    const txId = result.txId;

    return {
      statusCode: 200,
      body: JSON.stringify({
        txId,
        consensusTimestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error("Error submitting HCS message:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}