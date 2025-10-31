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

    // Fetch certificates with issued_at timestamp
    const { data: certificates, error: fetchError } = await supabase
      .from('certificates')
      .select('type, issued_at');
    
    if (fetchError) {
      console.error('Error fetching certificates:', fetchError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch certificates' })
      };
    }

    // Group certificates by month and type
    const monthlyStats: { [key: string]: { export: number; halal: number; movement: number } } = {};
    
    certificates.forEach((cert: any) => {
      // Extract month from issued_at timestamp
      const date = new Date(cert.issued_at);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const monthYear = `${month} ${year}`;
      
      // Initialize month if not exists
      if (!monthlyStats[monthYear]) {
        monthlyStats[monthYear] = { export: 0, halal: 0, movement: 0 };
      }
      
      // Increment count based on certificate type
      switch (cert.type.toLowerCase()) {
        case 'export':
          monthlyStats[monthYear].export += 1;
          break;
        case 'halal':
          monthlyStats[monthYear].halal += 1;
          break;
        case 'movement':
          monthlyStats[monthYear].movement += 1;
          break;
      }
    });

    // Format the data for the frontend
    const certData = Object.keys(monthlyStats).map(monthYear => ({
      month: monthYear.split(' ')[0], // Just the month part
      export: monthlyStats[monthYear].export,
      halal: monthlyStats[monthYear].halal,
      movement: monthlyStats[monthYear].movement
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: certData,
        error: null
      })
    };
  } catch (error) {
    console.error('Error in certification stats:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}