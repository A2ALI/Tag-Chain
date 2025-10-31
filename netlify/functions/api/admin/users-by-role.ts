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

    // Fetch all users
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('role');
    
    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch users' })
      };
    }

    // Group and count users by role manually
    const roleCounts: { [key: string]: number } = {};
    users.forEach((user: any) => {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    });

    // Format the data for the frontend
    const usersByRole = Object.keys(roleCounts).map(role => ({
      role,
      count: roleCounts[role]
    }));

    const formattedData = usersByRole.map((item: any) => ({
      role: item.role,
      count: item.count,
      color: getColorForRole(item.role)
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: formattedData,
        error: null
      })
    };
  } catch (error) {
    console.error('Error in users by role:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}

function getColorForRole(role: string): string {
  switch (role) {
    case 'farmer':
      return '#004643';
    case 'buyer':
      return '#E76F51';
    case 'veterinarian':
      return '#264653';
    case 'regulator':
      return '#6AB0A5';
    default:
      return '#6AB0A5';
  }
}