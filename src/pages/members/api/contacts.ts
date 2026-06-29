import type { APIRoute } from 'astro';
import { z } from 'zod';
import {
  getSheetClient,
  MASTER_DATA_RANGE,
  MASTER_ID_RANGE,
  MASTER_RANGE,
  MASTER_SHEET_NAME,
  SPREADSHEET_ID,
  masterRowToMember,
  memberToMasterRow,
  rowToMember,
  shouldShowInMailservice
} from '../../../lib/googleSheetClient';

export const prerender = false;

const MEMBER_TOKEN = import.meta.env.MEMBER_API_TOKEN;

const requireToken = (request: Request) => {
  if (!MEMBER_TOKEN) return true;
  const authHeader = request.headers.get('authorization') ?? '';
  if (authHeader.startsWith('Bearer ') && authHeader.slice(7) === MEMBER_TOKEN) return true;
  const headerToken = request.headers.get('x-member-api-token');
  if (headerToken && headerToken === MEMBER_TOKEN) return true;
  return false;
};

const payloadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  tags: z.array(z.string().min(1)).optional(),
  greeting: z.string().optional(),
  closing: z.string().optional(),
  isMember: z.boolean().optional(),
  receivesMail: z.boolean().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional()
});

export const GET: APIRoute = async ({ request }) => {
  if (!requireToken(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const client = await getSheetClient();
  if (!client || !SPREADSHEET_ID) {
    return new Response('Google Sheets not configured', { status: 500 });
  }

  try {
    const response = await client.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: MASTER_DATA_RANGE,
    });

    const rows = response.data.values || [];
    const members = rows
      .filter(shouldShowInMailservice)
      .map(masterRowToMember)
      .filter(m => m.id);

    return new Response(JSON.stringify(members), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.warn('[members/api] Masterliste GET failed, trying legacy members tab', error);
    try {
      const response = await client.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'members!A2:H',
      });

      const rows = response.data.values || [];
      const members = rows.map(rowToMember).filter(m => m.id);

      return new Response(JSON.stringify(members), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (legacyError) {
      console.error('[members/api] GET failed', legacyError);
    }
    return new Response('Failed to load members', { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!requireToken(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const client = await getSheetClient();
  if (!client || !SPREADSHEET_ID) {
    return new Response('Google Sheets not configured', { status: 500 });
  }

  let parsed;
  try {
    const json = await request.json();
    const validated = payloadSchema.safeParse(json);
    if (!validated.success) {
      return new Response(JSON.stringify({ error: 'Invalid payload', details: validated.error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    parsed = validated.data;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const newId = crypto.randomUUID();
  const memberObj = {
    id: newId,
    first_name: parsed.firstName.trim(),
    last_name: parsed.lastName.trim(),
    email: parsed.email?.trim() || null,
    is_member: parsed.isMember ?? true,
    tags: parsed.tags ?? [],
    greeting: parsed.greeting?.trim() || null,
    closing: parsed.closing?.trim() || null,
    receives_mail: parsed.email ? parsed.receivesMail ?? true : false,
    street: parsed.street?.trim() || '',
    city: parsed.city?.trim() || '',
    phone: parsed.phone?.trim() || '',
    notes: parsed.notes?.trim() || ''
  };

  const row = memberToMasterRow(memberObj);

  try {
    await client.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: MASTER_RANGE,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row]
      }
    });

    // Return the object as if we read it back
    const returnedMember = {
      id: newId,
      firstName: memberObj.first_name,
      lastName: memberObj.last_name,
      email: memberObj.email || undefined,
      isMember: memberObj.is_member,
      tags: memberObj.tags,
      greeting: memberObj.greeting || '',
      closing: memberObj.closing || '',
      receivesMail: memberObj.receives_mail,
      street: memberObj.street,
      city: memberObj.city,
      phone: memberObj.phone,
      notes: memberObj.notes
    };

    return new Response(JSON.stringify(returnedMember), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[members/api] POST failed', error);
    return new Response(JSON.stringify({ error: 'Failed to save member' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  if (!requireToken(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const client = await getSheetClient();
  if (!client || !SPREADSHEET_ID) {
    return new Response('Google Sheets not configured', { status: 500 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id')?.trim();
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const response = await client.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: MASTER_ID_RANGE,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(r => r[0] === id);

    if (rowIndex === -1) {
      return new Response(JSON.stringify({ error: 'Member not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sheetRow = rowIndex + 1;
    const today = new Date().toISOString().slice(0, 10);

    await client.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: `${MASTER_SHEET_NAME}!I${sheetRow}:J${sheetRow}`,
            values: [[false, 'Archiv']]
          },
          {
            range: `${MASTER_SHEET_NAME}!S${sheetRow}:T${sheetRow}`,
            values: [[false, 'Über Mailservice archiviert.']]
          },
          {
            range: `${MASTER_SHEET_NAME}!V${sheetRow}:V${sheetRow}`,
            values: [[today]]
          }
        ]
      }
    });

    return new Response(JSON.stringify({ success: true, id, archived: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[members/api] DELETE failed', error);
    return new Response(JSON.stringify({ error: 'Failed to archive member' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
