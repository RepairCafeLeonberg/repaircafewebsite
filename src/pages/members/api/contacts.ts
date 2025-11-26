import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSupabaseServiceClient } from '../../../lib/supabaseServer';

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

const rowToMember = (row: Record<string, unknown>) => ({
  id: String(row.id ?? ''),
  firstName: String(row.first_name ?? ''),
  lastName: String(row.last_name ?? ''),
  email: typeof row.email === 'string' ? row.email : undefined,
  isMember: row.is_member !== false,
  tags: Array.isArray(row.tags) ? (row.tags as unknown[]).map((tag) => String(tag)).filter(Boolean) : [],
  greeting: typeof row.greeting === 'string' ? row.greeting : '',
  closing: typeof row.closing === 'string' ? row.closing : ''
});

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
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return new Response('Supabase not configured', { status: 500 });
  }

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true });

  if (error) {
    console.error('[members/api] GET failed', error);
    return new Response('Failed to load members', { status: 500 });
  }

  const members = (data ?? []).map((row) => rowToMember(row as Record<string, unknown>));

  return new Response(JSON.stringify(members), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ request }) => {
  if (!requireToken(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return new Response('Supabase not configured', { status: 500 });
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

  const { data, error } = await supabase
    .from('members')
    .insert({
      first_name: parsed.firstName.trim(),
      last_name: parsed.lastName.trim(),
      email: parsed.email?.trim() || null,
      is_member: parsed.isMember ?? true,
      tags: parsed.tags ?? [],
      greeting: parsed.greeting?.trim() || null,
      closing: parsed.closing?.trim() || null
    })
    .select()
    .single();

  if (error || !data) {
    console.error('[members/api] POST failed', error);
    return new Response(JSON.stringify({ error: 'Failed to save member' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const member = rowToMember(data as Record<string, unknown>);

  return new Response(JSON.stringify(member), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  if (!requireToken(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return new Response('Supabase not configured', { status: 500 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id')?.trim();
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { error } = await supabase.from('members').delete().eq('id', id);
  if (error) {
    console.error('[members/api] DELETE failed', error);
    return new Response(JSON.stringify({ error: 'Failed to delete member' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true, id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
