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

    // Fetch animals with health status
    const { data: animals, error: fetchError } = await supabase
      .from('animals')
      .select('health_status');
    
    if (fetchError) {
      console.error('Error fetching animals:', fetchError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch animals' })
      };
    }

    // Group animals by health status
    const healthCounts: { [key: string]: number } = {};
    animals.forEach((animal: any) => {
      healthCounts[animal.health_status] = (healthCounts[animal.health_status] || 0) + 1;
    });

    // Format the data for the frontend
    const healthStats = Object.keys(healthCounts).map(healthStatus => ({
      name: healthStatus,
      value: healthCounts[healthStatus],
      color: getColorForHealthStatus(healthStatus)
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: healthStats,
        error: null
      })
    };
  } catch (error) {
    console.error('Error in health stats:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}

function getColorForHealthStatus(status: string): string {
  switch (status.toLowerCase()) {
    case 'excellent':
      return '#2A9D8F';
    case 'good':
      return '#F4A261';
    case 'fair':
      return '#E76F51';
    case 'poor':
      return '#E63946';
    default:
      return '#8D99AE';
  }
}