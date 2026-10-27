import { useState } from "react";
import { Landmark, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDelete } from "@/components/shared/ConfirmDelete";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormDialog, type Field } from "@/components/shared/FormDialog";
import { ListCard, ListRow } from "@/components/shared/ListCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { RowActions } from "@/components/shared/RowActions";
import { useCreate, useList, useRemove, useUpdate } from "@/hooks/use-data";
import { useCrudState } from "@/hooks/use-crud-state";
import type { Insert, Motivo, TipoContrato } from "@/lib/types";

const fields: Field[] = [
  { name: "nome", label: "Motivo", type: "text", required: true, full: true },
  {
    name: "tipo",
    label: "Usado em",
    type: "select",
    required: true,
    full: true,
    options: [
      { value: "financiamento", label: "Financiamento" },
      { value: "emprestimo", label: "Empréstimo" },
    ],
  },
];

export default function Motivos() {
  const [tipo, setTipo] = useState<TipoContrato>("financiamento");
  const { data = [] } = useList("motivos");
  const { data: contratos = [] } = useList("contratos");
  const create = useCreate("motivos");
  const update = useUpdate("motivos");
  const remove = useRemove("motivos");
  const crud = useCrudState<Motivo>();

  const items = data.filter((m) => m.tipo === tipo).sort((a, b) => a.nome.localeCompare(b.nome));
  const novo = (
    <Button onClick={crud.openNew}>
      <Plus /> Novo motivo
    </Button>
  );

  return (
    <>
      <PageHeader title="Motivos" description="Motivos de financiamentos e empréstimos (ex.: imóvel, veículo, reforma)." actions={novo} />
      <Tabs value={tipo} onValueChange={(v) => setTipo(v as TipoContrato)} className="mb-4">
        <TabsList>
          <TabsTrigger value="financiamento">Financiamento</TabsTrigger>
          <TabsTrigger value="emprestimo">Empréstimo</TabsTrigger>
        </TabsList>
      </Tabs>
      {items.length === 0 ? (
        <EmptyState icon={Landmark} title="Nenhum motivo cadastrado" action={novo} />
      ) : (
        <ListCard>
          {items.map((m) => (
            <ListRow
              key={m.id}
              title={m.nome}
              subtitle={`${contratos.filter((c) => c.motivo_id === m.id).length} contrato(s)`}
              actions={<RowActions onEdit={() => crud.openEdit(m)} onDelete={() => crud.askDelete(m)} />}
            />
          ))}
        </ListCard>
      )}

      <FormDialog
        open={crud.formOpen}
        onOpenChange={crud.setFormOpen}
        title={crud.editing ? "Editar motivo" : "Novo motivo"}
        fields={fields}
        initial={crud.editing ?? { nome: "", tipo }}
        onSubmit={async (v) => {
          const data = v as unknown as Insert<"motivos">;
          if (crud.editing) await update.mutateAsync({ id: crud.editing.id, data });
          else await create.mutateAsync(data);
          toast.success("Motivo salvo");
        }}
      />
      <ConfirmDelete
        open={!!crud.deleting}
        onOpenChange={(o) => !o && crud.clearDelete()}
        title={`Excluir o motivo ${crud.deleting?.nome}?`}
        onConfirm={() => crud.deleting && remove.mutate(crud.deleting.id)}
      />
    </>
  );
}
