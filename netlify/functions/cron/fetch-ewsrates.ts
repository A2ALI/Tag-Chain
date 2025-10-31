import { createClient } from '@supabase/supabase-js';

export async function handler(event: any, context: any) {
  // This function can be called as a cron job or via HTTP POST
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Import and call the EWS fetch-and-store function
    const { handler: ewsHandler } = await import('../api/ews/fetch-and-store');
    
    // Call the EWS function with the same event and context
    return await ewsHandler(event, context);
  } catch (error) {
    console.error('Error in EWS rates fetch:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}