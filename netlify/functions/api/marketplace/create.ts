import { createClient } from '@supabase/supabase-js';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { animal_id, price, currency, description } = JSON.parse(event.body);

    // Validate input
    if (!animal_id || !price) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Animal ID and price are required' })
      };
    }

    // Server-side client using service role key
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify that the animal exists and belongs to the user
    const { data: animal, error: animalError } = await supabase
      .from('animals')
      .select('farmer_id')
      .eq('id', animal_id)
      .single();

    if (animalError) {
      console.error('Error fetching animal:', animalError);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Animal not found' })
      };
    }

    // In a real implementation, we would verify the user's identity
    // For now, we'll use a placeholder for the seller_id
    const seller_id = animal.farmer_id;

    // Insert marketplace listing
    const { data: listing, error: insertError } = await supabase
      .from('marketplace_listings')
      .insert([
        {
          animal_id,
          seller_id,
          price,
          currency: currency || 'USDC',
          description: description || ''
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating listing:', insertError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to create marketplace listing' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'Marketplace listing created successfully',
        listing: listing
      })
    };
  } catch (error) {
    console.error('Error in marketplace create:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}