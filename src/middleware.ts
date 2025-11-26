import type { MiddlewareHandler } from 'astro';

const BASIC_USER = import.meta.env.BASIC_AUTH_USER;
const BASIC_PASS = import.meta.env.BASIC_AUTH_PASS;

const PROTECTED_PREFIXES = ['/members', '/login'];
const EXEMPT_PATH_PREFIXES = ['/members/api/'];

const requiresAuth = (pathname: string) => {
  // API-Routen unter /members/api sollen ohne Browser-Basic-Auth erreichbar sein (schützen sich selbst per Token)
  if (EXEMPT_PATH_PREFIXES.some((prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix))) {
    return false;
  }
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
};

const unauthorizedResponse = () =>
  new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Repair Cafe Mitglieder", charset="UTF-8"',
      'Cache-Control': 'no-store'
    }
  });

const decodeCredentials = (authHeader: string) => {
  if (!authHeader.startsWith('Basic ')) return null;
  const base64 = authHeader.slice('Basic '.length).trim();
  try {
    const decoded = Buffer.from(base64, 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex === -1) return null;
    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1)
    };
  } catch {
    return null;
  }
};

export const onRequest: MiddlewareHandler = async ({ request }, next) => {
  const { pathname } = new URL(request.url);

  if (!requiresAuth(pathname)) {
    return next();
  }

  if (!BASIC_USER || !BASIC_PASS) {
    return new Response('Basic auth is not configured.', { status: 503 });
  }

  const header = request.headers.get('authorization');
  const credentials = header ? decodeCredentials(header) : null;

  if (credentials && credentials.username === BASIC_USER && credentials.password === BASIC_PASS) {
    return next();
  }

  return unauthorizedResponse();
};
