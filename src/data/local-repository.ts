import type { Id, Insert, Row, TableName, Update } from "@/lib/types";
import type { Repository } from "./repository";
import { DEFAULT_CATEGORIAS, DEFAULT_MOTIVOS } from "./seed";

const PREFIX = "fin-casa:v1:";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Persistência no localStorage do navegador — usada quando o Supabase não está configurado. */
export class LocalRepository implements Repository {
  constructor(private storage: Storage = window.localStorage) {
    this.seed();
  }

  private read<T extends TableName>(table: T): Row<T>[] {
    try {
      const raw = this.storage.getItem(PREFIX + table);
      return raw ? (JSON.parse(raw) as Row<T>[]) : [];
    } catch {
      return [];
    }
  }

  private write<T extends TableName>(table: T, rows: Row<T>[]) {
    this.storage.setItem(PREFIX + table, JSON.stringify(rows));
  }

  private seed() {
    if (this.storage.getItem(PREFIX + "seeded")) return;
    this.insert("categorias", DEFAULT_CATEGORIAS);
    this.insert("motivos", DEFAULT_MOTIVOS);
    this.storage.setItem(PREFIX + "seeded", "1");
  }

  private insert<T extends TableName>(table: T, data: Insert<T>[]): Row<T>[] {
    const now = new Date().toISOString();
    const created = data.map((d) => ({ ...d, id: uuid(), created_at: now }) as Row<T>);
    this.write(table, [...this.read(table), ...created]);
    return created;
  }

  async list<T extends TableName>(table: T) {
    return this.read(table);
  }

  async create<T extends TableName>(table: T, data: Insert<T>) {
    return this.insert(table, [data])[0];
  }

  async createMany<T extends TableName>(table: T, data: Insert<T>[]) {
    return this.insert(table, data);
  }

  async update<T extends TableName>(table: T, id: Id, data: Update<T>) {
    const rows = this.read(table);
    const idx = rows.findIndex((r) => r.id === id);
    if (idx < 0) throw new Error("Registro não encontrado");
    const { id: _id, created_at: _c, ...clean } = data as Record<string, unknown>;
    rows[idx] = { ...rows[idx], ...clean };
    this.write(table, rows);
    return rows[idx];
  }

  async remove<T extends TableName>(table: T, id: Id) {
    this.write(
      table,
      this.read(table).filter((r) => r.id !== id),
    );
  }
}
