import dotenv from 'dotenv';
import { existsSync } from 'fs';

// Load environment variables
dotenv.config();

console.log('🔑 API Key Configuration Check\n');

// Check if .env file exists
if (!existsSync('.env')) {
  console.error('❌ No .env file found!');
  console.log('📋 Create a .env file with your API keys.');
  process.exit(1);
}

// Check Anthropic API key
const anthropicKey = process.env.ANTHROPIC_API_KEY;
if (!anthropicKey) {
  console.log('⚪ ANTHROPIC_API_KEY: Not set');
} else if (anthropicKey.includes('placeholder')) {
  console.log('❌ ANTHROPIC_API_KEY: Contains placeholder value (invalid)');
} else if (!anthropicKey.startsWith('sk-ant-')) {
  console.log('❌ ANTHROPIC_API_KEY: Invalid format (should start with sk-ant-)');
} else {
  console.log('✅ ANTHROPIC_API_KEY: Configured (format looks valid)');
}

// Check OpenAI API key
const openaiKey = process.env.OPENAI_API_KEY;
if (!openaiKey) {
  console.log('⚪ OPENAI_API_KEY: Not set');
} else if (openaiKey.includes('placeholder')) {
  console.log('❌ OPENAI_API_KEY: Contains placeholder value (invalid)');
} else if (!openaiKey.startsWith('sk-')) {
  console.log('❌ OPENAI_API_KEY: Invalid format (should start with sk-)');
} else {
  console.log('✅ OPENAI_API_KEY: Configured (format looks valid)');
}

// Check Google Gemini API key
const googleKey = process.env.GOOGLE_GEMINI_API_KEY;
if (!googleKey) {
  console.log('⚪ GOOGLE_GEMINI_API_KEY: Not set');
} else if (googleKey.includes('placeholder')) {
  console.log('❌ GOOGLE_GEMINI_API_KEY: Contains placeholder value (invalid)');
} else if (googleKey.length < 10) {
  console.log('❌ GOOGLE_GEMINI_API_KEY: Invalid format (too short)');
} else {
  console.log('✅ GOOGLE_GEMINI_API_KEY: Configured (format looks valid)');
}

// Check if at least one valid key is configured
const hasValidAnthropicKey = anthropicKey && anthropicKey.startsWith('sk-ant-') && !anthropicKey.includes('placeholder');
const hasValidOpenaiKey = openaiKey && openaiKey.startsWith('sk-') && !openaiKey.includes('placeholder');
const hasValidGoogleKey = googleKey && googleKey.length > 10 && !googleKey.includes('placeholder');

console.log('\n📊 Summary:');
if (hasValidAnthropicKey || hasValidOpenaiKey || hasValidGoogleKey) {
  const validCount = [hasValidAnthropicKey, hasValidOpenaiKey, hasValidGoogleKey].filter(Boolean).length;
  console.log(`✅ ${validCount} valid API key(s) configured`);
  console.log('🚀 PDF extraction should work with AI assistance');
  console.log('📋 Extraction order: Claude → OpenAI → Google Gemini → OCR fallback');
} else {
  console.log('❌ No AI API keys configured');
  console.log('🔍 System will use OCR-only extraction (basic pattern matching)');
  console.log('\n📋 To enable AI extraction:');
  console.log('1. Get an API key from:');
  console.log('   - Anthropic (recommended): https://console.anthropic.com/');
  console.log('   - OpenAI: https://platform.openai.com/api-keys');
  console.log('   - Google Gemini: https://makersuite.google.com/app/apikey');
  console.log('2. Add it to your .env file:');
  console.log('   ANTHROPIC_API_KEY=sk-ant-your-key-here');
  console.log('   OR');
  console.log('   OPENAI_API_KEY=sk-your-key-here');
  console.log('   OR');
  console.log('   GOOGLE_GEMINI_API_KEY=your-google-key-here');
  console.log('3. Restart the server');
}

console.log('\n🔍 Note: OCR fallback is always available for image-based PDFs');