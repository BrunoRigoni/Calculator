import { Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function RowActions({ onEdit, onDelete, children }: { onEdit?: () => void; onDelete?: () => void; children?: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      {children}
      {onEdit && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} aria-label="Editar">
          <Pencil />
        </Button>
      )}
      {onDelete && (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete} aria-label="Excluir">
          <Trash2 />
        </Button>
      )}
    </div>
  );
}
