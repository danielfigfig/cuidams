import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function inspectForeignKeys() {
  console.log('--- Inspecting Foreign Keys for logs_aceite_termos ---');
  
  // Try to query foreign keys from information_schema
  const { data, error } = await supabase
    .from('referential_constraints')
    .select('constraint_name, delete_rule');
    // Note: information_schema might not be exposed.
    
  if (error) {
    console.log('Could not access referential_constraints. Trying to find FKs via RPC if possible, or just checking if delete works.');
    console.log('Error:', error.message);
  } else {
    console.log('Foreign keys rules:', data);
  }
  
  // Alternative: Try to just get columns again but better
  const { data: cols, error: colError } = await supabase.from('logs_aceite_termos').select('*').limit(1);
  if (!colError && cols.length > 0) {
    console.log('Table logs_aceite_termos exists. Columns:', Object.keys(cols[0]));
  }
}

inspectForeignKeys();
