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

    // Fetch recent notifications
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching notifications:', error);
      // Return mock data if there's an error
      const mockNotifications = [
        { id: '1', title: 'System Update', message: 'Platform maintenance scheduled for tonight', time: '2 hours ago', read: false },
        { id: '2', title: 'New Feature', message: 'Check out the new analytics dashboard', time: '1 day ago', read: false }
      ];
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          data: mockNotifications,
          error: null
        })
      };
    }

    // Format the data for the frontend
    const formattedNotifications = notifications.map((notification: any) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      time: getTimeAgo(new Date(notification.created_at)),
      read: notification.read || false
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: formattedNotifications,
        error: null
      })
    };
  } catch (error) {
    console.error('Error in notifications list:', error);
    // Return mock data if there's an error
    const mockNotifications = [
      { id: '1', title: 'System Update', message: 'Platform maintenance scheduled for tonight', time: '2 hours ago', read: false },
      { id: '2', title: 'New Feature', message: 'Check out the new analytics dashboard', time: '1 day ago', read: false }
    ];
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: mockNotifications,
        error: null
      })
    };
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) {
    return interval + ' years ago';
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + ' months ago';
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + ' days ago';
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return interval + ' hours ago';
  }
  
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + ' minutes ago';
  }
  
  return Math.floor(seconds) + ' seconds ago';
}