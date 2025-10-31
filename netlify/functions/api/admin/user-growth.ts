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

    // Fetch users with created_at timestamp
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('created_at');
    
    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch users' })
      };
    }

    // Group users by month
    const monthlyCounts: { [key: string]: number } = {};
    
    users.forEach((user: any) => {
      // Extract month from created_at timestamp
      const date = new Date(user.created_at);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const monthYear = `${month} ${year}`;
      
      monthlyCounts[monthYear] = (monthlyCounts[monthYear] || 0) + 1;
    });

    // Format the data for the frontend
    const adoptionData = Object.keys(monthlyCounts).map(monthYear => ({
      month: monthYear.split(' ')[0], // Just the month part
      users: monthlyCounts[monthYear]
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: adoptionData,
        error: null
      })
    };
  } catch (error) {
    console.error('Error in user growth:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}