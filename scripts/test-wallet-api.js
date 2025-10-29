import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config();

async function testWalletAPI() {
  console.log('🔍 Testing Wallet API Endpoints');
  console.log('==============================');
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  );
  
  let testUserId = null;
  let testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    overall: 'PENDING'
  };
  
  try {
    // Create a test user
    console.log('\n📋 Setting up test user...');
    testUserId = uuidv4();
    const testWalletAddress = '0.0.9999999';
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        id: testUserId,
        name: 'API Test User',
        email: 'api-test@example.com',
        role: 'test'
      }, { onConflict: 'id' })
      .select('id');
    
    if (userError) {
      throw new Error(`Failed to create test user: ${userError.message}`);
    }
    
    console.log(`✅ Created test user: ${userData[0].id}`);
    
    // Test 1: Mock connect endpoint
    console.log('\n📋 Test 1: Testing connect endpoint logic...');
    try {
      // Simulate what the connect endpoint does
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          wallet_type: 'hashpack',
          onchain_id: testWalletAddress,
          onchain_address: testWalletAddress
        })
        .eq('id', testUserId)
        .select('wallet_type, onchain_address')
        .single();
      
      if (updateError) {
        throw new Error(`Failed to update user: ${updateError.message}`);
      }
      
      console.log(`✅ User wallet info updated`);
      console.log(`   wallet_type: ${updatedUser.wallet_type}`);
      console.log(`   onchain_address: ${updatedUser.onchain_address}`);
      
      testResults.tests.push({
        name: 'Connect endpoint simulation',
        status: 'PASS',
        details: 'User wallet information updated successfully'
      });
    } catch (error) {
      console.log(`❌ Connect endpoint test failed: ${error.message}`);
      testResults.tests.push({
        name: 'Connect endpoint simulation',
        status: 'FAIL',
        details: error.message
      });
    }
    
    // Test 2: Mock get-linked-wallet endpoint
    console.log('\n📋 Test 2: Testing get-linked-wallet endpoint logic...');
    try {
      // Simulate what the get-linked-wallet endpoint does
      const { data: walletData, error: selectError } = await supabase
        .from('users')
        .select('wallet_type, onchain_address')
        .eq('id', testUserId)
        .single();
      
      if (selectError) {
        throw new Error(`Failed to fetch user wallet: ${selectError.message}`);
      }
      
      if (!walletData.wallet_type || !walletData.onchain_address) {
        throw new Error('No wallet linked to user');
      }
      
      console.log(`✅ Wallet information retrieved`);
      console.log(`   wallet_type: ${walletData.wallet_type}`);
      console.log(`   onchain_address: ${walletData.onchain_address}`);
      
      testResults.tests.push({
        name: 'Get-linked-wallet endpoint simulation',
        status: 'PASS',
        details: 'Wallet information retrieved successfully'
      });
    } catch (error) {
      console.log(`❌ Get-linked-wallet endpoint test failed: ${error.message}`);
      testResults.tests.push({
        name: 'Get-linked-wallet endpoint simulation',
        status: 'FAIL',
        details: error.message
      });
    }
    
    // Test 3: Mock disconnect endpoint
    console.log('\n📋 Test 3: Testing disconnect endpoint logic...');
    try {
      // Simulate what the disconnect endpoint does
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          wallet_type: null,
          onchain_id: null,
          onchain_address: null
        })
        .eq('id', testUserId)
        .select('wallet_type, onchain_address')
        .single();
      
      if (updateError) {
        throw new Error(`Failed to disconnect user wallet: ${updateError.message}`);
      }
      
      console.log(`✅ User wallet disconnected`);
      
      testResults.tests.push({
        name: 'Disconnect endpoint simulation',
        status: 'PASS',
        details: 'User wallet information cleared successfully'
      });
    } catch (error) {
      console.log(`❌ Disconnect endpoint test failed: ${error.message}`);
      testResults.tests.push({
        name: 'Disconnect endpoint simulation',
        status: 'FAIL',
        details: error.message
      });
    }
    
    // Test 4: Verify security logging
    console.log('\n📋 Test 4: Testing security event logging...');
    try {
      // Simulate security event logging
      const { error: logError } = await supabase
        .from('security_events')
        .insert({
          event_type: 'test_wallet_api',
          severity: 'info',
          user_id: testUserId,
          message: 'API test security event',
          timestamp: new Date().toISOString()
        });
      
      if (logError) {
        throw new Error(`Failed to log security event: ${logError.message}`);
      }
      
      console.log(`✅ Security event logged`);
      
      testResults.tests.push({
        name: 'Security event logging',
        status: 'PASS',
        details: 'Security event logged successfully'
      });
    } catch (error) {
      console.log(`❌ Security event logging test failed: ${error.message}`);
      testResults.tests.push({
        name: 'Security event logging',
        status: 'FAIL',
        details: error.message
      });
    }
    
    // Clean up
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('security_events').delete().eq('event_type', 'test_wallet_api');
    await supabase.from('users').delete().eq('id', testUserId);
    console.log('✅ Test data cleaned up');
    
    // Calculate overall result
    const passedTests = testResults.tests.filter(test => test.status === 'PASS').length;
    const totalTests = testResults.tests.length;
    testResults.overall = passedTests === totalTests ? 'PASS' : 'FAIL';
    
    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    
    // Save results to file
    const fs = await import('fs');
    fs.writeFileSync(
      'reports/wallet-api-test-results.json',
      JSON.stringify(testResults, null, 2)
    );
    console.log('📄 Test results saved to reports/wallet-api-test-results.json');
    
    return testResults.overall === 'PASS';
    
  } catch (error) {
    console.error('❌ Wallet API Test Failed:', error.message);
    
    // Save error results
    testResults.overall = 'FAIL';
    testResults.error = error.message;
    
    const fs = await import('fs');
    fs.writeFileSync(
      'reports/wallet-api-test-results.json',
      JSON.stringify(testResults, null, 2)
    );
    
    // Clean up if user was created
    if (testUserId) {
      await supabase.from('users').delete().eq('id', testUserId);
    }
    
    return false;
  }
}

// Run the test
testWalletAPI();