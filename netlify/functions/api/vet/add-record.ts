import { createClient } from '@supabase/supabase-js';
import { hederaManager } from '../../lib/hederaManager';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const { 
      animal_id, 
      record_type, 
      description, 
      date, 
      attachment_url 
    } = JSON.parse(event.body);

    // Validate required fields
    if (!animal_id || !record_type || !date) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: animal_id, record_type, date' })
      };
    }

    // Server-side client using service role key. Prefer non-VITE server env but fall back
    // to VITE_* for backwards compatibility in some deploys/scripts.
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Get the authenticated user
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Missing authorization header' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid authorization token' })
      };
    }

    // Verify the user is a veterinarian
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    // Accept both 'vet' and 'veterinarian' roles for compatibility
    const role = userData?.role || '';
    if (userError || (role !== 'veterinarian' && role !== 'vet')) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Only veterinarians can add records' })
      };
    }

    // Create the vet record
    const { data: vetRecord, error: insertError } = await supabase
      .from('vet_records')
      .insert({
        vet_id: user.id,
        animal_id,
        record_type,
        description,
        date,
        attachment_url,
        signature_hash: null,
        on_chain_hash: null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating vet record:', insertError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to create vet record' })
      };
    }

    // Create hash for on-chain storage (simple base64 of the record payload)
    const recordData = {
      animal_id,
      record_type,
      date,
      vet_public_key: user.id, // TODO: replace with actual vet public key when available
      created_at: new Date().toISOString()
    };

    const recordString = JSON.stringify(recordData);
    const signatureHash = Buffer.from(recordString).toString('base64');

    // Update the record with the signature hash
    const { error: updateError } = await supabase
      .from('vet_records')
      .update({ signature_hash: signatureHash })
      .eq('id', vetRecord.id);

    if (updateError) {
      console.error('Error updating vet record with signature hash:', updateError);
    }

    // Optionally submit an HCS message via centralized hederaManager.
    // Vet records are recorded as updates to the animal; use the animals topic when available.
    let onChainHash: string | null = null;
    try {
      const topicEnv = process.env.VITE_HEDERA_TOPIC_ANIMALS;
      if (topicEnv) {
        const payload = { type: 'vet.record', record: recordData };
        const result = await hederaManager.submitTopicMessage(topicEnv, JSON.stringify(payload));
        onChainHash = result?.txId || null;

        // Update the record with the on-chain hash
        await supabase
          .from('vet_records')
          .update({ on_chain_hash: onChainHash })
          .eq('id', vetRecord.id);
      }
    } catch (hcsError) {
      console.error('Error sending vet record to Hedera HCS via hederaManager:', hcsError);
      // Do not fail the request because HCS is best-effort here
    }

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: { ...vetRecord, signature_hash: signatureHash, on_chain_hash: onChainHash },
        error: null
      })
    };
  } catch (error) {
    console.error('Error in vet add-record:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}