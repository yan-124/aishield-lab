/**
 * Shared JWT verification utility for Cloudflare Pages Functions.
 * Token format: base64(header).base64(payload).hex(signature)
 * HMAC-SHA256 signed, compatible with auth/[[path]].ts createToken().
 *
 * Usage:
 *   const decoded = await verifyJWT(token, env.JWT_SECRET);
 *   if (!decoded) return new Response('Unauthorized', { status: 401 });
 */

export async function verifyJWT(token: string, secret: string): Promise<any | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const encoder = new TextEncoder();
  try {
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const sigBytes = new Uint8Array(sig.match(/.{2}/g)!.map(b => parseInt(b, 16)));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(header + '.' + payload));
    if (!valid) return null;
    const decoded = JSON.parse(atob(payload));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch { return null; }
}

export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

/** Require authentication — returns decoded token or throws a 401 Response */
export async function requireAuth(request: Request, jwtSecret: string): Promise<{ userId: string; email: string } | Response> {
  const token = extractToken(request);
  if (!token) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }
  const decoded = await verifyJWT(token, jwtSecret);
  if (!decoded) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }
  return { userId: decoded.userId, email: decoded.email };
}
