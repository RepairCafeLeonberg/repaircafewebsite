import type {APIRoute} from 'astro';
import nodemailer from 'nodemailer';

const emailLooksValid = (value?: string) => !!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

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
    console.warn('[contact] Missing or invalid SMTP config', {
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

  if (!name || !email || !message) {
    return new Response(JSON.stringify({error: 'Bitte alle Pflichtfelder ausfüllen.'}), {status: 400});
  }

  if (!emailLooksValid(email)) {
    return new Response(JSON.stringify({error: 'Bitte eine gültige E-Mail-Adresse angeben.'}), {status: 400});
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
      }
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
    console.error('Failed to send contact mail', err);
    return new Response(
      JSON.stringify({error: 'Die Nachricht konnte nicht versendet werden. Bitte versuchen Sie es später erneut.'}),
      {status: 500}
    );
  }
};
