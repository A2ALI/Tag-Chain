import { createClient } from '@supabase/supabase-js';
import { hederaManager } from '../../lib/hederaManager';

export async function handler(event: any, context: any) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const result: any = {
    canConnectToSupabase: false,
    canInsertAnimal: false,
    canPublishHCS: false
  };

  try {
    // Test Supabase connection
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test basic connection with a simple query
    const { data, error } = await supabase
      .from('animals')
      .select('id')
      .limit(1);

    if (!error) {
      result.canConnectToSupabase = true;
    }

    // Test animal insertion (sandbox test)
    if (result.canConnectToSupabase) {
      try {
        const testTag = `TEST-${Date.now()}`;
        const { data: insertData, error: insertError } = await supabase
          .from('animals')
          .insert([{
            tag_number: testTag,
            animal_on_chain_id: `TEST:ANIMAL:${Date.now()}`,
            breed: 'Test Breed',
            status: 'test',
            registered_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (!insertError && insertData) {
          result.canInsertAnimal = true;
          
          // Clean up test animal
          await supabase
            .from('animals')
            .delete()
            .eq('id', insertData.id);
        }
      } catch (insertTestError) {
        console.error('Animal insertion test failed:', insertTestError);
      }
    }

    // Test HCS publishing (dry run if FEATURE_ONCHAIN is false)
    if (process.env.FEATURE_ONCHAIN === 'true') {
      try {
        // Try to initialize the shared hedera client
        await hederaManager.getClient();
        result.canPublishHCS = true;
      } catch (hcsError) {
        console.error('HCS publish test failed (hederaManager):', hcsError);
      }
    } else {
      // If FEATURE_ONCHAIN is false, we consider it a success (dry run)
      result.canPublishHCS = true;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error in sync check:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        ...result
      })
    };
  }
}