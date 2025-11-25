import type {APIRoute} from 'astro';
import nodemailer from 'nodemailer';

const emailLooksValid = (value?: string) => !!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const CONTACT_DEBUG = import.meta.env.CONTACT_DEBUG === 'true';

const contactRateBuckets = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 3;

const getClientKey = (request: Request) => {
  const forwardedFor = request.headers.get('x-forwarded-for') || '';
  const ip = forwardedFor.split(',')[0]?.trim();
  return ip || request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || 'anonymous';
};

const isRateLimited = (key: string) => {
  const now = Date.now();
  const entries = contactRateBuckets.get(key) || [];
  const fresh = entries.filter((ts) => now - ts < RATE_WINDOW_MS);
  if (fresh.length >= RATE_MAX) {
    contactRateBuckets.set(key, fresh);
    return true;
  }
  fresh.push(now);
  contactRateBuckets.set(key, fresh);
  return false;
};

export const POST: APIRoute = async ({request}) => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    CONTACT_RECIPIENT = 'info@repair-leonberg.de',
    SMTP_FROM
  } = import.meta.env;

  const smtpPort = Number(SMTP_PORT);
  const hasConfig = SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && Number.isFinite(smtpPort);

  if (!hasConfig) {
    console.error('[contact] Missing or invalid SMTP config', {
      hasHost: Boolean(SMTP_HOST),
      hasPort: Boolean(SMTP_PORT),
      hasUser: Boolean(SMTP_USER),
      hasPass: Boolean(SMTP_PASS),
      portParsed: smtpPort
    });
    return new Response(
      JSON.stringify({error: 'E-Mail Versand ist aktuell nicht verfügbar. Bitte versuchen Sie es später erneut.'}),
      {status: 503}
    );
  }

  let payload: {
    name?: string;
    email?: string;
    message?: string;
    copy?: boolean;
    company?: string;
    submittedAt?: number;
  };

  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({error: 'Ungültige Anfrage.'}), {status: 400});
  }

  const name = payload?.name?.trim();
  const email = payload?.email?.trim();
  const message = payload?.message?.trim();
  const copy = Boolean(payload?.copy);
  const honeypot = payload?.company?.trim();
  const submittedAt = Number(payload?.submittedAt);

  if (honeypot && honeypot.length > 0) {
    return new Response(JSON.stringify({error: 'Die Nachricht konnte nicht gesendet werden.'}), {status: 400});
  }

  const ageOk = Number.isFinite(submittedAt) ? Date.now() - submittedAt >= 1200 : true;
  if (!ageOk) {
    return new Response(JSON.stringify({error: 'Bitte senden Sie das Formular noch einmal.'}), {status: 400});
  }

  if (!name || !email || !message) {
    return new Response(JSON.stringify({error: 'Bitte alle Pflichtfelder ausfüllen.'}), {status: 400});
  }

  if (!emailLooksValid(email)) {
    return new Response(JSON.stringify({error: 'Bitte eine gültige E-Mail-Adresse angeben.'}), {status: 400});
  }

  const clientKey = getClientKey(request);
  if (isRateLimited(clientKey)) {
    return new Response(JSON.stringify({error: 'Bitte warten Sie einen Moment vor der nächsten Nachricht.'}), {status: 429});
  }

  const textBody = [
    `Name: ${name}`,
    `Mail: ${email}`,
    `Kopie gewünscht: ${copy ? 'Ja' : 'Nein'}`,
    '',
    'Nachricht:',
    message
  ].join('\n');

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      tls: smtpPort === 587 ? {rejectUnauthorized: true} : undefined
    });

    await transporter.sendMail({
      from: SMTP_FROM || `Repair Café Leonberg <${SMTP_USER}>`,
      to: CONTACT_RECIPIENT,
      replyTo: email,
      cc: copy ? email : undefined,
      subject: 'Neue Nachricht über repair-leonberg.de',
      text: textBody
    });

    return new Response(JSON.stringify({success: true}), {status: 200});
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to send contact mail', {
      error: message,
      host: SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465
    });
    return new Response(
      JSON.stringify({
        error: 'Die Nachricht konnte nicht versendet werden. Bitte versuchen Sie es später erneut.',
        ...(CONTACT_DEBUG ? {debug: message} : {})
      }),
      {status: 500}
    );
  }
};
