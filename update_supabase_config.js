import fs from 'node:fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const projectRef = 'lhxxcgjihrckiufrfwgf';
const accessToken = env['SUPABASE_ACCESS_TOKEN'];

async function updateConfig() {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
  
  const body = {
    site_url: 'http://localhost:5173',
    uri_allow_list: 'http://localhost:5173/**'
  };

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  console.log('Update Result:', JSON.stringify(data, null, 2));
}

updateConfig();
