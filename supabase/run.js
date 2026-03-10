import fs from 'fs';

const SUPABASE_URL = 'https://lhxxcgjihrckiufrfwgf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoeHhjZ2ppaHJja2l1ZnJmd2dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE0NjQ3MSwiZXhwIjoyMDg4NzIyNDcxfQ.nKFEPwLcKcEHMjFyzWH5V8r7qw0Bn4QFhpSnsse1Mus';

async function run() {
  try {
    const sql = fs.readFileSync('schema.sql', 'utf8');
    
    // Tentativa usar RPC genérica ou a API para inicializar estruturas caso o projeto esteja vazio.
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });
    
    console.log(res.status);
    console.log(await res.text());
  } catch(e) {
    console.error(e);
  }
}
run();
