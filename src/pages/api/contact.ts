import type {APIRoute} from 'astro';
import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  CONTACT_RECIPIENT = 'info@repair-leonberg.de',
  SMTP_FROM
} = import.meta.env;

const ensureTransporter = () => {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.');
  }

  const port = Number(SMTP_PORT);
  const secure = port === 465;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
};

const transporter = ensureTransporter();

export const POST: APIRoute = async ({request}) => {
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

  const textBody = [
    `Name: ${name}`,
    `Mail: ${email}`,
    `Kopie gewünscht: ${copy ? 'Ja' : 'Nein'}`,
    '',
    'Nachricht:',
    message
  ].join('\n');

  try {
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
