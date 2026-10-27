import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { repository } from "@/data";
import type { Id, Insert, TableName, Update } from "@/lib/types";

function onError(err: unknown) {
  toast.error(err instanceof Error ? err.message : "Algo deu errado");
}

export function useList<T extends TableName>(table: T) {
  return useQuery({ queryKey: [table], queryFn: () => repository.list(table) });
}

export function useCreate<T extends TableName>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Insert<T>) => repository.create(table, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
    onError,
  });
}

export function useCreateMany<T extends TableName>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Insert<T>[]) => repository.createMany(table, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
    onError,
  });
}

export function useUpdate<T extends TableName>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: Id; data: Update<T> }) => repository.update(table, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
    onError,
  });
}

export function useRemove<T extends TableName>(table: T) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: Id) => repository.remove(table, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
    onError,
  });
}

/** Mapa id → registro, útil para exibir nomes de pessoas, categorias etc. */
export function useLookup<T extends TableName>(table: T) {
  const { data = [] } = useList(table);
  return new Map(data.map((r) => [r.id, r]));
}

/** Mutação de regra de negócio que pode tocar várias tabelas: invalida tudo ao final. */
export function useAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: A) => fn(...args),
    onSuccess: () => qc.invalidateQueries(),
    onError,
  });
}
