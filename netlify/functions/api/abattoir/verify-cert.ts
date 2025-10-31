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
    const animalId = event.queryStringParameters?.animalId;

    if (!animalId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing animalId parameter' })
      };
    }

    // Server-side client using service role key
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if the animal has a valid vet certification
    const { data: vetRecords, error: vetError } = await supabase
      .from('vet_records')
      .select(`
        id,
        record_type,
        date,
        description,
        signature_hash,
        on_chain_hash,
        users(name)
      `)
      .eq('animal_id', animalId)
      .order('date', { ascending: false })
      .limit(5); // Get the last 5 records

    if (vetError) {
      console.error('Error fetching vet records:', vetError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch vet records' })
      };
    }

    // Check if there are any vet records
    const isVetCertified = vetRecords && vetRecords.length > 0;
    const latestCertification = vetRecords && vetRecords.length > 0 ? vetRecords[0] : null;

    const verificationResult = {
      animal_id: animalId,
      is_certified: isVetCertified,
      latest_certification: latestCertification,
      total_certifications: vetRecords ? vetRecords.length : 0,
      can_be_processed: isVetCertified, // In a real implementation, you might have more complex rules
      verification_date: new Date().toISOString()
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
    console.error('Error in abattoir verify-cert:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}