import { createClient } from '@supabase/supabase-js';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get certificate ID from query parameters
    const url = new URL(event.rawUrl);
    const certificate_id = url.searchParams.get('certificate_id');

    if (!certificate_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'certificate_id is required' })
      };
    }

    // Server-side client using service role key
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch certificate with related data
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(`
        id,
        certificate_type,
        issuer_role,
        animal_id,
        issuer_id,
        signature_hash,
        document_url,
        on_chain_tx_id,
        issued_at,
        expires_at,
        created_at,
        updated_at,
        animals!inner(tag_id, breed, age),
        users!inner(full_name, role)
      `)
      .eq('id', certificate_id)
      .single();

    if (error) {
      console.error('Error fetching certificate:', error);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Certificate not found' })
      };
    }

    // Generate HashScan URL if on_chain_tx_id exists
    let hashscan_url: string | null = null;
    if (certificate.on_chain_tx_id) {
      const network = process.env.VITE_HEDERA_NETWORK || 'testnet';
      const baseUrl = network === 'mainnet' 
        ? 'https://hashscan.io/mainnet/transaction/'
        : 'https://hashscan.io/testnet/transaction/';
      hashscan_url = `${baseUrl}${certificate.on_chain_tx_id}`;
    }

    // Format the response
    const formattedCertificate = {
      id: certificate.id,
      type: certificate.certificate_type,
      issuerRole: certificate.issuer_role,
      animal: {
        id: certificate.animal_id,
        tagId: certificate.animals && certificate.animals.length > 0 ? certificate.animals[0].tag_id : 'Unknown',
        breed: certificate.animals && certificate.animals.length > 0 ? certificate.animals[0].breed : 'Unknown',
        age: certificate.animals && certificate.animals.length > 0 ? certificate.animals[0].age : null
      },
      issuer: {
        id: certificate.issuer_id,
        name: certificate.users && certificate.users.length > 0 ? certificate.users[0].full_name : 'Unknown',
        role: certificate.users && certificate.users.length > 0 ? certificate.users[0].role : 'Unknown'
      },
      signatureHash: certificate.signature_hash,
      documentUrl: certificate.document_url,
      onChainTxId: certificate.on_chain_tx_id,
      hashscanUrl: hashscan_url,
      issuedAt: certificate.issued_at,
      expiresAt: certificate.expires_at,
      createdAt: certificate.created_at,
      updatedAt: certificate.updated_at,
      isValid: certificate.expires_at ? new Date(certificate.expires_at) > new Date() : true
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: formattedCertificate,
        error: null
      })
    };
  } catch (error) {
    console.error('Error in verify certificate:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}