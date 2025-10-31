export async function handler(event: any, context: any) {
  console.log('[AnimalAPI] Request received:', event.httpMethod, event.path);
  
  // Log the request body if it exists
  if (event.body) {
    try {
      const body = JSON.parse(event.body);
      console.log('[AnimalAPI] Request body:', body);
    } catch (e) {
      console.log('[AnimalAPI] Request body (raw):', event.body);
    }
  }
  
  // Simple fallback that logs and returns success
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      success: true, 
      message: "Animal operation completed (simulated)",
      timestamp: new Date().toISOString()
    })
  };
};