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
    const { animal_id, certificate_type, expires_at, document_url, linked_vet_certificate_id } = JSON.parse(event.body);

    // Validate required fields
    if (!animal_id || !certificate_type) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'animal_id and certificate_type are required' })
      };
    }

    // Validate certificate type
    const validTypes = ['EXPORT', 'HALAL', 'OTHER'];
    if (!validTypes.includes(certificate_type)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid certificate type for regulator' })
      };
    }

    // Server-side client using service role key
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the authenticated user
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Authorization header missing' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid authentication token' })
      };
    }

    // Verify user is a regulator
    const { data: regulatorUser, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (userError || !regulatorUser || regulatorUser.role !== 'regulator') {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'User is not authorized as a regulator' })
      };
    }

    // Verify the animal exists
    const { data: animal, error: animalError } = await supabase
      .from('animals')
      .select('id')
      .eq('id', animal_id)
      .single();

    if (animalError || !animal) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Animal not found' })
      };
    }

    // If this is an export or halal certificate, verify there's a linked vet certificate
    if ((certificate_type === 'EXPORT' || certificate_type === 'HALAL') && linked_vet_certificate_id) {
      const { data: vetCert, error: vetCertError } = await supabase
        .from('certificates')
        .select('id, certificate_type')
        .eq('id', linked_vet_certificate_id)
        .eq('certificate_type', 'VET_HEALTH')
        .single();

      if (vetCertError || !vetCert) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Valid veterinary health certificate required for export/halal certification' })
        };
      }
    }

    // Compute hash for certificate
    const certificateData = {
      certificate_type,
      issuer_id: user.id,
      animal_id,
      linked_vet_certificate_id: linked_vet_certificate_id || null,
      timestamp: new Date().toISOString()
    };

    const certificateString = JSON.stringify(certificateData);
    const encoder = new TextEncoder();
    const data = encoder.encode(certificateString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Submit to Hedera HCS if topic is configured
    let on_chain_tx_id: string | null = null;
    if (process.env.VITE_HEDERA_TOPIC_CERTS) {
      try {
        const result = await hederaManager.submitTopicMessage(process.env.VITE_HEDERA_TOPIC_CERTS!, certificateString);
        on_chain_tx_id = result.txId;
      } catch (hcsError) {
        console.error('Error submitting to HCS via hederaManager:', hcsError);
      }
    }

    // Insert certificate record
    const { data: certificate, error: insertError } = await supabase
      .from('certificates')
      .insert({
        certificate_type,
        issuer_role: 'REGULATOR',
        animal_id,
        issuer_id: user.id,
        signature_hash,
        document_url: document_url || null,
        on_chain_tx_id,
        expires_at: expires_at ? new Date(expires_at) : null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting certificate:', insertError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to create certificate' })
      };
    }

    // Return success response
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: certificate,
        message: 'Certificate issued successfully'
      })
    };
  } catch (error) {
    console.error('Error in issue-cert:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}