import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config();

async function testSecurityLogger() {
  console.log('🔍 Testing Security Logger');
  console.log('========================');
  
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
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        id: testUserId,
        name: 'Security Logger Test User',
        email: 'security-test@example.com',
        role: 'test'
      }, { onConflict: 'id' })
      .select('id');
    
    if (userError) {
      throw new Error(`Failed to create test user: ${userError.message}`);
    }
    
    console.log(`✅ Created test user: ${userData[0].id}`);
    
    // Test 1: Test logSecurityEvent function
    console.log('\n📋 Test 1: Testing logSecurityEvent function...');
    try {
      // Import the security logger functions
      const { logSecurityEvent } = await import('../src/lib/securityLogger');
      
      // Test logging a security event
      const result = await logSecurityEvent({
        userId: testUserId,
        event: 'test_security_event',
        severity: 'info',
        details: 'Test security event from QA script',
        tx_hash: '0x123456789abcdef',
        wallet_address: '0.0.1234567'
      });
      
      if (!result.success) {
        throw new Error(`Failed to log security event: ${result.error}`);
      }
      
      console.log('✅ Security event logged successfully');
      
      testResults.tests.push({
        name: 'logSecurityEvent function',
        status: 'PASS',
        details: 'Security event logged successfully'
      });
    } catch (error) {
      console.log(`❌ logSecurityEvent test failed: ${error.message}`);
      testResults.tests.push({
        name: 'logSecurityEvent function',
        status: 'FAIL',
        details: error.message
      });
    }
    
    // Test 2: Test logWalletConnect function
    console.log('\n📋 Test 2: Testing logWalletConnect function...');
    try {
      const { logWalletConnect } = await import('../src/lib/securityLogger');
      
      // Test logging a wallet connect event
      const result = await logWalletConnect(testUserId, '0.0.1234567', 'hashpack');
      
      if (!result.success) {
        throw new Error(`Failed to log wallet connect event: ${result.error}`);
      }
      
      console.log('✅ Wallet connect event logged successfully');
      
      testResults.tests.push({
        name: 'logWalletConnect function',
        status: 'PASS',
        details: 'Wallet connect event logged successfully'
      });
    } catch (error) {
      console.log(`❌ logWalletConnect test failed: ${error.message}`);
      testResults.tests.push({
        name: 'logWalletConnect function',
        status: 'FAIL',
        details: error.message
      });
    }
    
    // Test 3: Test logWalletDisconnect function
    console.log('\n📋 Test 3: Testing logWalletDisconnect function...');
    try {
      const { logWalletDisconnect } = await import('../src/lib/securityLogger');
      
      // Test logging a wallet disconnect event
      const result = await logWalletDisconnect(testUserId, '0.0.1234567');
      
      if (!result.success) {
        throw new Error(`Failed to log wallet disconnect event: ${result.error}`);
      }
      
      console.log('✅ Wallet disconnect event logged successfully');
      
      testResults.tests.push({
        name: 'logWalletDisconnect function',
        status: 'PASS',
        details: 'Wallet disconnect event logged successfully'
      });
    } catch (error) {
      console.log(`❌ logWalletDisconnect test failed: ${error.message}`);
      testResults.tests.push({
        name: 'logWalletDisconnect function',
        status: 'FAIL',
        details: error.message
      });
    }
    
    // Test 4: Test logFailedWalletConnect function
    console.log('\n📋 Test 4: Testing logFailedWalletConnect function...');
    try {
      const { logFailedWalletConnect } = await import('../src/lib/securityLogger');
      
      // Test logging a failed wallet connect event
      const result = await logFailedWalletConnect(testUserId, 'Test error message', 1);
      
      if (!result.success) {
        throw new Error(`Failed to log failed wallet connect event: ${result.error}`);
      }
      
      console.log('✅ Failed wallet connect event logged successfully');
      
      testResults.tests.push({
        name: 'logFailedWalletConnect function',
        status: 'PASS',
        details: 'Failed wallet connect event logged successfully'
      });
    } catch (error) {
      console.log(`❌ logFailedWalletConnect test failed: ${error.message}`);
      testResults.tests.push({
        name: 'logFailedWalletConnect function',
        status: 'FAIL',
        details: error.message
      });
    }
    
    // Test 5: Verify security events were logged
    console.log('\n📋 Test 5: Verifying security events in database...');
    try {
      // Query for the logged events
      const { data: events, error: queryError } = await supabase
        .from('security_events')
        .select('event_type, severity, user_id, wallet_address')
        .eq('user_id', testUserId)
        .limit(5);
      
      if (queryError) {
        throw new Error(`Failed to query security events: ${queryError.message}`);
      }
      
      console.log(`✅ Found ${events.length} security events for test user`);
      
      // Check that we have the expected events
      const eventTypes = events.map(event => event.event_type);
      const expectedEvents = ['test_security_event', 'wallet_connect', 'wallet_disconnect', 'failed_wallet_connect'];
      
      const missingEvents = expectedEvents.filter(event => !eventTypes.includes(event));
      if (missingEvents.length > 0) {
        throw new Error(`Missing expected events: ${missingEvents.join(', ')}`);
      }
      
      console.log('✅ All expected security events found in database');
      
      testResults.tests.push({
        name: 'Security events verification',
        status: 'PASS',
        details: `Found ${events.length} security events for test user`
      });
    } catch (error) {
      console.log(`❌ Security events verification failed: ${error.message}`);
      testResults.tests.push({
        name: 'Security events verification',
        status: 'FAIL',
        details: error.message
      });
    }
    
    // Clean up
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('security_events').delete().eq('user_id', testUserId);
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
      'reports/security-logger-test-results.json',
      JSON.stringify(testResults, null, 2)
    );
    console.log('📄 Test results saved to reports/security-logger-test-results.json');
    
    return testResults.overall === 'PASS';
    
  } catch (error) {
    console.error('❌ Security Logger Test Failed:', error.message);
    
    // Save error results
    testResults.overall = 'FAIL';
    testResults.error = error.message;
    
    const fs = await import('fs');
    fs.writeFileSync(
      'reports/security-logger-test-results.json',
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
testSecurityLogger();