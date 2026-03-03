/**
 * Diagnostic script for threat detection system
 * Run with: node diagnose_threat_detection.js
 */

const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('Guardian AI - Threat Detection Diagnostics');
console.log('========================================\n');

// Check 1: Environment file
console.log('✓ Checking environment configuration...');
const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('NEXT_PUBLIC_AI_ENGINE_URL')) {
    const match = envContent.match(/NEXT_PUBLIC_AI_ENGINE_URL=(.+)/);
    if (match) {
      console.log(`  ✅ AI Engine URL configured: ${match[1]}`);
    }
  } else {
    console.log('  ❌ NEXT_PUBLIC_AI_ENGINE_URL not found in .env.local');
    console.log('  Add this line: NEXT_PUBLIC_AI_ENGINE_URL=http://localhost:8000');
  }
  
  if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL')) {
    console.log('  ✅ Supabase URL configured');
  } else {
    console.log('  ❌ Supabase URL not configured');
  }
} else {
  console.log('  ❌ .env.local file not found');
}

// Check 2: AI Engine files
console.log('\n✓ Checking AI Engine files...');
const aiEngineFiles = [
  'guardian_ai_engine/main.py',
  'guardian_ai_engine/utils/feature_extraction.py',
  'guardian_ai_engine/models/login_model.pkl',
  'guardian_ai_engine/models/url_model.pkl',
  'guardian_ai_engine/models/sms_model.pkl'
];

let allFilesExist = true;
for (const file of aiEngineFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - NOT FOUND`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.log('\n  ⚠️  Some model files are missing. Train models with:');
  console.log('     cd guardian_ai_engine');
  console.log('     python train_all_models.py');
}

// Check 3: Frontend integration files
console.log('\n✓ Checking frontend integration...');
const frontendFiles = [
  'lib/aiEngineClient.ts',
  'lib/loginThreatMonitor.ts',
  'lib/guardianAuth.ts',
  'app/login/page.tsx'
];

for (const file of frontendFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - NOT FOUND`);
  }
}

// Check 4: AI Engine connectivity
console.log('\n✓ Checking AI Engine connectivity...');
fetch('http://localhost:8000/health')
  .then(response => response.json())
  .then(data => {
    console.log('  ✅ AI Engine is running!');
    console.log(`  ✅ Status: ${data.status}`);
    console.log(`  ✅ Models loaded:`, data.models_loaded);
    
    // Run a quick test
    console.log('\n✓ Running quick threat detection test...');
    return fetch('http://localhost:8000/predict/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        failed_attempts: 5,
        country_changed: false,
        role_access_attempt: 0,
        login_gap_minutes: 2
      })
    });
  })
  .then(response => response.json())
  .then(result => {
    console.log('  ✅ Threat detection working!');
    console.log(`  ✅ Risk Score: ${result.risk_score}%`);
    console.log(`  ✅ Classification: ${result.classification}`);
    
    console.log('\n========================================');
    console.log('✅ ALL SYSTEMS OPERATIONAL');
    console.log('========================================');
    console.log('\nYou can now test threat detection:');
    console.log('1. Start Next.js: npm run dev');
    console.log('2. Go to http://localhost:3000/login');
    console.log('3. Try 5-6 failed login attempts');
    console.log('4. Check /dashboard/threats for results');
  })
  .catch(error => {
    console.log('  ❌ AI Engine is NOT running');
    console.log(`  Error: ${error.message}`);
    
    console.log('\n========================================');
    console.log('⚠️  ACTION REQUIRED');
    console.log('========================================');
    console.log('\nTo start the AI Engine:');
    console.log('1. Open a new terminal');
    console.log('2. cd guardian_ai_engine');
    console.log('3. python main.py');
    console.log('4. Run this diagnostic again');
    
    console.log('\nIf you get "No module" errors:');
    console.log('  pip install -r requirements.txt');
    
    console.log('\nIf models are missing:');
    console.log('  python train_all_models.py');
  });
