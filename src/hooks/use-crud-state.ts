import { useState } from "react";

/** Estado padrão de telas de cadastro: diálogo de criação/edição e confirmação de exclusão. */
export function useCrudState<T>() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);

  return {
    formOpen,
    editing,
    deleting,
    setFormOpen,
    openNew: () => {
      setEditing(null);
      setFormOpen(true);
    },
    openEdit: (item: T) => {
      setEditing(item);
      setFormOpen(true);
    },
    askDelete: setDeleting,
    clearDelete: () => setDeleting(null),
  };
}
