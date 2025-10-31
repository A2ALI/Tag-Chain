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

    // Fetch pending certificate requests
    const { data: requests, error } = await supabase
      .from('certificate_requests')
      .select(`
        id,
        type,
        applicant_name,
        batch_id,
        animal_id,
        submitted_at,
        documents
      `)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending requests:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch pending requests' })
      };
    }

    // Format the data for the frontend
    const pendingRequests = requests.map((request: any) => ({
      id: request.id,
      type: request.type,
      applicant: request.applicant_name,
      batchId: request.batch_id,
      animalId: request.animal_id,
      submitted: new Date(request.submitted_at).toISOString().split('T')[0],
      documents: request.documents || []
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: pendingRequests,
        error: null
      })
    };
  } catch (error) {
    console.error('Error in pending requests:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}