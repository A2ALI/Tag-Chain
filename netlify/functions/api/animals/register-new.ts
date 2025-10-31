import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { hederaManager } from '../../lib/hederaManager';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { tag_id, owner_id, breed, sex, dob, gps_lat, gps_lng, notes } = JSON.parse(event.body);

    // Validate input
    if (!tag_id || !owner_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Tag ID and owner ID are required' })
      };
    }

    // Server-side client using service role key
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate animal on-chain ID
    const animalOnChainId = `TAGCHAIN:ANIMAL:${randomUUID()}`;

    // Insert animal into Supabase
    const { data: animal, error: insertError } = await supabase
      .from('animals')
      .insert([
        {
          tag_number: tag_id,
          animal_on_chain_id: animalOnChainId,
          farmer_id: owner_id,
          breed: breed,
          sex: sex,
          dob: dob,
          gps_lat: gps_lat,
          gps_lng: gps_lng,
          notes: notes,
          status: 'active',
          registered_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting animal:', insertError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to register animal' })
      };
    }

    // Submit HCS message to topic via centralized hederaManager if FEATURE_ONCHAIN is enabled
    if (process.env.FEATURE_ONCHAIN === 'true') {
      try {
        const payload = {
          type: 'animal.register',
          version: '1.0',
          animal_on_chain_id: animalOnChainId,
          animal_local_id: animal.id,
          tag_number: tag_id,
          owner_id: owner_id,
          breed: breed,
          sex: sex,
          dob: dob,
          gps_lat: gps_lat,
          gps_lng: gps_lng,
          notes: notes,
          timestamp: new Date().toISOString()
        };

        const topicId = process.env.VITE_HEDERA_TOPIC_ANIMALS!;
        const result = await hederaManager.submitTopicMessage(topicId, payload);
        const hcsTxId = result.txId;

        // Update animal with HCS transaction ID
        const { error: updateError } = await supabase
          .from('animals')
          .update({ hcs_tx_id: hcsTxId })
          .eq('id', animal.id);

        if (updateError) console.error('Error updating animal with HCS tx ID:', updateError);
      } catch (hcsError) {
        console.error('Error submitting HCS message via hederaManager:', hcsError);
      }
    }

    // Return inserted row
    return {
      statusCode: 200,
      body: JSON.stringify(animal)
    };
  } catch (error) {
    console.error('Error in animal registration:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}