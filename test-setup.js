import 'dotenv/config';
import { supabase } from './services/supabase.js';

console.log('🧪 Testing WhatsApp Worker Setup\n');

// Test 1: Environment variables
console.log('1️⃣ Checking environment variables...');
const requiredVars = [
  'EVOLUTION_API_URL',
  'EVOLUTION_API_KEY',
  'EVOLUTION_INSTANCE',
  'DEEPSEEK_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY'
];

let missingVars = [];
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
}

if (missingVars.length > 0) {
  console.log('❌ Missing variables:', missingVars.join(', '));
} else {
  console.log('✅ All environment variables set\n');
}

// Test 2: Supabase connection
console.log('2️⃣ Testing Supabase connection...');
try {
  const { data, error } = await supabase
    .from('appointments')
    .select('id')
    .limit(1);
  
  if (error) throw error;
  console.log('✅ Supabase connected successfully\n');
} catch (error) {
  console.log('❌ Supabase error:', error.message, '\n');
}

// Test 3: Check if whatsapp_notifications table exists
console.log('3️⃣ Checking whatsapp_notifications table...');
try {
  const { data, error } = await supabase
    .from('whatsapp_notifications')
    .select('id')
    .limit(1);
  
  if (error && error.code === '42P01') {
    console.log('❌ Table does not exist. Run CREATE_WHATSAPP_NOTIFICATIONS_TABLE.sql\n');
  } else if (error) {
    throw error;
  } else {
    console.log('✅ Table exists\n');
  }
} catch (error) {
  console.log('❌ Error:', error.message, '\n');
}

console.log('✅ Setup test complete!');
process.exit(0);
