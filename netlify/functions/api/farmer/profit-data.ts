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

    // For now, we'll return mock data since we don't have a transactions table
    // In a real implementation, this would fetch actual transaction data
    const profitData = [
      { month: 'Jan', revenue: 4500, expenses: 2000 },
      { month: 'Feb', revenue: 3800, expenses: 1800 },
      { month: 'Mar', revenue: 5200, expenses: 2200 },
      { month: 'Apr', revenue: 4900, expenses: 2100 },
      { month: 'May', revenue: 5600, expenses: 2300 },
      { month: 'Jun', revenue: 6100, expenses: 2500 }
    ];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: profitData,
        error: null
      })
    };
  } catch (error) {
    console.error('Error in profit data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}