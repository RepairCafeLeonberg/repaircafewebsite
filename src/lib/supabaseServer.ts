import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.SUPABASE_URL;
const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const getSupabaseServiceClient = (): SupabaseClient | null => {
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
};
