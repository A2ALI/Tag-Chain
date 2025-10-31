import { createClient } from '@supabase/supabase-js';

// Define explicit array interface for AnimalHistoryRecord
interface AnimalHistoryRecord {
  event: string;
  timestamp: string;
  details?: string;
}

// Define interface for MirrorNode message
interface MirrorNodeMessage {
  message: string;
  consensus_timestamp: string;
  [key: string]: any;
}

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get query parameters
    const animalId = event.queryStringParameters?.animalId;
    const tagNumber = event.queryStringParameters?.tagNumber;

    // Validate input
    if (!animalId && !tagNumber) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Animal ID or tag number is required' })
      };
    }

    // Server-side client using service role key
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get animal details if needed
    let animalOnChainId = null;
    if (animalId || tagNumber) {
      let query = supabase.from('animals').select('animal_on_chain_id');
      
      if (animalId) {
        query = query.eq('id', animalId);
      } else if (tagNumber) {
        query = query.eq('tag_number', tagNumber);
      }
      
      const { data: animal, error: animalError } = await query.single();
      
      if (animalError) {
        console.error('Error fetching animal:', animalError);
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Animal not found' })
        };
      }
      
      animalOnChainId = animal.animal_on_chain_id;
    }

    // If we don't have an on-chain ID, return empty history
    if (!animalOnChainId) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          data: [] as AnimalHistoryRecord[],
          error: null
        })
      };
    }

    // Fetch history from Hedera Mirror Node
    // We'll query the animals topic for messages related to this animal
    const topicId = process.env.VITE_HEDERA_TOPIC_ANIMALS;
    
    if (!topicId) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Hedera topic ID not configured' })
      };
    }

    // Fetch messages from Mirror Node
    const mirrorNodeUrl = process.env.VITE_HEDERA_NETWORK === 'mainnet' 
      ? 'https://mainnet.mirrornode.hedera.com' 
      : 'https://testnet.mirrornode.hedera.com';
    
    const response = await fetch(
      `${mirrorNodeUrl}/api/v1/topics/${topicId}/messages`
    );
    
    if (!response.ok) {
      throw new Error(`Mirror Node request failed: ${response.status} ${response.statusText}`);
    }
    
    const mirrorData = await response.json();
    
    // Filter messages for this specific animal
    const animalMessages: AnimalHistoryRecord[] = [];
    if (mirrorData.messages && Array.isArray(mirrorData.messages)) {
      for (const message of mirrorData.messages) {
        try {
          // Decode base64 message
          const decodedMessage = Buffer.from(message.message, 'base64').toString('utf8');
          const parsedMessage = JSON.parse(decodedMessage);
          
          // Check if this message is for our animal
          if (parsedMessage.animal_on_chain_id === animalOnChainId || 
              parsedMessage.animal_local_id == animalId) {
            animalMessages.push({
              event: 'on-chain-record',
              timestamp: message.consensus_timestamp,
              details: JSON.stringify(parsedMessage)
            });
          }
        } catch (decodeError) {
          // Skip messages that can't be decoded
          console.warn('Could not decode message:', decodeError);
        }
      }
    }

    // Sort by timestamp (newest first)
    animalMessages.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: animalMessages,
        error: null
      })
    };
  } catch (error) {
    console.error('Error in animal history:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}