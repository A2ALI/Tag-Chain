import { createClient } from '@supabase/supabase-js';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Server-side client using service role key
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch issued certificates
    const { data: certificates, error } = await supabase
      .from('certificates')
      .select(`
        id,
        type,
        applicant_name,
        issued_at,
        nft_id,
        status
      `)
      .order('issued_at', { ascending: false });

    if (error) {
      console.error('Error fetching certificates:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch certificates' })
      };
    }

    // Format the data for the frontend
    const formattedCertificates = certificates.map((cert: any) => ({
      id: cert.id,
      type: cert.type,
      applicant: cert.applicant_name,
      issued: new Date(cert.issued_at).toISOString().split('T')[0],
      nftId: cert.nft_id,
      status: cert.status
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: formattedCertificates,
        error: null
      })
    };
  } catch (error) {
    console.error('Error in certificates:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}