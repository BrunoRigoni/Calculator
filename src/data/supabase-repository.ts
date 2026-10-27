import type { SupabaseClient } from "@supabase/supabase-js";
import type { Id, Insert, Row, TableName, Update } from "@/lib/types";
import type { Repository } from "./repository";

/**
 * Persistência no Supabase. As tabelas têm RLS por usuário (user_id = auth.uid()),
 * e o user_id é preenchido automaticamente pelo default da coluna.
 */
export class SupabaseRepository implements Repository {
  constructor(private client: SupabaseClient) {}

  async list<T extends TableName>(table: T) {
    const { data, error } = await this.client.from(table).select("*").order("created_at");
    if (error) throw error;
    return data as Row<T>[];
  }

  async create<T extends TableName>(table: T, values: Insert<T>) {
    const { data, error } = await this.client.from(table).insert(values as never).select().single();
    if (error) throw error;
    return data as Row<T>;
  }

  async createMany<T extends TableName>(table: T, values: Insert<T>[]) {
    if (values.length === 0) return [];
    const { data, error } = await this.client.from(table).insert(values as never).select();
    if (error) throw error;
    return data as Row<T>[];
  }

  async update<T extends TableName>(table: T, id: Id, values: Update<T>) {
    const { id: _id, created_at: _c, user_id: _u, ...clean } = values as Record<string, unknown>;
    const { data, error } = await this.client.from(table).update(clean).eq("id", id).select().single();
    if (error) throw error;
    return data as Row<T>;
  }

  async remove<T extends TableName>(table: T, id: Id) {
    const { error } = await this.client.from(table).delete().eq("id", id);
    if (error) throw error;
  }
}
