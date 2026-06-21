import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Server‑side Supabase client that uses the service‑role (secret) key.
 * This client bypasses RLS and should only be used in API routes or server actions.
 */
export function createAdminSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase URL or SERVICE_ROLE_KEY is missing in environment variables');
  }

  // The admin client does not need session persistence.
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
