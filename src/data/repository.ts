import type { Id, Insert, Row, TableName, Update } from "@/lib/types";

/**
 * Contrato único de persistência. A UI só conhece esta interface, então trocar
 * o armazenamento local pelo Supabase (ou outro backend) não exige mudar telas.
 */
export interface Repository {
  list<T extends TableName>(table: T): Promise<Row<T>[]>;
  create<T extends TableName>(table: T, data: Insert<T>): Promise<Row<T>>;
  createMany<T extends TableName>(table: T, data: Insert<T>[]): Promise<Row<T>[]>;
  update<T extends TableName>(table: T, id: Id, data: Update<T>): Promise<Row<T>>;
  remove<T extends TableName>(table: T, id: Id): Promise<void>;
}
