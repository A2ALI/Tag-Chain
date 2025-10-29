console.log('🔍 Testing txTracer Utilities');
console.log('==========================');

async function testTxTracer() {
  let testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    overall: 'PENDING'
  };
  
  try {
    // Import the txTracer functions with correct path
    const {
      getHashScanUrl,
      getAccountHashScanUrl,
      getMirrorNodeTxUrl,
      getMirrorNodeAccountUrl,
      maskAddress,
      isValidHederaAccountId
    } = await import('../src/lib/txTracer.ts');
    
    // Test 1: Test getHashScanUrl function
    console.log('\n📋 Test 1: Testing getHashScanUrl function...');
    try {
      const testTxHash = '0x123456789abcdef';
      const url = getHashScanUrl(testTxHash, 'testnet');
      
      if (!url || !url.includes('hashscan.io')) {
        throw new Error('Invalid HashScan URL generated');
      }
      
      console.log(`✅ HashScan URL generated: ${url}`);
      
      testResults.tests.push({
        name: 'getHashScanUrl function',
        status: 'PASS',
        details: 'HashScan URL generated successfully'
      });
    } catch (error) {
      console.log(`❌ getHashScanUrl test failed: ${error.message}`);
      testResults.tests.push({
        name: 'getHashScanUrl function',
        status: 'FAIL',
        details: error.message
      });
    }
    
    // Test 2: Test getAccountHashScanUrl function
    console.log('\n📋 Test 2: Testing getAccountHashScanUrl function...');
    try {
      const testAccountId = '0.0.1234567';
      const url = getAccountHashScanUrl(testAccountId, 'testnet');
      
      if (!url || !url.includes('hashscan.io')) {
        throw new Error('Invalid account HashScan URL generated');
      }
      
      console.log(`✅ Account HashScan URL generated: ${url}`);
      
      testResults.tests.push({
        name: 'getAccountHashScanUrl function',
        status: 'PASS',
        details: 'Account HashScan URL generated successfully'
      });
    } catch (error) {
      console.log(`❌ getAccountHashScanUrl test failed: ${error.message}`);
      testResults.tests.push({
        name: 'getAccountHashScanUrl function',
        status: 'FAIL',
        details: error.message
      });
    }
    
    // Test 3: Test getMirrorNodeTxUrl function
    console.log('\n📋 Test 3: Testing getMirrorNodeTxUrl function...');
    try {
      const testTxHash = '0x123456789abcdef';
      const url = getMirrorNodeTxUrl(testTxHash, 'testnet');
      
      if (!url || !url.includes('mirrornode.hedera.com')) {
        throw new Error('Invalid Mirror Node transaction URL generated');
      }
      
      console.log(`✅ Mirror Node transaction URL generated: ${url}`);
      
      testResults.tests.push({
        name: 'getMirrorNodeTxUrl function',
        status: 'PASS',
        details: 'Mirror Node transaction URL generated successfully'
      });
    } catch (error) {
      console.log(`❌ getMirrorNodeTxUrl test failed: ${error.message}`);
      testResults.tests.push({
        name: 'getMirrorNodeTxUrl function',
        status: 'FAIL',
        details: error.message
      });
    }
    
    // Test 4: Test getMirrorNodeAccountUrl function
    console.log('\n📋 Test 4: Testing getMirrorNodeAccountUrl function...');
    try {
      const testAccountId = '0.0.1234567';
      const url = getMirrorNodeAccountUrl(testAccountId, 'testnet');
      
      if (!url || !url.includes('mirrornode.hedera.com')) {
        throw new Error('Invalid Mirror Node account URL generated');
      }
      
      console.log(`✅ Mirror Node account URL generated: ${url}`);
      
      testResults.tests.push({
        name: 'getMirrorNodeAccountUrl function',
        status: 'PASS',
        details: 'Mirror Node account URL generated successfully'
      });
    } catch (error) {
      console.log(`❌ getMirrorNodeAccountUrl test failed: ${error.message}`);
      testResults.tests.push({
        name: 'getMirrorNodeAccountUrl function',
        status: 'FAIL',
        details: error.message
      });
    }
    
    // Test 5: Test maskAddress function
    console.log('\n📋 Test 5: Testing maskAddress function...');
    try {
      const testCases = [
        { input: '0.0.1234567', expected: '0.0.12...4567' },
        { input: '0.0.999', expected: '0.0.999' },
        { input: null, expected: '' },
        { input: '', expected: '' }
      ];
      
      let allPassed = true;
      for (const testCase of testCases) {
        const result = maskAddress(testCase.input);
        if (result !== testCase.expected) {
          console.log(`❌ Mask address test failed for input: ${testCase.input}`);
          console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
          allPassed = false;
        }
      }
      
      if (allPassed) {
        console.log('✅ Address masking working correctly');
        testResults.tests.push({
          name: 'maskAddress function',
          status: 'PASS',
          details: 'Address masking working correctly'
        });
      } else {
        testResults.tests.push({
          name: 'maskAddress function',
          status: 'FAIL',
          details: 'Address masking failed for one or more test cases'
        });
      }
    } catch (error) {
      console.log(`❌ maskAddress test failed: ${error.message}`);
      testResults.tests.push({
        name: 'maskAddress function',
        status: 'FAIL',
        details: error.message
      });
    }
    
    // Test 6: Test isValidHederaAccountId function
    console.log('\n📋 Test 6: Testing isValidHederaAccountId function...');
    try {
      const validAccounts = ['0.0.1234567', '0.0.999', '0.0.1'];
      const invalidAccounts = ['0.1.1234567', '0.0', '1234567', '0.0.abc', ''];
      
      let allPassed = true;
      
      // Test valid accounts
      for (const account of validAccounts) {
        if (!isValidHederaAccountId(account)) {
          console.log(`❌ Valid account marked as invalid: ${account}`);
          allPassed = false;
        }
      }
      
      // Test invalid accounts
      for (const account of invalidAccounts) {
        if (isValidHederaAccountId(account)) {
          console.log(`❌ Invalid account marked as valid: ${account}`);
          allPassed = false;
        }
      }
      
      if (allPassed) {
        console.log('✅ Hedera account ID validation working correctly');
        testResults.tests.push({
          name: 'isValidHederaAccountId function',
          status: 'PASS',
          details: 'Hedera account ID validation working correctly'
        });
      } else {
        testResults.tests.push({
          name: 'isValidHederaAccountId function',
          status: 'FAIL',
          details: 'Hedera account ID validation failed for one or more test cases'
        });
      }
    } catch (error) {
      console.log(`❌ isValidHederaAccountId test failed: ${error.message}`);
      testResults.tests.push({
        name: 'isValidHederaAccountId function',
        status: 'FAIL',
        details: error.message
      });
    }
    
    // Calculate overall result
    const passedTests = testResults.tests.filter(test => test.status === 'PASS').length;
    const totalTests = testResults.tests.length;
    testResults.overall = passedTests === totalTests ? 'PASS' : 'FAIL';
    
    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    
    // Save results to file
    const fs = await import('fs');
    fs.writeFileSync(
      'reports/txTracer-test-results.json',
      JSON.stringify(testResults, null, 2)
    );
    console.log('📄 Test results saved to reports/txTracer-test-results.json');
    
    return testResults.overall === 'PASS';
    
  } catch (error) {
    console.error('❌ txTracer Test Failed:', error.message);
    
    // Save error results
    testResults.overall = 'FAIL';
    testResults.error = error.message;
    
    const fs = await import('fs');
    fs.writeFileSync(
      'reports/txTracer-test-results.json',
      JSON.stringify(testResults, null, 2)
    );
    
    return false;
  }
}

// Export the function as default
export default testTxTracer;

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testTxTracer();
}