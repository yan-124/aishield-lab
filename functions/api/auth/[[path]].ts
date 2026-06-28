// Auth API for AIShield Lab
// Cloudflare Pages Function - backed by AUTH_KV
// Supports: register, login, me (verify token)

interface Env {
  AUTH_KV: KVNamespace;
  JWT_SECRET?: string;
  ADMIN_SECRET?: string;
  ADMIN_EMAILS?: string; // comma-separated list of admin emails
}

function isAdminEmail(email: string, adminEmails: string): boolean {
  if (!adminEmails || !email) return false;
  return adminEmails.split(',').map(e => e.trim().toLowerCase()).includes(email.toLowerCase());
}

// Web Crypto API password hashing with PBKDF2 (100k iterations)
// Backward compatible: old SHA-256 hashes are auto-upgraded on next login
const PBKDF2_ITERATIONS = 100000;

async function generateSalt(): Promise<string> {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// New PBKDF2 hashing — produces format: pbkdf2$iterations$salt$hash
async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const actualSalt = salt || (await generateSalt());
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(actualSalt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return { hash: `pbkdf2$${PBKDF2_ITERATIONS}$${actualSalt}$${hashHex}`, salt: actualSalt };
}

// Verify password — supports both old SHA-256 (plain hex) and new PBKDF2 ($-prefixed) formats
async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const encoder = new TextEncoder();

  if (storedHash.startsWith('pbkdf2$')) {
    // New PBKDF2 format
    const parts = storedHash.split('$');
    const iterations = parseInt(parts[1], 10);
    const expectedHash = parts[3];
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const hashBuffer = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: encoder.encode(salt), iterations, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    const computedHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    return computedHash === expectedHash;
  }

  // Legacy SHA-256 format (plain hex, 64 chars) — backward compatibility
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const computedHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return computedHash === storedHash;
}

// Check if stored hash needs upgrade from SHA-256 to PBKDF2
function needsHashUpgrade(storedHash: string): boolean {
  return !storedHash.startsWith('pbkdf2$');
}

// Simple JWT-like token (HMAC-SHA256)
async function createToken(payload: object, secret: string): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadStr = btoa(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(header + '.' + payloadStr));
  const sigStr = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return header + '.' + payloadStr + '.' + sigStr;
}

async function verifyToken(token: string, secret: string): Promise<any | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const sigBytes = new Uint8Array(sig.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(header + '.' + payload));
  if (!valid) return null;
  try {
    const decoded = JSON.parse(atob(payload));
    // 7 day expiry
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch { return null; }
}

function sanitize(str: string, maxLen: number): string {
  return str.replace(/[<>"'&]/g, '').slice(0, maxLen);
}


// Simple TOTP implementation (RFC 6238)
function base32Encode(buffer: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
  let result = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    result += alphabet[parseInt(chunk, 2)];
  }
  return result;
}

function generateTotpSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

async function generateTotpCode(secret: string, timeOffset: number = 0): Promise<string> {
  // Decode base32 secret
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of secret) {
    const idx = alphabet.indexOf(c.toUpperCase());
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }

  // Get time counter (30-second window)
  const counter = Math.floor((Date.now() + timeOffset) / 30000);
  const counterBuf = new ArrayBuffer(8);
  const view = new DataView(counterBuf);
  view.setBigUint64(0, BigInt(counter));

  // HMAC-SHA1
  const key = await crypto.subtle.importKey('raw', bytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', key, counterBuf));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24 | (hmac[offset + 1] & 0xff) << 16 | (hmac[offset + 2] & 0xff) << 8 | (hmac[offset + 3] & 0xff)) % 1000000;
  return code.toString().padStart(6, '0');
}

async function verifyTotpCode(secret: string, code: string): Promise<boolean> {
  // Check current, -1 window, +1 window
  for (const offset of [-30000, 0, 30000]) {
    const expected = await generateTotpCode(secret, offset);
    if (expected === code) return true;
  }
  return false;
}

// Rate limiting by IP — KV-backed for cross-isolate consistency, in-memory fallback
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string, maxRPM: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  entry.count++;
  return entry.count <= maxRPM;
}

// KV-backed rate limiting — works across all isolates (unlike in-memory Map)
async function checkKVRateLimit(kv: KVNamespace, ip: string, maxRPM: number): Promise<boolean> {
  const key = `rl:${ip}`;
  const now = Date.now();
  try {
    const data = await kv.get(key);
    if (data) {
      const entry = JSON.parse(data);
      if (now < entry.resetAt) {
        if (entry.count >= maxRPM) return false;
        entry.count++;
        await kv.put(key, JSON.stringify(entry), { expirationTtl: 60 });
        return true;
      }
    }
    await kv.put(key, JSON.stringify({ count: 1, resetAt: now + 60000 }), { expirationTtl: 60 });
    return true;
  } catch {
    // Fallback to in-memory if KV operation fails
    return checkRateLimit(ip, maxRPM);
  }
}


// ===== Minimal CBOR decoder for WebAuthn =====
function cborDecode(data: Uint8Array): any {
  let offset = 0;
  function read(): any {
    if (offset >= data.length) throw new Error('CBOR: unexpected end');
    const ib = data[offset++];
    const majorType = ib >> 5;
    const additionalInfo = ib & 0x1f;
    let value: number;
    if (additionalInfo < 24) {
      value = additionalInfo;
    } else if (additionalInfo === 24) {
      value = data[offset++];
    } else if (additionalInfo === 25) {
      value = (data[offset] << 8) | data[offset + 1];
      offset += 2;
    } else if (additionalInfo === 26) {
      value = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
      offset += 4;
    } else {
      throw new Error('CBOR: unsupported additional info ' + additionalInfo);
    }
    switch (majorType) {
      case 0: return value; // unsigned int
      case 1: return -1 - value; // negative int
      case 2: { // byte string
        const buf = data.slice(offset, offset + value);
        offset += value;
        return buf;
      }
      case 3: { // text string
        const str = new TextDecoder().decode(data.slice(offset, offset + value));
        offset += value;
        return str;
      }
      case 4: { // array
        const arr: any[] = [];
        for (let i = 0; i < value; i++) arr.push(read());
        return arr;
      }
      case 5: { // map
        const map: Record<string, any> = {};
        for (let i = 0; i < value; i++) {
          const k = read();
          map[typeof k === 'string' ? k : String(k)] = read();
        }
        return map;
      }
      default: throw new Error('CBOR: unsupported major type ' + majorType);
    }
  }
  return read();
}

function base64urlToBuffer(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
  const binary = atob(padded);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf;
}

function bufferToBase64url(buf: Uint8Array | ArrayBuffer): string {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generateChallenge(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bufferToBase64url(bytes);
}

function getRpId(request?: Request): string {
  const origin = request?.headers?.get('Origin') || '';
  if (origin.includes('aiseclearn.com')) return 'aiseclearn.com';
  return 'aishield-lab.pages.dev';
}

function verifyAuthenticatorData(authData: Uint8Array, challenge: string, rpId: string): { credentialId: Uint8Array; publicKey: any; signCount: number } | null {
  // authData format: rpIdHash(32) + flags(1) + signCount(4) + attestedCredData(variable) + extensions(variable)
  if (authData.length < 37) return null;
  const rpIdHash = authData.slice(0, 32);
  const flags = authData[32];
  const signCount = (authData[33] << 24) | (authData[34] << 16) | (authData[35] << 8) | authData[36];
  const attestedCredData = (flags & 0x40) !== 0; // AT flag
  if (!attestedCredData) return null;
  let offset = 37;
  const aaguid = authData.slice(offset, offset + 16);
  offset += 16;
  const credIdLen = (authData[offset] << 8) | authData[offset + 1];
  offset += 2;
  const credentialId = authData.slice(offset, offset + credIdLen);
  offset += credIdLen;
  const pubKeyCbor = authData.slice(offset);
  try {
    const publicKey = cborDecode(pubKeyCbor);
    return { credentialId, publicKey, signCount };
  } catch {
    return null;
  }
}

async function verifyWebAuthnSignature(publicKey: any, signature: Uint8Array, data: Uint8Array): Promise<boolean> {
  // publicKey is a COSE key map (CBOR decoded)
  // For ES256 (alg -7): x, y coordinates on P-256 curve
  // For RS256 (alg -257): n, e
  try {
    const kty = publicKey[1]; // 2 = EC, 3 = RSA
    if (kty === 2) {
      // EC2 / P-256 / ES256
      const x = publicKey[-2] as Uint8Array;
      const y = publicKey[-3] as Uint8Array;
      if (!x || !y || x.length !== 32 || y.length !== 32) return false;
      // Import as EC P-256 public key
      const keyData = new Uint8Array(1 + 32 + 32); // uncompressed point: 0x04 + x + y
      keyData[0] = 0x04;
      keyData.set(x, 1);
      keyData.set(y, 33);
      const key = await crypto.subtle.importKey('raw', keyData, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, signature, data);
    } else if (kty === 3) {
      // RSA / RS256
      const n = publicKey[-1] as Uint8Array;
      const e = publicKey[-2] as Uint8Array;
      if (!n || !e) return false;
      // Build DER-encoded RSA public key
      const nBig = BigInt('0x' + Array.from(n).map(b => b.toString(16).padStart(2, '0')).join(''));
      const eBig = BigInt('0x' + Array.from(e).map(b => b.toString(16).padStart(2, '0')).join(''));
      // JWK format
      const jwk = {
        kty: 'RSA',
        n: bufferToBase64url(n),
        e: bufferToBase64url(e),
      };
      const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
      return crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, key, signature, data);
    }
    return false;
  } catch {
    return false;
  }
}


// Daily challenge questions (must match frontend DailyChallenge.tsx)
const DAILY_QUESTIONS = [
  { id: 1, answer: 1 },
  { id: 2, answer: 1 },
  { id: 3, answer: 2 },
  { id: 4, answer: 1 },
  { id: 5, answer: 1 },
  { id: 6, answer: 3 },
  { id: 7, answer: 1 },
  { id: 8, answer: 1 },
];

function getTodaysQuestionId(): number {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return DAILY_QUESTIONS[dayOfYear % DAILY_QUESTIONS.length].id;
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/auth/', '');
  const method = request.method;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  const ALLOWED_ORIGINS = [
    'https://aiseclearn.com',
    'https://www.aiseclearn.com',
    'https://aishield-lab.pages.dev',
    'http://localhost:5201',
    'http://127.0.0.1:5201',
  ];

  function isAllowedOrigin(origin: string): boolean {
    if (ALLOWED_ORIGINS.includes(origin)) return true;
    if (origin.match(/^https:\/\/[a-z0-9-]+\.aishield-lab\.pages\.dev$/)) return true;
    return false;
  }

  const origin = request.headers.get('Origin') || '';
  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : '',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  function jsonResponse(data: any, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
    });
  }

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!env.AUTH_KV) {
    return jsonResponse({ error: 'Auth service unavailable' }, 503);
  }

  if (!env.JWT_SECRET) {
    console.error('JWT_SECRET not configured'); // 只记录在服务端
    return jsonResponse({ error: '服务暂不可用' }, 503);
  }
  const JWT_SECRET = env.JWT_SECRET;

  try {
    // POST /api/auth/register
    if (method === 'POST' && path === 'register') {
      if (!(await checkKVRateLimit(env.AUTH_KV, ip, 3))) {
        return new Response(JSON.stringify({ error: 'Too many requests' }), {
          status: 429, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const body = await request.json() as { email?: string; password?: string; nickname?: string };
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';
      const nickname = sanitize(body.nickname || email.split('@')[0], 20);

      // Validate
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return new Response(JSON.stringify({ error: 'Invalid email' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      if (password.length < 8) {
        return new Response(JSON.stringify({ error: '密码长度至少8位' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      if (!/[A-Z]/.test(password)) {
        return new Response(JSON.stringify({ error: '密码必须包含大写字母' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      if (!/[a-z]/.test(password)) {
        return new Response(JSON.stringify({ error: '密码必须包含小写字母' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      if (!/[0-9]/.test(password)) {
        return new Response(JSON.stringify({ error: '密码必须包含数字' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      if (!/[!@#$%^&*()_+\-=\[\]{}|;':",.<>/?~`]/.test(password)) {
        return new Response(JSON.stringify({ error: '密码必须包含特殊字符' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      // Check existing user
      const existing = await env.AUTH_KV.get('user:' + email);
      if (existing) {
        return new Response(JSON.stringify({ error: 'Email already registered' }), {
          status: 409, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      // Create user with salted password
      const { hash: hashedPw, salt } = await hashPassword(password);
      const userId = 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const user = {
        id: userId,
        email,
        nickname,
        hashedPw,
        salt,
        createdAt: new Date().toISOString(),
        identity: '',
        goals: [] as string[],
      };

      await env.AUTH_KV.put('user:' + email, JSON.stringify(user), { expirationTtl: 86400 * 365 });
      await env.AUTH_KV.put('uid:' + userId, email, { expirationTtl: 86400 * 365 });

      // Create token (7 day expiry)
      const token = await createToken({ userId, email, isAdmin: isAdminEmail(email, env.ADMIN_EMAILS || ''), exp: Math.floor(Date.now() / 1000) + 86400 * 7 }, JWT_SECRET);

      return new Response(JSON.stringify({
        token,
        user: { id: userId, email, nickname, isAdmin: isAdminEmail(email, env.ADMIN_EMAILS || ''), isLoggedIn: true }
      }), {
        status: 201, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
      });
    }

    // POST /api/auth/login
    if (method === 'POST' && path === 'login') {
      if (!(await checkKVRateLimit(env.AUTH_KV, ip, 5))) {
        return new Response(JSON.stringify({ error: 'Too many requests' }), {
          status: 429, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const body = await request.json() as { email?: string; password?: string };
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';

      const userData = await env.AUTH_KV.get('user:' + email);
      if (!userData) {
        return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const user = JSON.parse(userData);
      
      const lockoutKey = 'lockout:' + email;
      const lockoutData = await env.AUTH_KV.get(lockoutKey);
      if (lockoutData) {
        const lockout = JSON.parse(lockoutData);
        if (lockout.unlockAt > Date.now()) {
          const remaining = Math.ceil((lockout.unlockAt - Date.now()) / 60000);
          return new Response(JSON.stringify({ error: `账户已锁定，请${remaining}分钟后再试` }), {
            status: 423, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
          });
        }
      }

      const passwordValid = await verifyPassword(password, user.hashedPw, user.salt || '');
      if (!passwordValid) {
        const failedKey = 'failed:' + email;
        const failedData = await env.AUTH_KV.get(failedKey);
        const failedCount = failedData ? JSON.parse(failedData).count : 0;
        const newCount = failedCount + 1;
        
        if (newCount >= 5) {
          await env.AUTH_KV.put(lockoutKey, JSON.stringify({ unlockAt: Date.now() + 15 * 60 * 1000 }), { expirationTtl: 15 * 60 });
          await env.AUTH_KV.delete(failedKey);
          return new Response(JSON.stringify({ error: '登录失败次数过多，账户已锁定15分钟' }), {
            status: 423, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
          });
        }
        
        await env.AUTH_KV.put(failedKey, JSON.stringify({ count: newCount }), { expirationTtl: 15 * 60 });
        return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      
      await env.AUTH_KV.delete('failed:' + email);
      await env.AUTH_KV.delete('lockout:' + email);

      // Auto-upgrade legacy SHA-256 hash to PBKDF2 on successful login
      if (needsHashUpgrade(user.hashedPw)) {
        const { hash: newHash, salt: newSalt } = await hashPassword(password);
        user.hashedPw = newHash;
        user.salt = newSalt;
        await env.AUTH_KV.put('user:' + email, JSON.stringify(user), { expirationTtl: 86400 * 365 });
      }

      // Check if MFA enabled — if so, don't issue token yet
      if (user.mfaEnabled) {
        return new Response(JSON.stringify({
          mfaRequired: true,
          email,
        }), {
          status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      // Create token
      const token = await createToken({ userId: user.id, email, isAdmin: isAdminEmail(email, env.ADMIN_EMAILS || ''), exp: Math.floor(Date.now() / 1000) + 86400 * 7 }, JWT_SECRET);

      return new Response(JSON.stringify({
        token,
        user: { id: user.id, email, nickname: user.nickname, identity: user.identity, goals: user.goals, mfaEnabled: false, isAdmin: isAdminEmail(email, env.ADMIN_EMAILS || ''), isLoggedIn: true }
      }), {
        status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
      });
    }

    // GET /api/auth/me - verify token and return user info
    if (method === 'GET' && path === 'me') {
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace('Bearer ', '') || url.searchParams.get('token') || '';
      
      if (!token) {
        return new Response(JSON.stringify({ error: 'No token provided' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const decoded = await verifyToken(token, JWT_SECRET);
      if (!decoded) {
        return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const userData = await env.AUTH_KV.get('user:' + decoded.email);
      if (!userData) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const user = JSON.parse(userData);
      const isAdmin = decoded.isAdmin === true || isAdminEmail(user.email, env.ADMIN_EMAILS || '');
      return new Response(JSON.stringify({
        user: { id: user.id, email: user.email, nickname: user.nickname, identity: user.identity, goals: user.goals, mfaEnabled: !!user.mfaEnabled, isAdmin, isLoggedIn: true }
      }), {
        status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
      });
    }

    // POST /api/auth/profile - update user profile (identity, goals, nickname)
    if (method === 'POST' && path === 'profile') {
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace('Bearer ', '');
      
      const decoded = await verifyToken(token, JWT_SECRET);
      if (!decoded) {
        return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const body = await request.json() as { nickname?: string; identity?: string; goals?: string[] };
      const userData = await env.AUTH_KV.get('user:' + decoded.email);
      if (!userData) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const user = JSON.parse(userData);
      if (body.nickname) user.nickname = sanitize(body.nickname, 20);

      // Validate identity — only allow specific values
      const ALLOWED_IDENTITIES = new Set(['student', 'professional', 'career_change']);
      if (body.identity) {
        if (!ALLOWED_IDENTITIES.has(body.identity)) {
          return new Response(JSON.stringify({ error: 'Invalid identity value' }), {
            status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
          });
        }
        user.identity = body.identity;
      }

      // Validate goals — array with allowed values
      const ALLOWED_GOALS = new Set(['Prompt注入', '对抗攻击', '模型安全', '数据隐私', '合规治理', '红队测试', '安全审计', '威胁检测']);
      if (body.goals) {
        if (!Array.isArray(body.goals) || body.goals.length > 10) {
          return new Response(JSON.stringify({ error: 'Invalid goals' }), {
            status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
          });
        }
        for (const goal of body.goals) {
          if (!ALLOWED_GOALS.has(goal)) {
            return new Response(JSON.stringify({ error: 'Invalid goal: ' + goal }), {
              status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
            });
          }
        }
        user.goals = body.goals;
      }

      await env.AUTH_KV.put('user:' + decoded.email, JSON.stringify(user), { expirationTtl: 86400 * 365 });

      return new Response(JSON.stringify({
        user: { id: user.id, email: user.email, nickname: user.nickname, identity: user.identity, goals: user.goals, isLoggedIn: true }
      }), {
        status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
      });
    }


    // POST /api/auth/mfa/setup - generate TOTP secret
    if (method === 'POST' && path === 'mfa/setup') {
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace('Bearer ', '');
      const decoded = await verifyToken(token, JWT_SECRET);
      if (!decoded) {
        return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const userData = await env.AUTH_KV.get('user:' + decoded.email);
      if (!userData) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const user = JSON.parse(userData);
      if (user.mfaEnabled) {
        return new Response(JSON.stringify({ error: 'MFA already enabled' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const secret = generateTotpSecret();
      const otpauthUrl = `otpauth://totp/AIShieldLab:${encodeURIComponent(user.email)}?secret=${secret}&issuer=AIShieldLab&algorithm=SHA1&digits=6&period=30`;

      // Store pending MFA secret temporarily
      await env.AUTH_KV.put('mfa_pending:' + user.id, JSON.stringify({ secret, createdAt: Date.now() }), { expirationTtl: 600 });

      return new Response(JSON.stringify({
        secret,
        otpauthUrl,
        qrData: otpauthUrl,
      }), {
        status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
      });
    }

    // POST /api/auth/mfa/verify - verify TOTP code and enable MFA
    if (method === 'POST' && path === 'mfa/verify') {
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace('Bearer ', '');
      const decoded = await verifyToken(token, JWT_SECRET);
      if (!decoded) {
        return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const body = await request.json() as { code?: string };
      const code = (body.code || '').trim();

      if (!code || code.length !== 6) {
        return new Response(JSON.stringify({ error: 'Invalid code format' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const userData = await env.AUTH_KV.get('user:' + decoded.email);
      if (!userData) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const user = JSON.parse(userData);
      const pendingData = await env.AUTH_KV.get('mfa_pending:' + user.id);
      if (!pendingData) {
        return new Response(JSON.stringify({ error: 'No pending MFA setup. Call /mfa/setup first.' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const { secret } = JSON.parse(pendingData);
      const valid = await verifyTotpCode(secret, code);
      if (!valid) {
        return new Response(JSON.stringify({ error: 'Invalid verification code' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      // Enable MFA
      user.mfaEnabled = true;
      user.mfaSecret = secret;
      await env.AUTH_KV.put('user:' + decoded.email, JSON.stringify(user), { expirationTtl: 86400 * 365 });
      await env.AUTH_KV.delete('mfa_pending:' + user.id);

      // Generate backup codes
      const backupCodes = Array.from({ length: 8 }, () =>
        Array.from({ length: 8 }, () => '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 32)]).join('')
      );
      await env.AUTH_KV.put('backup_codes:' + user.id, JSON.stringify(backupCodes), { expirationTtl: 86400 * 365 });

      return new Response(JSON.stringify({
        enabled: true,
        backupCodes,
      }), {
        status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
      });
    }

    // POST /api/auth/mfa/disable - disable MFA
    if (method === 'POST' && path === 'mfa/disable') {
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace('Bearer ', '');
      const decoded = await verifyToken(token, JWT_SECRET);
      if (!decoded) {
        return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const body = await request.json() as { code?: string; password?: string };
      const userData = await env.AUTH_KV.get('user:' + decoded.email);
      if (!userData) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const user = JSON.parse(userData);
      if (!user.mfaEnabled) {
        return new Response(JSON.stringify({ error: 'MFA not enabled' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      // Verify either TOTP code or password
      if (body.code) {
        const valid = await verifyTotpCode(user.mfaSecret, body.code);
        if (!valid) {
          return new Response(JSON.stringify({ error: 'Invalid verification code' }), {
            status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
          });
        }
      } else if (body.password) {
        const passwordValid = await verifyPassword(body.password, user.hashedPw, user.salt || '');
        if (!passwordValid) {
          return new Response(JSON.stringify({ error: 'Invalid password' }), {
            status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
          });
        }
      } else {
        return new Response(JSON.stringify({ error: 'Code or password required' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      user.mfaEnabled = false;
      delete user.mfaSecret;
      await env.AUTH_KV.put('user:' + decoded.email, JSON.stringify(user), { expirationTtl: 86400 * 365 });
      await env.AUTH_KV.delete('backup_codes:' + user.id);

      return new Response(JSON.stringify({ disabled: true }), {
        status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
      });
    }

    // POST /api/auth/mfa/verify-login - verify MFA during login
    if (method === 'POST' && path === 'mfa/verify-login') {
      if (!(await checkKVRateLimit(env.AUTH_KV, ip, 5))) {
        return new Response(JSON.stringify({ error: 'Too many requests' }), {
          status: 429, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const body = await request.json() as { email?: string; code?: string; backupCode?: string };
      const email = (body.email || '').trim().toLowerCase();
      const code = (body.code || '').trim();
      const backupCode = (body.backupCode || '').trim().toUpperCase();

      const userData = await env.AUTH_KV.get('user:' + email);
      if (!userData) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const user = JSON.parse(userData);
      if (!user.mfaEnabled) {
        return new Response(JSON.stringify({ error: 'MFA not enabled for this account' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      // Check TOTP code
      if (code) {
        const valid = await verifyTotpCode(user.mfaSecret, code);
        if (!valid) {
          // Check backup codes
          const backupData = await env.AUTH_KV.get('backup_codes:' + user.id);
          if (backupData) {
            const codes = JSON.parse(backupData);
            const idx = codes.indexOf(backupCode);
            if (idx === -1) {
              return new Response(JSON.stringify({ error: 'Invalid verification code' }), {
                status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
              });
            }
            // Remove used backup code
            codes.splice(idx, 1);
            await env.AUTH_KV.put('backup_codes:' + user.id, JSON.stringify(codes), { expirationTtl: 86400 * 365 });
          } else {
            return new Response(JSON.stringify({ error: 'Invalid verification code' }), {
              status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
            });
          }
        }
      } else if (backupCode) {
        const backupData = await env.AUTH_KV.get('backup_codes:' + user.id);
        if (!backupData) {
          return new Response(JSON.stringify({ error: 'Invalid backup code' }), {
            status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
          });
        }
        const codes = JSON.parse(backupData);
        const idx = codes.indexOf(backupCode);
        if (idx === -1) {
          return new Response(JSON.stringify({ error: 'Invalid backup code' }), {
            status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
          });
        }
        codes.splice(idx, 1);
        await env.AUTH_KV.put('backup_codes:' + user.id, JSON.stringify(codes), { expirationTtl: 86400 * 365 });
      } else {
        return new Response(JSON.stringify({ error: 'Code or backup code required' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      // MFA verified — issue token
      const token = await createToken({ userId: user.id, email, isAdmin: isAdminEmail(email, env.ADMIN_EMAILS || ''), exp: Math.floor(Date.now() / 1000) + 86400 * 7 }, JWT_SECRET);
      return new Response(JSON.stringify({
        token,
        user: { id: user.id, email, nickname: user.nickname, identity: user.identity, goals: user.goals, mfaEnabled: true, isAdmin: isAdminEmail(email, env.ADMIN_EMAILS || ''), isLoggedIn: true }
      }), {
        status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
      });
    }


    // POST /api/auth/passkey/register-options
    if (method === 'POST' && path === 'passkey/register-options') {
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace('Bearer ', '');
      const decoded = await verifyToken(token, JWT_SECRET);
      if (!decoded) {
        return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      const challenge = generateChallenge();
      const rpId = getRpId();
      // Store challenge temporarily
      await env.AUTH_KV.put('pk_challenge:' + decoded.userId, JSON.stringify({ challenge, purpose: 'register', createdAt: Date.now() }), { expirationTtl: 300 });

      const options = {
        challenge,
        rp: { name: 'AIShield Lab', id: rpId },
        user: {
          id: bufferToBase64url(new TextEncoder().encode(decoded.userId)),
          name: decoded.email,
          displayName: decoded.email.split('@')[0],
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 },  // RS256
        ],
        timeout: 60000,
        attestation: 'none',
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          requireResidentKey: true,
          residentKey: 'required',
          userVerification: 'preferred',
        },
      };
      return new Response(JSON.stringify(options), {
        status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
      });
    }

    // POST /api/auth/passkey/register-verify
    if (method === 'POST' && path === 'passkey/register-verify') {
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace('Bearer ', '');
      const decoded = await verifyToken(token, JWT_SECRET);
      if (!decoded) {
        return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const body = await request.json() as { id?: string; rawId?: string; response?: { clientDataJSON?: string; attestationObject?: string } };
      if (!body.rawId || !body.response?.clientDataJSON || !body.response?.attestationObject) {
        return new Response(JSON.stringify({ error: 'Missing credential data' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      // Verify challenge
      const challengeData = await env.AUTH_KV.get('pk_challenge:' + decoded.userId);
      if (!challengeData) {
        return new Response(JSON.stringify({ error: 'No pending registration. Start from /passkey/register-options' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      const { challenge, purpose } = JSON.parse(challengeData);
      if (purpose !== 'register') {
        return new Response(JSON.stringify({ error: 'Invalid challenge purpose' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      await env.AUTH_KV.delete('pk_challenge:' + decoded.userId);

      // Verify clientDataJSON
      try {
        const clientData = JSON.parse(new TextDecoder().decode(base64urlToBuffer(body.response.clientDataJSON)));
        if (clientData.type !== 'webauthn.create') {
          return new Response(JSON.stringify({ error: 'Invalid client data type' }), {
            status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
          });
        }
        if (!clientData.challenge || bufferToBase64url(base64urlToBuffer(clientData.challenge)) !== challenge) {
          return new Response(JSON.stringify({ error: 'Challenge mismatch' }), {
            status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
          });
        }
        const validOrigins = ['https://aishield-lab.pages.dev', 'https://aiseclearn.com'];
        if (!validOrigins.includes(clientData.origin)) {
          return new Response(JSON.stringify({ error: 'Origin mismatch' }), {
            status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
          });
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid client data' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      // Parse attestation object
      const attestationBuf = base64urlToBuffer(body.response.attestationObject);
      try {
        const attestation = cborDecode(attestationBuf);
        const authData = new Uint8Array(attestation.authData as ArrayBuffer);
        const result = verifyAuthenticatorData(authData, challenge, getRpId());
        if (!result) {
          return new Response(JSON.stringify({ error: 'Invalid authenticator data' }), {
            status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
          });
        }

        // Store passkey credential
        const credId = bufferToBase64url(result.credentialId);
        const existingCreds = await env.AUTH_KV.get('passkeys:' + decoded.userId);
        const credentials = existingCreds ? JSON.parse(existingCreds) : [];

        // Check duplicate
        if (credentials.some((c: any) => c.id === credId)) {
          return new Response(JSON.stringify({ error: 'Credential already registered' }), {
            status: 409, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
          });
        }

        credentials.push({
          id: credId,
          publicKey: result.publicKey,
          signCount: result.signCount,
          createdAt: new Date().toISOString(),
          name: 'Passkey ' + (credentials.length + 1),
        });
        await env.AUTH_KV.put('passkeys:' + decoded.userId, JSON.stringify(credentials), { expirationTtl: 86400 * 365 });

        // Also store reverse mapping: credentialId -> userId
        await env.AUTH_KV.put('pk_cred:' + credId, JSON.stringify({ userId: decoded.userId, email: decoded.email }), { expirationTtl: 86400 * 365 });

        return new Response(JSON.stringify({
          registered: true,
          credential: { id: credId, name: 'Passkey ' + credentials.length },
        }), {
          status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid attestation data' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
    }

    // POST /api/auth/passkey/authenticate-options
    if (method === 'POST' && path === 'passkey/authenticate-options') {
      const challenge = generateChallenge();
      const rpId = getRpId();
      // Store challenge without user context (discoverable credential)
      const challengeId = 'pk_auth_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      await env.AUTH_KV.put('pk_challenge:' + challengeId, JSON.stringify({ challenge, purpose: 'auth', createdAt: Date.now() }), { expirationTtl: 300 });

      const options = {
        challenge,
        rpId,
        timeout: 60000,
        userVerification: 'preferred',
      };
      return new Response(JSON.stringify({ ...options, challengeId }), {
        status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
      });
    }

    // POST /api/auth/passkey/authenticate-verify
    if (method === 'POST' && path === 'passkey/authenticate-verify') {
      if (!(await checkKVRateLimit(env.AUTH_KV, ip, 5))) {
        return new Response(JSON.stringify({ error: 'Too many requests' }), {
          status: 429, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      const body = await request.json() as { id?: string; rawId?: string; response?: { clientDataJSON?: string; authenticatorData?: string; signature?: string }; challengeId?: string };
      if (!body.rawId || !body.response?.clientDataJSON || !body.response?.authenticatorData || !body.response?.signature || !body.challengeId) {
        return new Response(JSON.stringify({ error: 'Missing credential data' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      // Verify challenge
      const challengeData = await env.AUTH_KV.get('pk_challenge:' + body.challengeId);
      if (!challengeData) {
        return new Response(JSON.stringify({ error: 'No pending authentication' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      const { challenge, purpose } = JSON.parse(challengeData);
      if (purpose !== 'auth') {
        return new Response(JSON.stringify({ error: 'Invalid challenge purpose' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      await env.AUTH_KV.delete('pk_challenge:' + body.challengeId);

      // Verify clientDataJSON
      try {
        const clientData = JSON.parse(new TextDecoder().decode(base64urlToBuffer(body.response.clientDataJSON)));
        if (clientData.type !== 'webauthn.get') {
          return new Response(JSON.stringify({ error: 'Invalid client data type' }), {
            status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
          });
        }
        if (bufferToBase64url(base64urlToBuffer(clientData.challenge)) !== challenge) {
          return new Response(JSON.stringify({ error: 'Challenge mismatch' }), {
            status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
          });
        }
        const validOrigins = ['https://aishield-lab.pages.dev', 'https://aiseclearn.com'];
        if (!validOrigins.includes(clientData.origin)) {
          return new Response(JSON.stringify({ error: 'Origin mismatch' }), {
            status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
          });
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid client data' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      // Look up credential
      const credId = bufferToBase64url(base64urlToBuffer(body.rawId));
      const credMapping = await env.AUTH_KV.get('pk_cred:' + credId);
      if (!credMapping) {
        return new Response(JSON.stringify({ error: 'Unknown credential' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      const { userId, email } = JSON.parse(credMapping);

      // Get stored credentials
      const storedCreds = await env.AUTH_KV.get('passkeys:' + userId);
      if (!storedCreds) {
        return new Response(JSON.stringify({ error: 'No passkeys registered' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      const credentials = JSON.parse(storedCreds);
      const storedCred = credentials.find((c: any) => c.id === credId);
      if (!storedCred) {
        return new Response(JSON.stringify({ error: 'Credential not found' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      // Verify signature
      const authData = base64urlToBuffer(body.response.authenticatorData);
      const signature = base64urlToBuffer(body.response.signature);
      const clientDataJSON = base64urlToBuffer(body.response.clientDataJSON);
      // Signed data = authData + sha256(clientDataJSON)
      const clientDataHash = new Uint8Array(await crypto.subtle.digest('SHA-256', clientDataJSON));
      const signedData = new Uint8Array(authData.length + clientDataHash.length);
      signedData.set(authData, 0);
      signedData.set(clientDataHash, authData.length);

      const valid = await verifyWebAuthnSignature(storedCred.publicKey, signature, signedData);
      if (!valid) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      // Update sign count
      const authDataView = new DataView(authData.buffer, authData.byteOffset, authData.byteLength);
      const newSignCount = authDataView.getUint32(33);
      storedCred.signCount = newSignCount;
      await env.AUTH_KV.put('passkeys:' + userId, JSON.stringify(credentials), { expirationTtl: 86400 * 365 });

      // Issue token
      const userData = await env.AUTH_KV.get('user:' + email);
      if (!userData) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      const user = JSON.parse(userData);
      const token = await createToken({ userId: user.id, email, isAdmin: isAdminEmail(email, env.ADMIN_EMAILS || ''), exp: Math.floor(Date.now() / 1000) + 86400 * 7 }, JWT_SECRET);
      return new Response(JSON.stringify({
        token,
        user: { id: user.id, email, nickname: user.nickname, identity: user.identity, goals: user.goals, mfaEnabled: !!user.mfaEnabled, isAdmin: isAdminEmail(email, env.ADMIN_EMAILS || ''), isLoggedIn: true }
      }), {
        status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
      });
    }

    // GET /api/auth/passkey/list - list user's passkeys
    if (method === 'GET' && path === 'passkey/list') {
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace('Bearer ', '');
      const decoded = await verifyToken(token, JWT_SECRET);
      if (!decoded) {
        return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      const storedCreds = await env.AUTH_KV.get('passkeys:' + decoded.userId);
      const credentials = storedCreds ? JSON.parse(storedCreds) : [];
      return new Response(JSON.stringify({ credentials: credentials.map((c: any) => ({ id: c.id, name: c.name, createdAt: c.createdAt })) }), {
        status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
      });
    }

    // POST /api/auth/passkey/delete - delete a passkey
    if (method === 'POST' && path === 'passkey/delete') {
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace('Bearer ', '');
      const decoded = await verifyToken(token, JWT_SECRET);
      if (!decoded) {
        return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      const body = await request.json() as { credentialId?: string };
      if (!body.credentialId) {
        return new Response(JSON.stringify({ error: 'Missing credentialId' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      const storedCreds = await env.AUTH_KV.get('passkeys:' + decoded.userId);
      if (!storedCreds) {
        return new Response(JSON.stringify({ error: 'No passkeys found' }), {
          status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      let credentials = JSON.parse(storedCreds);
      const idx = credentials.findIndex((c: any) => c.id === body.credentialId);
      if (idx === -1) {
        return new Response(JSON.stringify({ error: 'Credential not found' }), {
          status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      credentials.splice(idx, 1);
      await env.AUTH_KV.put('passkeys:' + decoded.userId, JSON.stringify(credentials), { expirationTtl: 86400 * 365 });
      await env.AUTH_KV.delete('pk_cred:' + body.credentialId);
      return new Response(JSON.stringify({ deleted: true }), {
        status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
      });
    }



    // POST /api/auth/stats/track - track an event
    if (method === 'POST' && path === 'stats/track') {
      try {
        const body = await request.json() as { event?: string; meta?: any };
        if (!body.event) {
          return new Response(JSON.stringify({ error: 'Missing event' }), {
            status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
          });
        }
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timestamp = now.toISOString();

        // Increment counter
        const counterKey = 'stats:' + body.event;
        const currentStr = await env.AUTH_KV.get(counterKey);
        const current = currentStr ? parseInt(currentStr, 10) : 0;
        await env.AUTH_KV.put(counterKey, String(current + 1));

        // Append to daily event log (TTL 30 days)
        const dayKey = 'events:' + dateStr;
        const dayStr = await env.AUTH_KV.get(dayKey);
        const dayEvents = dayStr ? JSON.parse(dayStr) : [];
        dayEvents.push({ event: body.event, timestamp, meta: body.meta || null });
        // Keep last 500 events per day
        if (dayEvents.length > 500) dayEvents.splice(0, dayEvents.length - 500);
        await env.AUTH_KV.put(dayKey, JSON.stringify(dayEvents), { expirationTtl: 86400 * 30 });

        return new Response(JSON.stringify({ ok: true }), {
          status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Track failed' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
    }

    // GET /api/auth/stats/dashboard - admin dashboard data
    if (method === 'GET' && path === 'stats/dashboard') {
      // Admin authentication — ONLY via Authorization header, NEVER via URL param (prevents log leakage)
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace('Bearer ', '');
      const ADMIN_SECRET = env.ADMIN_SECRET || '';

      let isAuthorized = false;
      if (ADMIN_SECRET && token === ADMIN_SECRET) {
        isAuthorized = true;
      } else {
        const decoded = await verifyToken(token, JWT_SECRET);
        if (decoded && decoded.isAdmin === true) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        console.warn(`Unauthorized admin dashboard access attempt from IP: ${ip}`);
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }

      // Collect counters
      const eventTypes = ['register', 'login', 'mfa_setup', 'passkey_register', 'career_click', 'payment_success', 'chat_message'];
      const counters: Record<string, number> = {};
      for (const evt of eventTypes) {
        const val = await env.AUTH_KV.get('stats:' + evt);
        counters[evt] = val ? parseInt(val, 10) : 0;
      }

      // Collect last 7 days of events
      const recentEvents: any[] = [];
      const now = new Date();
      for (let d = 0; d < 7; d++) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);
        const dateStr = date.toISOString().split('T')[0];
        const dayStr = await env.AUTH_KV.get('events:' + dateStr);
        if (dayStr) {
          const dayEvents = JSON.parse(dayStr);
          recentEvents.push(...dayEvents);
        }
      }
      // Sort by timestamp desc, limit 200
      recentEvents.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      const limitedEvents = recentEvents.slice(0, 200);

      // Extract chat questions for top questions
      const chatQuestions: string[] = [];
      for (const evt of recentEvents) {
        if (evt.event === 'chat_message' && evt.meta && evt.meta.question) {
          chatQuestions.push(evt.meta.question);
        }
      }
      // Count frequency
      const questionFreq: Record<string, number> = {};
      for (const q of chatQuestions) {
        const key = q.toLowerCase().trim();
        questionFreq[key] = (questionFreq[key] || 0) + 1;
      }
      const topQuestions = Object.entries(questionFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([q, count]) => ({ question: q, count }));

      // Daily breakdown for chart
      const daily: Record<string, Record<string, number>> = {};
      for (let d = 6; d >= 0; d--) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);
        const dateStr = date.toISOString().split('T')[0];
        daily[dateStr] = {};
        for (const evt of eventTypes) {
          daily[dateStr][evt] = 0;
        }
      }
      for (const evt of recentEvents) {
        const dateStr = evt.timestamp.split('T')[0];
        if (daily[dateStr]) {
          daily[dateStr][evt.event] = (daily[dateStr][evt.event] || 0) + 1;
        }
      }

      return new Response(JSON.stringify({ counters, recentEvents: limitedEvents, topQuestions, daily }), {
        status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
      });
    }

    // GET /api/auth/daily-challenge/streak - get user's daily challenge streak
    if (method === 'GET' && path === 'daily-challenge/streak') {
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace('Bearer ', '');
      const decoded = await verifyToken(token, JWT_SECRET);
      if (!decoded) {
        return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      const streakKey = 'daily_streak:' + decoded.userId;
      const data = await env.AUTH_KV.get(streakKey);
      const streak = data ? JSON.parse(data) : { count: 0, lastDate: '' };
      const todayAnswered = streak.lastDate === getTodayStr();
      return new Response(JSON.stringify({ ...streak, todayAnswered, todayQuestionId: getTodaysQuestionId() }), {
        status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
      });
    }

    // POST /api/auth/daily-challenge/submit - submit answer and update streak
    if (method === 'POST' && path === 'daily-challenge/submit') {
      if (!(await checkKVRateLimit(env.AUTH_KV, ip, 10))) {
        return new Response(JSON.stringify({ error: 'Too many requests' }), {
          status: 429, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      const authHeader = request.headers.get('Authorization') || '';
      const token = authHeader.replace('Bearer ', '');
      const decoded = await verifyToken(token, JWT_SECRET);
      if (!decoded) {
        return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
          status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      const body = await request.json() as { questionId?: number; answer?: number; isCorrect?: boolean };
      if (body.questionId == null || body.answer == null) {
        return new Response(JSON.stringify({ error: 'Missing questionId or answer' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      const todayQuestionId = getTodaysQuestionId();
      if (body.questionId !== todayQuestionId) {
        return new Response(JSON.stringify({ error: 'Invalid question for today' }), {
          status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      const question = DAILY_QUESTIONS.find(q => q.id === body.questionId);
      const isCorrect = question ? question.answer === body.answer : false;
      if (!isCorrect) {
        return new Response(JSON.stringify({ correct: false, streak: 0 }), {
          status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      const streakKey = 'daily_streak:' + decoded.userId;
      const today = getTodayStr();
      const data = await env.AUTH_KV.get(streakKey);
      const streak = data ? JSON.parse(data) : { count: 0, lastDate: '' };
      if (streak.lastDate === today) {
        return new Response(JSON.stringify({ correct: true, streak: streak.count, alreadyAnswered: true }), {
          status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
        });
      }
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const newCount = streak.lastDate === yesterdayStr ? streak.count + 1 : 1;
      await env.AUTH_KV.put(streakKey, JSON.stringify({ count: newCount, lastDate: today }), { expirationTtl: 86400 * 365 });
      return new Response(JSON.stringify({ correct: true, streak: newCount }), {
        status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
      });
    }


    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders }
    });
  }
};
