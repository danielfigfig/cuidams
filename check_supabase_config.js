import fs from 'node:fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const projectRef = 'lhxxcgjihrckiufrfwgf';
const accessToken = env['SUPABASE_ACCESS_TOKEN'];

async function checkConfig() {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await response.json();
  console.log('--- VERIFICATION ---');
  console.log('SITE_URL:', data.site_url);
  console.log('URI_ALLOW_LIST:', JSON.stringify(data.uri_allow_list));
  console.log('--- END ---');
}

checkConfig();
