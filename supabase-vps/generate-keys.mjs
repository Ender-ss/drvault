import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${signature}`;
}

const jwtSecret = crypto.randomBytes(32).toString('hex');
const postgresPassword = crypto.randomBytes(16).toString('hex');

const now = Math.floor(Date.now() / 1000);
const exp = now + 10 * 365 * 24 * 60 * 60; // 10 years

const anonKey = signJwt({ role: 'anon', iss: 'supabase', iat: now, exp }, jwtSecret);
const serviceRoleKey = signJwt({ role: 'service_role', iss: 'supabase', iat: now, exp }, jwtSecret);

const envContent = `############
# SECRETS
############
POSTGRES_PASSWORD=${postgresPassword}
JWT_SECRET=${jwtSecret}
ANON_KEY=${anonKey}
SERVICE_ROLE_KEY=${serviceRoleKey}

############
# DATABASE
############
POSTGRES_DB=postgres
POSTGRES_PORT=54322

############
# API & PORTS
############
API_EXTERNAL_URL=http://localhost:8443
SITE_URL=http://localhost:3000
ADDITIONAL_REDIRECT_URLS=http://localhost:3000/*

STUDIO_PORT=8085
KONG_HTTP_PORT=8443

############
# AUTH / EMAIL
############
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true
`;

const envPath = path.join(__dirname, '.env');
fs.writeFileSync(envPath, envContent);

// Also replace in kong.yml
const kongPath = path.join(__dirname, 'volumes', 'api', 'kong.yml');
if (fs.existsSync(kongPath)) {
  let kongContent = fs.readFileSync(kongPath, 'utf8');
  kongContent = kongContent.replace(/\$\{ANON_KEY\}|[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/g, (match) => {
    return match === '${SERVICE_ROLE_KEY}' ? serviceRoleKey : match;
  });
  // Simple replacement
  kongContent = kongContent.replace(/\$\{ANON_KEY\}/g, anonKey);
  kongContent = kongContent.replace(/\$\{SERVICE_ROLE_KEY\}/g, serviceRoleKey);
  fs.writeFileSync(kongPath, kongContent);
}

console.log('==============================================================');
console.log('✅ Chaves do Supabase geradas com sucesso em supabase-vps/.env');
console.log('==============================================================');
console.log(`ANON_KEY: ${anonKey}`);
console.log(`SERVICE_ROLE_KEY: ${serviceRoleKey}`);
console.log(`POSTGRES_PASSWORD: ${postgresPassword}`);
console.log('==============================================================');
