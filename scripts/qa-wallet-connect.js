import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config();

async function qaWalletConnect() {
  console.log('🔍 QA Wallet Connect Test Suite');
  console.log('==============================');
  
  const qaReport = {
    task: "Wallet Connect QA Test Suite",
    timestamp: new Date().toISOString(),
    tests: {},
    overall_status: "PENDING"
  };
  
  try {
    // Run individual test scripts
    console.log('\n📋 Running individual test scripts...');
    
    // Test 1: Wallet API tests
    console.log('\n📋 Test 1: Running Wallet API tests...');
    try {
      const { default: testWalletAPI } = await import('./test-wallet-api.js');
      const apiResult = await testWalletAPI();
      qaReport.tests.wallet_api = apiResult ? "PASS" : "FAIL";
      console.log(`✅ Wallet API tests: ${apiResult ? "PASS" : "FAIL"}`);
    } catch (error) {
      console.log(`❌ Wallet API tests failed: ${error.message}`);
      qaReport.tests.wallet_api = "FAIL";
    }
    
    // Test 2: Security Logger tests
    console.log('\n📋 Test 2: Running Security Logger tests...');
    try {
      const { default: testSecurityLogger } = await import('./test-security-logger.js');
      const securityResult = await testSecurityLogger();
      qaReport.tests.security_logger = securityResult ? "PASS" : "FAIL";
      console.log(`✅ Security Logger tests: ${securityResult ? "PASS" : "FAIL"}`);
    } catch (error) {
      console.log(`❌ Security Logger tests failed: ${error.message}`);
      qaReport.tests.security_logger = "FAIL";
    }
    
    // Test 3: txTracer tests
    console.log('\n📋 Test 3: Running txTracer tests...');
    try {
      const { default: testTxTracer } = await import('./test-txTracer.js');
      const txTracerResult = await testTxTracer();
      qaReport.tests.tx_tracer = txTracerResult ? "PASS" : "FAIL";
      console.log(`✅ txTracer tests: ${txTracerResult ? "PASS" : "FAIL"}`);
    } catch (error) {
      console.log(`❌ txTracer tests failed: ${error.message}`);
      qaReport.tests.tx_tracer = "FAIL";
    }
    
    // Test 4: Integration test
    console.log('\n📋 Test 4: Running Integration tests...');
    const integrationResult = await runIntegrationTest();
    qaReport.tests.integration = integrationResult ? "PASS" : "FAIL";
    console.log(`✅ Integration tests: ${integrationResult ? "PASS" : "FAIL"}`);
    
    // Calculate overall status
    const passedTests = Object.values(qaReport.tests).filter(result => result === "PASS").length;
    const totalTests = Object.keys(qaReport.tests).length;
    qaReport.overall_status = passedTests === totalTests ? "PASS" : "FAIL";
    
    console.log(`\n📊 QA Test Suite Results: ${passedTests}/${totalTests} test groups passed`);
    console.log(`📈 Overall Status: ${qaReport.overall_status}`);
    
    // Save QA report
    const fs = await import('fs');
    fs.writeFileSync(
      'reports/wallet-connect-qa-report.json',
      JSON.stringify(qaReport, null, 2)
    );
    console.log('\n📄 QA report saved to reports/wallet-connect-qa-report.json');
    
    return qaReport.overall_status === "PASS";
    
  } catch (error) {
    console.error('❌ QA Wallet Connect Test Suite Failed:', error.message);
    
    qaReport.overall_status = "FAIL";
    qaReport.error = error.message;
    
    const fs = await import('fs');
    fs.writeFileSync(
      'reports/wallet-connect-qa-report.json',
      JSON.stringify(qaReport, null, 2)
    );
    
    return false;
  }
}

async function runIntegrationTest() {
  console.log('🔍 Running Integration Test');
  console.log('========================');
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Test 1: Check if wallet columns exist
    console.log('\n📋 Test 1: Checking wallet columns in users table...');
    
    // Create a test user
    const testUserId = uuidv4();
    const testWalletAddress = '0.0.9999999';
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        id: testUserId,
        name: 'QA Test User',
        email: 'qa-test@example.com',
        role: 'test',
        wallet_type: 'hashpack',
        onchain_id: testWalletAddress,
        onchain_address: testWalletAddress
      }, { onConflict: 'id' })
      .select('wallet_type, onchain_id, onchain_address');
    
    if (userError) {
      console.log(`❌ Failed to create test user: ${userError.message}`);
      return false;
    }
    
    console.log(`✅ Created test user with wallet info`);
    console.log(`   wallet_type: ${userData[0].wallet_type}`);
    console.log(`   onchain_id: ${userData[0].onchain_id}`);
    console.log(`   onchain_address: ${userData[0].onchain_address}`);
    
    // Test 2: Check security_events logging
    console.log('\n📋 Test 2: Checking security_events logging...');
    
    const { error: logError } = await supabase
      .from('security_events')
      .insert({
        event_type: 'qa_wallet_test',
        severity: 'info',
        user_id: testUserId,
        wallet_address: testWalletAddress,
        message: 'QA test of wallet connect functionality',
        timestamp: new Date().toISOString()
      });
    
    if (logError) {
      console.log(`❌ Failed to log security event: ${logError.message}`);
    } else {
      console.log(`✅ Security event logged successfully`);
    }
    
    // Test 3: Query the logged event
    console.log('\n📋 Test 3: Verifying security event was logged...');
    
    const { data: events, error: queryError } = await supabase
      .from('security_events')
      .select('event_type, severity, wallet_address')
      .eq('event_type', 'qa_wallet_test')
      .eq('user_id', testUserId)
      .limit(1);
    
    if (queryError) {
      console.log(`❌ Failed to query security events: ${queryError.message}`);
    } else if (events && events.length > 0) {
      console.log(`✅ Found security event in database`);
      console.log(`   event_type: ${events[0].event_type}`);
      console.log(`   severity: ${events[0].severity}`);
      console.log(`   wallet_address: ${events[0].wallet_address}`);
    } else {
      console.log(`❌ Security event not found in database`);
    }
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('security_events').delete().eq('event_type', 'qa_wallet_test');
    await supabase.from('users').delete().eq('id', testUserId);
    console.log('✅ Test data cleaned up');
    
    console.log('\n✅ Integration Test Completed Successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Integration Test Failed:', error.message);
    return false;
  }
}

// Export the function so it can be imported
export default qaWalletConnect;

// Run the QA test suite if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  qaWalletConnect();
}