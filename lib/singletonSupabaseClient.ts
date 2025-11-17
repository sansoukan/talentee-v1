import { createClient } from "@supabase/supabase-js";

/**
 * ======================================================
 * 🔐 singletonSupabaseClient.ts — Instance unique Supabase
 * ------------------------------------------------------
 * Empêche la création multiple de GoTrueClient (hot reload)
 * et garantit que l’auth persiste correctement.
 * ======================================================
 */

const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createClient> | undefined;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase =
  globalForSupabase.supabase ??
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // ✅ restaure la session après Stripe/redirections
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabase = supabase;
}
