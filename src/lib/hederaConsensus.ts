/// <reference types="vite/client" />

/**
 * Create a new consensus topic for certificate/cattle hashes
 * @returns Promise<string> - The topic ID
 */
export async function createConsensusTopic(): Promise<string> {
  // Skip consensus topic creation if FEATURE_ONCHAIN is not enabled
  if (import.meta.env.FEATURE_ONCHAIN !== 'true') {
    console.log('FEATURE_ONCHAIN is disabled, skipping consensus topic creation');
    // Return a mock topic ID for development
    return '0.0.0000000';
  }
  
  try {
    // Call server-side function to create consensus topic
    const response = await fetch('/.netlify/functions/api/consensus/create-topic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topicMemo: "Tag Chain Certificate and Cattle Hashes"
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create consensus topic');
    }

    const result = await response.json();
    return result.topicId;
  } catch (error) {
    console.error("Error creating consensus topic:", error);
    throw error;
  }
}

/**
 * Log a certificate or cattle hash to the consensus service
 * @param hash - The hash to log
 * @param metadata - Additional metadata about the hash
 * @returns Promise<string> - The transaction ID
 */
export async function logCertificateHash(hash: string, metadata: string = ""): Promise<string> {
  // Skip certificate hash logging if FEATURE_ONCHAIN is not enabled
  if (import.meta.env.FEATURE_ONCHAIN !== 'true') {
    console.log('FEATURE_ONCHAIN is disabled, skipping certificate hash logging');
    // Return a mock transaction ID for development
    return '0.0.0000000@0000000000';
  }
  
  try {
    // Call server-side function to log certificate hash
    const response = await fetch('/.netlify/functions/api/consensus/log-hash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hash,
        metadata
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to log certificate hash');
    }

    const result = await response.json();
    return result.txId;
  } catch (error) {
    console.error("Error logging certificate hash:", error);
    throw error;
  }
}

/**
 * Get consensus messages from the topic
 * @param limit - The maximum number of messages to retrieve
 * @returns Promise<any[]> - Array of consensus messages
 */
export async function getConsensusMessages(limit: number = 100): Promise<any[]> {
  // Skip consensus messages retrieval if FEATURE_ONCHAIN is not enabled
  if (import.meta.env.FEATURE_ONCHAIN !== 'true') {
    console.log('FEATURE_ONCHAIN is disabled, skipping consensus messages retrieval');
    // Return mock consensus messages for development
    return [
      {
        id: '1',
        hash: 'mock-hash-1',
        metadata: 'Mock certificate 1',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        hash: 'mock-hash-2',
        metadata: 'Mock certificate 2',
        timestamp: new Date().toISOString()
      }
    ];
  }
  
  try {
    // Call server-side function to get consensus messages
    const response = await fetch('/.netlify/functions/api/consensus/get-messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get consensus messages');
    }

    const result = await response.json();
    return result.messages;
  } catch (error) {
    console.error("Error getting consensus messages:", error);
    throw error;
  }
}