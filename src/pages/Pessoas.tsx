import { Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/shared/ConfirmDelete";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormDialog, type Field } from "@/components/shared/FormDialog";
import { ListCard, ListRow } from "@/components/shared/ListCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { RowActions } from "@/components/shared/RowActions";
import { useCreate, useList, useRemove, useUpdate } from "@/hooks/use-data";
import { useCrudState } from "@/hooks/use-crud-state";
import type { Insert, Pessoa } from "@/lib/types";

const fields: Field[] = [
  { name: "nome", label: "Nome", type: "text", required: true, full: true },
  { name: "relacao", label: "Relação", type: "text", placeholder: "Ex.: Titular, Cônjuge, Filho, Amigo" },
  { name: "cor", label: "Cor", type: "color" },
];

export default function Pessoas() {
  const { data = [] } = useList("pessoas");
  const { data: transacoes = [] } = useList("transacoes");
  const create = useCreate("pessoas");
  const update = useUpdate("pessoas");
  const remove = useRemove("pessoas");
  const crud = useCrudState<Pessoa>();

  const sorted = [...data].sort((a, b) => a.nome.localeCompare(b.nome));
  const novo = (
    <Button onClick={crud.openNew}>
      <Plus /> Nova pessoa
    </Button>
  );

  return (
    <>
      <PageHeader title="Pessoas" description="Membros da casa e pessoas com quem você tem valores a pagar ou receber." actions={novo} />
      {sorted.length === 0 ? (
        <EmptyState icon={Users} title="Nenhuma pessoa cadastrada" description="Cadastre quem participa das finanças da casa." action={novo} />
      ) : (
        <ListCard>
          {sorted.map((p) => (
            <ListRow
              key={p.id}
              leading={
                <div className="grid h-9 w-9 place-items-center rounded-full text-sm font-semibold text-white" style={{ background: p.cor }}>
                  {p.nome.slice(0, 1).toUpperCase()}
                </div>
              }
              title={p.nome}
              subtitle={`${p.relacao ?? "Sem relação definida"} · ${transacoes.filter((t) => t.pessoa_id === p.id).length} lançamentos`}
              actions={<RowActions onEdit={() => crud.openEdit(p)} onDelete={() => crud.askDelete(p)} />}
            />
          ))}
        </ListCard>
      )}

      <FormDialog
        open={crud.formOpen}
        onOpenChange={crud.setFormOpen}
        title={crud.editing ? "Editar pessoa" : "Nova pessoa"}
        fields={fields}
        initial={crud.editing ?? { nome: "", relacao: "", cor: "#0ea5e9" }}
        onSubmit={async (v) => {
          const data = v as unknown as Insert<"pessoas">;
          if (crud.editing) await update.mutateAsync({ id: crud.editing.id, data });
          else await create.mutateAsync(data);
          toast.success("Pessoa salva");
        }}
      />
      <ConfirmDelete
        open={!!crud.deleting}
        onOpenChange={(o) => !o && crud.clearDelete()}
        title={`Excluir ${crud.deleting?.nome}?`}
        description="Os lançamentos vinculados continuarão existindo, mas sem pessoa associada."
        onConfirm={() => crud.deleting && remove.mutate(crud.deleting.id)}
      />
    </>
  );
}
