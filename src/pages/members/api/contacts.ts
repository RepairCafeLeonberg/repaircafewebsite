import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSheetClient, SPREADSHEET_ID, memberToRow, rowToMember } from '../../../lib/googleSheetClient';

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
  isMember: z.boolean().optional()
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
      range: 'members!A2:H', // Assuming headers in row 1
    });

    const rows = response.data.values || [];
    // Filter out empty rows if any
    const members = rows.map(rowToMember).filter(m => m.id);

    return new Response(JSON.stringify(members), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[members/api] GET failed', error);
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
    closing: parsed.closing?.trim() || null
  };

  const row = memberToRow(memberObj);

  try {
    await client.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'members!A:H',
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
      closing: memberObj.closing || ''
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
    // Implementing DELETE in Sheets is tricky without row index.
    // We need to find the row index first.
    const response = await client.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'members!A:A', // Just get IDs
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(r => r[0] === id); // 0-indexed in array, but A1 is row 1

    if (rowIndex === -1) {
      return new Response(JSON.stringify({ error: 'Member not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Sheet row number is rowIndex + 1 (1-based)
    // Actually we can just "clear" the row content to avoid shifting logic complexities or use batchUpdate with deleteDimension
    // Deleting the dimension is cleaner to keep the sheet tidy.

    // Indices in sheets API for deleteDimension are 0-based

    await client.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0, // Assuming first sheet is ID 0. User instruction said "first tab".
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1
              }
            }
          }
        ]
      }
    });

    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[members/api] DELETE failed', error);
    return new Response(JSON.stringify({ error: 'Failed to delete member' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
