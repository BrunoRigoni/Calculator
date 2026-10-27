import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { LocalRepository } from "./local-repository";
import type { Repository } from "./repository";
import { SupabaseRepository } from "./supabase-repository";
import { createActions } from "./actions";

export const backend: "supabase" | "local" = isSupabaseConfigured ? "supabase" : "local";

export const repository: Repository = supabase ? new SupabaseRepository(supabase) : new LocalRepository();

export type { Repository };

export const actions = createActions(repository);
