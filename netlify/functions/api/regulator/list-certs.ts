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
    const url = new URL(event.rawUrl);
    const certificate_type = url.searchParams.get('certificate_type');
    const status = url.searchParams.get('status');

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

    // Build the query
    let query = supabase
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
        animals!inner(tag_id, breed),
        users!inner(full_name)
      `);

    // Apply filters if provided
    if (certificate_type) {
      query = query.eq('certificate_type', certificate_type);
    }

    if (status) {
      if (status === 'active') {
        query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
      } else if (status === 'expired') {
        query = query.lt('expires_at', new Date().toISOString());
      }
    }

    // Order by issued date
    query = query.order('issued_at', { ascending: false });

    // Execute the query
    const { data: certificates, error } = await query;

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
      type: cert.certificate_type,
      issuerRole: cert.issuer_role,
      animalTag: cert.animals?.tag_id || 'Unknown',
      animalBreed: cert.animals?.breed || 'Unknown',
      issuerName: cert.users?.full_name || 'Unknown',
      issued: cert.issued_at ? new Date(cert.issued_at).toISOString().split('T')[0] : 'Unknown',
      expires: cert.expires_at ? new Date(cert.expires_at).toISOString().split('T')[0] : 'Never',
      onChainTxId: cert.on_chain_tx_id,
      hasDocument: !!cert.document_url
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
    console.error('Error in list-certs:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}