import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function debugData() {
  console.log('--- Debugging Data Consistency ---');
  
  // 1. Check if logs_aceite_termos exists and its schema
  console.log('\nChecking logs_aceite_termos schema via dummy query...');
  try {
    const { data: cols, error: colError } = await supabase
      .from('columns')
      .select('column_name, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'logs_aceite_termos');
      
    if (colError) {
      console.log('Could not access information_schema directly. Trying to fetch one row.');
      const { data, error } = await supabase.from('logs_aceite_termos').select('*').limit(1);
      if (error) {
        console.error('Error accessing logs_aceite_termos:', error.message);
      } else {
        console.log('logs_aceite_termos is accessible.');
        if (data.length > 0) console.log('Sample row columns:', Object.keys(data[0]));
      }
    } else {
      console.log('logs_aceite_termos columns:', cols);
    }
  } catch (e) {
    console.error('Unexpected error:', e);
  }

  // 2. Look for any users in perfis_usuarios that might be orphaned or still exist
  console.log('\nChecking for users in perfis_usuarios...');
  const { data: users, error: userError } = await supabase
    .from('perfis_usuarios')
    .select('id, email, cpf, nome_completo');
    
  if (userError) {
    console.error('Error fetching perfis_usuarios:', userError.message);
  } else {
    console.log(`Found ${users.length} users in perfis_usuarios.`);
    users.forEach(u => console.log(`- ${u.nome_completo} (${u.email}) [${u.cpf}]`));
  }
}

debugData();
