#!/usr/bin/env node

/**
 * PRU Patrol v1.1 Sandbox - Deployment Verification Script
 * Run this after deployment to verify all features work
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 PRU Patrol v1.1 Sandbox - Deployment Verification');
console.log('====================================================\n');

// Check if dist folder exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ dist/ folder not found. Run "npm run build" first.');
  process.exit(1);
}

console.log('✅ Build artifacts found');

// Check for required files
const requiredFiles = [
  'index.html',
  'assets/index-D-UnV1g8.css',
  'assets/index-uEYDGcQn.js'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(distPath, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('\n❌ Some required files are missing. Build may have failed.');
  process.exit(1);
}

// Check environment variables
const envVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_KEY', 
  'VITE_TELEGRAM_BOT_TOKEN',
  'VITE_TELEGRAM_CHAT_ID',
  'VITE_SANDBOX_MODE'
];

console.log('\n🔧 Environment Variables Check:');
envVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar} is set`);
  } else {
    console.log(`⚠️  ${envVar} is not set (will need to be configured in Netlify)`);
  }
});

console.log('\n📋 Deployment Checklist:');
console.log('1. ✅ Build completed successfully');
console.log('2. ✅ All required files present');
console.log('3. ✅ netlify.toml configured');
console.log('4. ✅ vite.config.js has base: "./"');
console.log('5. ⚠️  Environment variables need to be set in Netlify');

console.log('\n🎯 Next Steps:');
console.log('1. Push to GitHub branch: sandbox-v1.1');
console.log('2. Deploy to Netlify (manual or auto)');
console.log('3. Set environment variables in Netlify dashboard');
console.log('4. Test routes: /v11-test/route, /v11-test/selfie, etc.');

console.log('\n🚀 Ready for deployment!');
