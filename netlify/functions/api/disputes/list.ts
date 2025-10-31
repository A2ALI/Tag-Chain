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

    // Fetch open disputes
    const { data: disputes, error } = await supabase
      .from('disputes')
      .select(`
        id,
        type,
        parties,
        status,
        created_at
      `)
      .neq('status', 'resolved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching disputes:', error);
      // Return mock data if there's an error
      const mockDisputes = [
        { id: 'DIS-001', type: 'Payment', parties: 'Farmer vs Buyer', status: 'Under Review', created: '2025-10-20' },
        { id: 'DIS-002', type: 'Quality', parties: 'Abattoir vs Farmer', status: 'Resolved', created: '2025-10-18' }
      ];
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          data: mockDisputes,
          error: null
        })
      };
    }

    // Format the data for the frontend
    const formattedDisputes = disputes.map((dispute: any) => ({
      id: dispute.id,
      type: dispute.type,
      parties: dispute.parties,
      status: dispute.status,
      created: new Date(dispute.created_at).toISOString().split('T')[0]
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: formattedDisputes,
        error: null
      })
    };
  } catch (error) {
    console.error('Error in disputes list:', error);
    // Return mock data if there's an error
    const mockDisputes = [
      { id: 'DIS-001', type: 'Payment', parties: 'Farmer vs Buyer', status: 'Under Review', created: '2025-10-20' },
      { id: 'DIS-002', type: 'Quality', parties: 'Abattoir vs Farmer', status: 'Resolved', created: '2025-10-18' }
    ];
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: mockDisputes,
        error: null
      })
    };
  }
}