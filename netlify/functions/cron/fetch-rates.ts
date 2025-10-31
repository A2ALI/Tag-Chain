import { Handler } from '@netlify/functions';
import { rateEngine } from '../../src/lib/rateEngine';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    console.log('Starting rate fetch cron job...');
    
    // Fetch rates using the rate engine
    await rateEngine.fetchRates();
    
    // Create report
    const report = {
      timestamp: new Date().toISOString(),
      status: 'success',
      message: 'Rates fetched successfully'
    };
    
    // In a real implementation, you would save this report to a file
    // For now, we'll just log it
    console.log('Rate fetch report:', report);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
    };
  } catch (error: any) {
    console.error('Error in rate fetch cron job:', error);
    
    const errorReport = {
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message
    };
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorReport),
    };
  }
};