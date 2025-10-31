import { createClient } from '@supabase/supabase-js';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get query parameters
    const recordId = event.queryStringParameters?.recordId;

    if (!recordId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing recordId parameter' })
      };
    }

    // Server-side client using service role key
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch the vet record
    const { data: vetRecord, error } = await supabase
      .from('vet_records')
      .select('signature_hash, on_chain_hash, date, record_type, animal_id')
      .eq('id', recordId)
      .single();

    if (error || !vetRecord) {
      console.error('Error fetching vet record:', error);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Vet record not found' })
      };
    }

    // In a real implementation, we would verify the signature on-chain
    // For now, we'll just return the verification data
    const verificationResult = {
      record_id: recordId,
      is_verified: !!vetRecord.on_chain_hash, // Simple check if it has an on-chain hash
      signature_hash: vetRecord.signature_hash,
      on_chain_hash: vetRecord.on_chain_hash,
      verification_date: new Date().toISOString(),
      hashscan_url: vetRecord.on_chain_hash 
        ? `https://hashscan.io/testnet/transaction/${vetRecord.on_chain_hash}` 
        : null
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: verificationResult,
        error: null
      })
    };
  } catch (error) {
    console.error('Error in vet verify-signature:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}