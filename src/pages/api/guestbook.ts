import type { APIRoute } from 'astro';
import { createClient } from '@sanity/client';

const projectId = import.meta.env.SANITY_PROJECT_ID;
const dataset = import.meta.env.SANITY_DATASET;
const apiVersion = import.meta.env.SANITY_API_VERSION ?? '2023-05-26';
const token = import.meta.env.SANITY_WRITE_TOKEN;

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

export const POST: APIRoute = async ({ request }) => {
  if (!isConfigured) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Der Gästebuch-Service ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: 'Ungültige Eingabe. Bitte verwenden Sie das Formular auf der Website.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const name = sanitizeInput(toPlainString(payload.name), 80);
  const message = sanitizeInput(toPlainString(payload.message), 600);
  const city = sanitizeInput(toPlainString(payload.city), 80);

  if (!name || name.length < 2) {
    return new Response(
      JSON.stringify({ success: false, message: 'Bitte einen Namen oder ein Pseudonym mit mindestens 2 Zeichen angeben.' }),
      {
        status: 422,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  if (!message || message.length < 10) {
    return new Response(
      JSON.stringify({ success: false, message: 'Bitte eine Nachricht mit mindestens 10 Zeichen schreiben.' }),
      {
        status: 422,
        headers: { 'Content-Type': 'application/json' }
      }
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
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Beim Speichern ist ein Fehler passiert. Bitte versuchen Sie es später noch einmal.'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const OPTIONS: APIRoute = async () =>
  new Response(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
