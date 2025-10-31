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
    const { animal_id, verifier_id } = JSON.parse(event.body);

    // Validate input
    if (!animal_id || !verifier_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Animal ID and verifier ID are required' })
      };
    }

    // Server-side client using service role key
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update animal with verification details
    const { data: animal, error: updateError } = await supabase
      .from('animals')
      .update({
        verified_at: new Date().toISOString(),
        verified_by: verifier_id
      })
      .eq('id', animal_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error verifying animal:', updateError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to verify animal' })
      };
    }

    // Insert security event log
    const { error: logError } = await supabase
      .from('security_events')
      .insert([{
        event_type: 'animal_verified',
        source: 'api/animals/verify',
        details: JSON.stringify({
          animal_id: animal_id,
          verifier_id: verifier_id
        }),
        created_at: new Date().toISOString()
      }]);

    if (logError) {
      console.error('Error inserting security event:', logError);
    }

    // Submit HCS message if FEATURE_ONCHAIN is enabled
    if (process.env.FEATURE_ONCHAIN === 'true' && animal) {
      try {
        const payload = {
          type: 'animal.verified',
          version: '1.0',
          animal_id: animal_id,
          verifier_id: verifier_id,
          animal_on_chain_id: animal.animal_on_chain_id,
          timestamp: new Date().toISOString()
        };

        const topicId = process.env.VITE_HEDERA_TOPIC_ANIMALS!;
        const result = await hederaManager.submitTopicMessage(topicId, payload);
        const hcsTxId = result.txId;

        // Update animal with verification HCS transaction ID
        const { error: hcsUpdateError } = await supabase
          .from('animals')
          .update({ verification_hcs_tx_id: hcsTxId })
          .eq('id', animal_id);

        if (hcsUpdateError) console.error('Error updating animal with verification HCS tx ID:', hcsUpdateError);
      } catch (hcsError) {
        console.error('Error submitting HCS verification message via hederaManager:', hcsError);
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'Animal verified successfully',
        animal: animal
      })
    };
  } catch (error) {
    console.error('Error in animal verification:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}