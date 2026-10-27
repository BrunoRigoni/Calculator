import { useState } from "react";
import { Plus, Tags } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorDot } from "@/components/shared/ColorDot";
import { ConfirmDelete } from "@/components/shared/ConfirmDelete";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormDialog, type Field } from "@/components/shared/FormDialog";
import { ListCard, ListRow } from "@/components/shared/ListCard";
import { MonthPicker } from "@/components/shared/MonthPicker";
import { PageHeader } from "@/components/shared/PageHeader";
import { RowActions } from "@/components/shared/RowActions";
import { useCreate, useList, useRemove, useUpdate } from "@/hooks/use-data";
import { useCrudState } from "@/hooks/use-crud-state";
import { doMes, formatBRL, monthKey, today } from "@/lib/finance";
import type { Categoria, Insert, TipoMovimento } from "@/lib/types";

const fields: Field[] = [
  { name: "nome", label: "Nome", type: "text", required: true, full: true },
  {
    name: "tipo",
    label: "Tipo",
    type: "select",
    required: true,
    options: [
      { value: "entrada", label: "Entrada" },
      { value: "saida", label: "Saída" },
    ],
  },
  { name: "cor", label: "Cor", type: "color" },
];

export default function Categorias() {
  const [tipo, setTipo] = useState<TipoMovimento>("saida");
  const [mes, setMes] = useState(monthKey(today()));
  const { data = [] } = useList("categorias");
  const { data: transacoes = [] } = useList("transacoes");
  const create = useCreate("categorias");
  const update = useUpdate("categorias");
  const remove = useRemove("categorias");
  const crud = useCrudState<Categoria>();

  const items = data.filter((c) => c.tipo === tipo).sort((a, b) => a.nome.localeCompare(b.nome));
  const doMesAtual = doMes(transacoes, mes);
  const novo = (
    <Button onClick={crud.openNew}>
      <Plus /> Nova categoria
    </Button>
  );

  return (
    <>
      <PageHeader title="Categorias" description="Classifique entradas (ex.: salário, bônus) e saídas (ex.: despesa, investimento)." actions={novo} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tipo} onValueChange={(v) => setTipo(v as TipoMovimento)}>
          <TabsList>
            <TabsTrigger value="saida">Saídas</TabsTrigger>
            <TabsTrigger value="entrada">Entradas</TabsTrigger>
          </TabsList>
        </Tabs>
        <MonthPicker value={mes} onChange={setMes} />
      </div>
      {items.length === 0 ? (
        <EmptyState icon={Tags} title="Nenhuma categoria" action={novo} />
      ) : (
        <ListCard>
          {items.map((c) => {
            const total = doMesAtual.filter((t) => t.categoria_id === c.id).reduce((s, t) => s + Number(t.valor), 0);
            return (
              <ListRow
                key={c.id}
                leading={<ColorDot color={c.cor} className="h-3 w-3" />}
                title={c.nome}
                subtitle={c.tipo === "entrada" ? "Entrada" : "Saída"}
                trailing={<span className="text-sm font-semibold tabular-nums">{formatBRL(total)}</span>}
                actions={<RowActions onEdit={() => crud.openEdit(c)} onDelete={() => crud.askDelete(c)} />}
              />
            );
          })}
        </ListCard>
      )}

      <FormDialog
        open={crud.formOpen}
        onOpenChange={crud.setFormOpen}
        title={crud.editing ? "Editar categoria" : "Nova categoria"}
        fields={fields}
        initial={crud.editing ?? { nome: "", tipo, cor: tipo === "entrada" ? "#10b981" : "#f97316" }}
        onSubmit={async (v) => {
          const data = v as unknown as Insert<"categorias">;
          if (crud.editing) await update.mutateAsync({ id: crud.editing.id, data });
          else await create.mutateAsync(data);
          toast.success("Categoria salva");
        }}
      />
      <ConfirmDelete
        open={!!crud.deleting}
        onOpenChange={(o) => !o && crud.clearDelete()}
        title={`Excluir a categoria ${crud.deleting?.nome}?`}
        description="Os lançamentos desta categoria ficarão sem categoria."
        onConfirm={() => crud.deleting && remove.mutate(crud.deleting.id)}
      />
    </>
  );
}
