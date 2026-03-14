import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function checkUser() {
  const email = 'daniellefigfig@gmail.com';
  const userId = 'ce464f1e-d963-492a-a852-5231b0ae68e0';
  
  console.log(`Checking user ${email} (${userId})...`);
  
  // Check auth.users (requires service_role)
  // Note: select from auth schema is limited even with service_role via postgrest sometimes.
  // But let's try.
  
  const { data: profile, error: profError } = await supabase
    .from('perfis_usuarios')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (profError) {
    console.log('Profile NOT found in perfis_usuarios:', profError.message);
  } else {
    console.log('Profile FOUND in perfis_usuarios:', profile);
  }
}

checkUser();
