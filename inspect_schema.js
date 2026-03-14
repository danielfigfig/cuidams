import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function runCheck() {
  console.log('Running constraint check...');
  
  // First, create the RPC
  const sql = fs.readFileSync('supabase/check_constraints.sql', 'utf8');
  
  // Note: We can't run arbitrary SQL via the client easily unless we have an 'exec_sql' RPC.
  // Many Supabase setups don't have one. 
  // But we can try to call the RPC if it was already created by the user, 
  // OR we can hope the user runs it.
  
  // Since I don't have an exec_sql rpc, I'll ask the user to run it OR 
  // I will check if I can find another way.
  
  // Actually, I'll just check if logs_aceite_termos has the issue by trying to insert a NULL value (in a transaction that I'll rollback if possible, but PostgREST doesn't support that).
  
  // NEW STRATEGY: Use the service role to attempt a dummy update to NULL on a row and see if it fails.
  // This is a safe way to check constraint without metadata access.
  
  const tables = ['questionarios_cuida_sm', 'logs_aceite_termos'];
  
  for (const table of tables) {
    console.log(`Testing nullability for ${table}.usuario_id...`);
    // Try to update a non-existent row to NULL. 
    // If it's NOT NULL, the database should check the constraint even if 0 rows are updated? 
    // No, Postgres only checks constraints on actual data changes.
    
    // So let's try to fetch a row, try an update (then change it back). 
    // This is slightly risky but with service_role it's possible.
    
    const { data: firstRow } = await supabase.from(table).select('*').limit(1).single();
    if (!firstRow) {
      console.log(`No data in ${table} to test.`);
      continue;
    }
    
    const originalValue = firstRow.usuario_id;
    console.log(`Original value: ${originalValue}`);
    
    const { error: updateError } = await supabase
      .from(table)
      .update({ usuario_id: null })
      .eq('id', firstRow.id);
      
    if (updateError) {
      if (updateError.message.includes('violates not-null constraint')) {
        console.log(`RESULT: ${table}.usuario_id is NOT NULL (CRITICAL)`);
      } else {
        console.log(`RESULT: Update failed for other reason: ${updateError.message}`);
      }
    } else {
      console.log(`RESULT: ${table}.usuario_id accepts NULL (OK)`);
      // Revert change
      await supabase.from(table).update({ usuario_id: originalValue }).eq('id', firstRow.id);
    }
  }
}

runCheck();
