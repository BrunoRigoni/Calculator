import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Mesmo caminho/convenção usados pela Lovable ao conectar o Supabase.
// Sem variáveis de ambiente, o app funciona em modo local (localStorage).
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
      auth: { storage: localStorage, persistSession: true, autoRefreshToken: true },
    })
  : null;
