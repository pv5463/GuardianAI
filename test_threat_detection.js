/**
 * Quick test script for threat detection
 * Run with: node test_threat_detection.js
 */

const AI_ENGINE_URL = 'http://localhost:8000';

async function testHealthCheck() {
  console.log('\n🔍 Testing AI Engine Health...');
  try {
    const response = await fetch(`${AI_ENGINE_URL}/health`);
    const data = await response.json();
    console.log('✅ Health Check:', data);
    return data.status === 'healthy';
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    console.log('\n⚠️  Make sure AI Engine is running:');
    console.log('   cd guardian_ai_engine');
    console.log('   python main.py');
    return false;
  }
}

async function testLoginThreatDetection() {
  console.log('\n🔍 Testing Login Threat Detection...');
  
  const testCases = [
    {
      name: 'Normal Login',
      data: {
        failed_attempts: 1,
        country_changed: false,
        role_access_attempt: 0,
        login_gap_minutes: 120
      }
    },
    {
      name: 'Brute Force Attack',
      data: {
        failed_attempts: 5,
        country_changed: false,
        role_access_attempt: 0,
        login_gap_minutes: 2
      }
    },
    {
      name: 'Impossible Travel',
      data: {
        failed_attempts: 2,
        country_changed: true,
        role_access_attempt: 0,
        login_gap_minutes: 30
      }
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n  Testing: ${testCase.name}`);
      const response = await fetch(`${AI_ENGINE_URL}/predict/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.data)
      });
      
      const result = await response.json();
      console.log(`  ✅ Risk Score: ${result.risk_score}%`);
      console.log(`  ✅ Risk Level: ${result.risk_level}`);
      console.log(`  ✅ Classification: ${result.classification}`);
      console.log(`  ✅ Incident Required: ${result.incident_required}`);
      console.log(`  ✅ Explanation:`, result.explanation.slice(0, 2).join(', '));
    } catch (error) {
      console.error(`  ❌ Test Failed:`, error.message);
    }
  }
}

async function testURLDetection() {
  console.log('\n🔍 Testing URL Phishing Detection...');
  
  const testURLs = [
    { name: 'Safe URL', url: 'https://www.google.com' },
    { name: 'Suspicious URL', url: 'http://paypal-secure-login.tk/verify' },
    { name: 'Phishing URL', url: 'http://amaz0n-login.xyz/account/verify?id=12345' }
  ];

  for (const test of testURLs) {
    try {
      console.log(`\n  Testing: ${test.name}`);
      const response = await fetch(`${AI_ENGINE_URL}/predict/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: test.url })
      });
      
      const result = await response.json();
      console.log(`  ✅ Risk Score: ${result.risk_score}%`);
      console.log(`  ✅ Classification: ${result.classification}`);
      console.log(`  ✅ Reasons:`, result.explanation.slice(0, 2).join(', '));
    } catch (error) {
      console.error(`  ❌ Test Failed:`, error.message);
    }
  }
}

async function testSMSDetection() {
  console.log('\n🔍 Testing SMS Scam Detection...');
  
  const testMessages = [
    { 
      name: 'Normal SMS', 
      text: 'Hey, are we still meeting for lunch tomorrow?' 
    },
    { 
      name: 'Suspicious SMS', 
      text: 'Your package is waiting. Click here to confirm delivery: http://bit.ly/xyz' 
    },
    { 
      name: 'Scam SMS', 
      text: 'URGENT! Your bank account will be locked in 24 hours. Verify now: http://secure-bank-verify.tk' 
    }
  ];

  for (const test of testMessages) {
    try {
      console.log(`\n  Testing: ${test.name}`);
      const response = await fetch(`${AI_ENGINE_URL}/predict/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: test.text })
      });
      
      const result = await response.json();
      console.log(`  ✅ Risk Score: ${result.risk_score}%`);
      console.log(`  ✅ Classification: ${result.classification}`);
      console.log(`  ✅ Keywords:`, result.explanation.slice(0, 3).join(', '));
    } catch (error) {
      console.error(`  ❌ Test Failed:`, error.message);
    }
  }
}

async function runAllTests() {
  console.log('========================================');
  console.log('Guardian AI Threat Detection Test Suite');
  console.log('========================================');

  const isHealthy = await testHealthCheck();
  
  if (!isHealthy) {
    console.log('\n❌ Cannot proceed with tests. AI Engine is not running.');
    console.log('\nTo start the AI Engine:');
    console.log('  1. Open a new terminal');
    console.log('  2. cd guardian_ai_engine');
    console.log('  3. python main.py');
    console.log('  4. Run this test again');
    return;
  }

  await testLoginThreatDetection();
  await testURLDetection();
  await testSMSDetection();

  console.log('\n========================================');
  console.log('✅ All Tests Complete!');
  console.log('========================================\n');
}

// Run tests
runAllTests().catch(console.error);
