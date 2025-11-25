import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';
import type { TransportOptions } from 'nodemailer';
import { z } from 'zod';

const payloadSchema = z.object({
  fromName: z.string().min(1),
  fromEmail: z.string().email(),
  replyTo: z.string().email(),
  subject: z.string().min(1),
  recipients: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        email: z.string().email(),
        messageText: z.string().min(1),
        messageHtml: z.string().min(1)
      })
    )
    .min(1),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        content: z.string().min(1), // base64
        contentType: z.string().optional()
      })
    )
    .optional()
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: 'Ungültige Nutzdaten',
          details: parsed.error.format()
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { fromName, replyTo, subject, recipients, attachments = [] } = parsed.data;

    const smtpHost = import.meta.env.SMTP_HOST;
    const smtpPort = Number(import.meta.env.SMTP_PORT || 587);
    const smtpUser = import.meta.env.SMTP_USER;
    const smtpPass = import.meta.env.SMTP_PASS;
    const mailFrom = import.meta.env.MAIL_FROM || import.meta.env.SMTP_FROM || smtpUser || 'info@repair-leonberg.de';
    const bccCopy = import.meta.env.MAIL_BCC;
    const secure = import.meta.env.SMTP_SECURE === 'true' || smtpPort === 465;

    if (!smtpHost) {
      return new Response(
        JSON.stringify({
          error:
            'SMTP ist nicht konfiguriert. Bitte setze SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS und MAIL_FROM.'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const transportConfig: TransportOptions = {
      host: smtpHost,
      port: smtpPort,
      secure
    };

    if (smtpUser && smtpPass) {
      transportConfig.auth = { user: smtpUser, pass: smtpPass };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    const results = [];

    const mailAttachments =
      attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content, 'base64'),
        contentType: a.contentType
      })) || [];

    for (const recipient of recipients) {
      const info = await transporter.sendMail({
        from: `"Repair Café Leonberg" <${mailFrom}>`,
        to: `"${recipient.name}" <${recipient.email}>`,
        subject,
        text: recipient.messageText,
        html: recipient.messageHtml || recipient.messageText,
        replyTo,
        bcc: bccCopy,
        attachments: mailAttachments,
        headers: {
          'X-RepairCafe-Mailer': 'astro-mailversand',
          'X-Reply-To': replyTo,
          'X-Mailer-From': fromName
        }
      });

      results.push({
        id: recipient.id,
        to: recipient.email,
        messageId: info.messageId
      });
    }

    return new Response(
      JSON.stringify({
        message: `Versandt an ${results.length} Empfänger.`,
        results
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unbekannter Fehler'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
