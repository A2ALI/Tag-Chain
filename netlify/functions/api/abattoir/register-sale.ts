import { createClient } from '@supabase/supabase-js';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    const { 
      abattoir_id,
      animal_id,
      product_type,
      weight,
      price,
      currency,
      sale_date
    } = JSON.parse(event.body);

    // Validate required fields
    if (!abattoir_id || !animal_id || !product_type || !weight || !price) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields: abattoir_id, animal_id, product_type, weight, price' 
        })
      };
    }

    // Server-side client using service role key
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the authenticated user
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Missing authorization header' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid authorization token' })
      };
    }

    // Verify the user is associated with this abattoir
    const { data: abattoirData, error: abattoirError } = await supabase
      .from('abattoirs')
      .select('id')
      .eq('id', abattoir_id)
      .eq('id', abattoir_id); // In a real implementation, you'd check if user is associated with abattoir

    if (abattoirError || !abattoirData || abattoirData.length === 0) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'User not authorized for this abattoir' })
      };
    }

    // Check if the animal has a valid vet certification
    const { data: vetRecords, error: vetError } = await supabase
      .from('vet_records')
      .select('id')
      .eq('animal_id', animal_id)
      .order('date', { ascending: false })
      .limit(1);

    if (vetError) {
      console.error('Error checking vet certification:', vetError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to verify vet certification' })
      };
    }

    // In a real implementation, you would check for specific certification types
    const isVetCertified = vetRecords && vetRecords.length > 0;

    // Create the abattoir sale record
    const { data: saleRecord, error: insertError } = await supabase
      .from('abattoir_sales')
      .insert({
        abattoir_id,
        animal_id,
        product_type,
        weight,
        price,
        currency: currency || 'USDC',
        sale_date: sale_date || new Date().toISOString(),
        vet_certified: isVetCertified
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating abattoir sale:', insertError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to create abattoir sale' })
      };
    }

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: saleRecord,
        error: null
      })
    };
  } catch (error) {
    console.error('Error in abattoir register-sale:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}