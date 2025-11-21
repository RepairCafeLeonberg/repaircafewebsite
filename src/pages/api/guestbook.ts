import type { APIRoute } from 'astro';
import { createClient } from '@sanity/client';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const projectId = import.meta.env.SANITY_PROJECT_ID;
const dataset = import.meta.env.SANITY_DATASET;
const apiVersion = import.meta.env.SANITY_API_VERSION ?? '2023-05-26';
const token = import.meta.env.SANITY_WRITE_TOKEN;
const nonceSecret = import.meta.env.GUESTBOOK_NONCE_SECRET;
const DEBUG_ENABLED = import.meta.env.GUESTBOOK_DEBUG === 'true';
const runtimeNonceSecret = nonceSecret || randomBytes(32).toString('hex');

const writeClient = projectId && dataset && token
  ? createClient({
      projectId: projectId!,
      dataset: dataset!,
      apiVersion,
      token,
      useCdn: false
    })
  : null;

const isConfigured = Boolean(writeClient);

const toPlainString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const sanitizeInput = (value: string, maxLength: number) => value.trim().slice(0, maxLength);

const guestbookRateBuckets = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 3;
const NONCE_MAX_AGE_MS = 10 * 60_000; // 10 minutes

type NoncePayload = {
  nonce: string;
  issuedAt: number;
  signature: string;
};

const hashBase = (nonce: string, issuedAt: number, ua: string) => `${nonce}:${issuedAt}:${ua}`;

const signNonce = (nonce: string, issuedAt: number, ua: string) =>
  createHmac('sha256', runtimeNonceSecret).update(hashBase(nonce, issuedAt, ua)).digest('hex');

const isValidSignature = (provided: string, expected: string) => {
  try {
    const a = Buffer.from(provided, 'hex');
    const b = Buffer.from(expected, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
};

const getNoncePayload = (request: Request): NoncePayload | null => {
  const ua = request.headers.get('user-agent') ?? 'unknown';
  const nonce = randomBytes(16).toString('hex');
  const issuedAt = Date.now();
  const signature = signNonce(nonce, issuedAt, ua);
  return { nonce, issuedAt, signature };
};

const getClientKey = (request: Request) => {
  const forwardedFor = request.headers.get('x-forwarded-for') || '';
  const ip = forwardedFor.split(',')[0]?.trim();
  return ip || request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || 'anonymous';
};

const isRateLimited = (key: string) => {
  const now = Date.now();
  const entries = guestbookRateBuckets.get(key) || [];
  const fresh = entries.filter((ts) => now - ts < RATE_WINDOW_MS);
  if (fresh.length >= RATE_MAX) {
    guestbookRateBuckets.set(key, fresh);
    return true;
  }
  fresh.push(now);
  guestbookRateBuckets.set(key, fresh);
  return false;
};

const respondJson = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

const respondError = (message: string, status = 400, debugInfo?: string, logAsError = false, debugEnabled = DEBUG_ENABLED) => {
  if (logAsError) {
    console.error('[guestbook]', message, debugInfo ? { debug: debugInfo } : undefined);
  } else if (DEBUG_ENABLED && debugInfo) {
    console.warn('[guestbook]', message, { debug: debugInfo });
  }
  return respondJson(
    {
      success: false,
      message,
      ...(debugEnabled && debugInfo ? { debug: debugInfo } : {})
    },
    status
  );
};

const validateNonce = (incoming: Partial<NoncePayload>, request: Request) => {
  if (!incoming.nonce || !incoming.signature || typeof incoming.issuedAt !== 'number') {
    return { ok: false, reason: 'Ungültiger Sicherheitsnachweis.', debug: 'missing-nonce-fields' };
  }
  const ua = request.headers.get('user-agent') ?? 'unknown';
  const expectedSignature = signNonce(incoming.nonce, incoming.issuedAt, ua);
  if (!isValidSignature(incoming.signature, expectedSignature)) {
    return { ok: false, reason: 'Die Sitzung konnte nicht verifiziert werden.', debug: 'invalid-signature' };
  }
  const age = Date.now() - incoming.issuedAt;
  if (age < 0 || age > NONCE_MAX_AGE_MS) {
    return { ok: false, reason: 'Die Sitzung ist abgelaufen. Bitte laden Sie die Seite neu.', debug: 'nonce-expired' };
  }
  return { ok: true };
};

export const GET: APIRoute = async ({ request }) => {
  const isDebug = DEBUG_ENABLED || new URL(request.url).searchParams.get('debug') === '1';
  const payload = getNoncePayload(request);
  if (!payload) {
    return respondError('Sicherheits-Token konnte nicht erstellt werden.', 500, 'nonce-payload-null', false, isDebug);
  }
  return respondJson({
    success: true,
    nonce: payload.nonce,
    issuedAt: payload.issuedAt,
    signature: payload.signature,
    ttlMs: NONCE_MAX_AGE_MS,
    ...(isDebug ? { debug: 'nonce-issued' } : {})
  });
};

export const POST: APIRoute = async ({ request }) => {
  const isDebug = DEBUG_ENABLED || new URL(request.url).searchParams.get('debug') === '1';
  if (!isConfigured) {
    return respondError(
      'Der Gästebuch-Service ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.',
      503,
      'sanity-not-configured',
      false,
      isDebug
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return respondError('Ungültige Eingabe. Bitte verwenden Sie das Formular auf der Website.', 400, 'json-parse-error', false, isDebug);
  }

  const noncePayload: Partial<NoncePayload> = {
    nonce: payload.nonce as string,
    issuedAt: Number(payload.issuedAt),
    signature: payload.signature as string
  };

  const name = sanitizeInput(toPlainString(payload.name), 80);
  const message = sanitizeInput(toPlainString(payload.message), 600);
  const city = sanitizeInput(toPlainString(payload.city), 80);
  const honeypot = sanitizeInput(toPlainString(payload.honeypot), 120);
  const submittedAt = Number(payload.submittedAt);

  if (honeypot) {
    return respondError('Der Eintrag konnte nicht gespeichert werden.', 400, 'honeypot-filled', false, isDebug);
  }

  if (Number.isFinite(submittedAt) && Date.now() - submittedAt < 1200) {
    return respondError('Bitte senden Sie das Formular noch einmal.', 400, 'too-fast', false, isDebug);
  }

  if (!name || name.length < 2) {
    return respondError(
      'Bitte einen Namen oder ein Pseudonym mit mindestens 2 Zeichen angeben.',
      422,
      'name-too-short',
      false,
      isDebug
    );
  }

  if (!message || message.length < 10) {
    return respondError('Bitte eine Nachricht mit mindestens 10 Zeichen schreiben.', 422, 'message-too-short', false, isDebug);
  }

  const nonceValidation = validateNonce(noncePayload, request);
  if (!nonceValidation.ok) {
    return respondError(nonceValidation.reason, 400, nonceValidation.debug, false, isDebug);
  }

  const clientKey = getClientKey(request);
  if (isRateLimited(clientKey)) {
    return respondError(
      'Bitte warten Sie einen Moment, bevor Sie den nächsten Eintrag senden.',
      429,
      'rate-limited',
      false,
      isDebug
    );
  }

  try {
    const result = await writeClient!.create({
      _type: 'guestbookEntry',
      name,
      message,
      city: city || undefined,
      approved: false
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Vielen Dank! Ihr Eintrag wurde gespeichert und wird nach kurzer Prüfung sichtbar.',
        id: result._id
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Guestbook submission failed:', error);
    return respondError(
      'Beim Speichern ist ein Fehler passiert. Bitte versuchen Sie es später noch einmal.',
      500,
      isDebug ? (error instanceof Error ? error.message : 'unknown-error') : undefined,
      true
    );
  }
};

export const OPTIONS: APIRoute = async () =>
  new Response(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
