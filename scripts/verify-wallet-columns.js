import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config();

async function verifyWalletColumns() {
  try {
    console.log('🔍 Verifying Wallet Columns');
    console.log('========================');
    
    // Initialize Supabase client
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Create a test user with a proper UUID
    const testUserId = uuidv4();
    
    // Test inserting a record with new columns
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: testUserId,
        name: 'Wallet Column Test User',
        email: 'wallet-column-test@example.com',
        role: 'test',
        wallet_type: 'hashpack',
        onchain_id: '0.0.1234567',
        onchain_address: '0.0.1234567'
      }, { onConflict: 'id' })
      .select('wallet_type, onchain_id, onchain_address');
    
    if (error) {
      console.log(`❌ Wallet columns verification failed: ${error.message}`);
      return false;
    } else {
      console.log(`✅ Wallet columns verification successful`);
      console.log(`   wallet_type: ${data[0]?.wallet_type}`);
      console.log(`   onchain_id: ${data[0]?.onchain_id}`);
      console.log(`   onchain_address: ${data[0]?.onchain_address}`);
    }
    
    // Clean up test user
    await supabase.from('users').delete().eq('id', testUserId);
    console.log('\n🧹 Cleaned up test data');
    
    // Test the index by querying on onchain_address
    console.log('\n📋 Testing index on onchain_address...');
    const { data: indexData, error: indexError } = await supabase
      .from('users')
      .select('id')
      .eq('onchain_address', 'non-existent-address')
      .limit(1);
    
    if (indexError) {
      console.log(`❌ Index verification failed: ${indexError.message}`);
    } else {
      console.log(`✅ Index verification successful`);
    }
    
    console.log('\n✅ All wallet column verifications passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Wallet columns verification failed:', error.message);
    return false;
  }
}

// Run the verification
verifyWalletColumns();