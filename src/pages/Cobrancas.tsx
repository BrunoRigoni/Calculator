import { useState } from "react";
import { AlertTriangle, CheckCircle2, HandCoins, Plus, RotateCcw, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDelete } from "@/components/shared/ConfirmDelete";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormDialog, type Field } from "@/components/shared/FormDialog";
import { ListCard, ListRow } from "@/components/shared/ListCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { RowActions } from "@/components/shared/RowActions";
import { StatCard } from "@/components/shared/StatCard";
import { actions } from "@/data";
import { useAction, useCreate, useList, useLookup, useRemove, useUpdate } from "@/hooks/use-data";
import { useCrudState } from "@/hooks/use-crud-state";
import { formatBRL, formatDate, monthKey, today } from "@/lib/finance";
import type { Cobranca, Insert } from "@/lib/types";

type Filtro = "pendente" | "recebido" | "todos";

export default function Cobrancas() {
  const [filtro, setFiltro] = useState<Filtro>("pendente");
  const { data = [] } = useList("cobrancas");
  const { data: pessoas = [] } = useList("pessoas");
  const { data: categorias = [] } = useList("categorias");
  const pessoasMap = useLookup("pessoas");
  const create = useCreate("cobrancas");
  const update = useUpdate("cobrancas");
  const remove = useRemove("cobrancas");
  const receber = useAction(actions.receberCobranca);
  const estornar = useAction(actions.estornarCobranca);
  const crud = useCrudState<Cobranca>();
  const [recebendo, setRecebendo] = useState<Cobranca | null>(null);

  const hoje = today();
  const items = data
    .filter((c) => filtro === "todos" || c.status === filtro)
    .sort((a, b) => a.data_prevista.localeCompare(b.data_prevista));
  const pendentes = data.filter((c) => c.status === "pendente");
  const atrasados = pendentes.filter((c) => c.data_prevista < hoje);
  const recebidoMes = data.filter((c) => c.status === "recebido" && c.data_recebimento && monthKey(c.data_recebimento) === monthKey(hoje));
  const soma = (xs: Cobranca[]) => xs.reduce((s, c) => s + Number(c.valor), 0);
  const categoriasEntrada = categorias.filter((c) => c.tipo === "entrada");

  const fields: Field[] = [
    { name: "descricao", label: "Descrição", type: "text", required: true, full: true, placeholder: "Ex.: Empréstimo para o João" },
    { name: "pessoa_id", label: "Quem deve", type: "select", options: pessoas.map((p) => ({ value: p.id, label: p.nome, color: p.cor })) },
    { name: "valor", label: "Valor", type: "money", required: true },
    { name: "data_prevista", label: "Data para receber", type: "date", required: true },
    { name: "observacao", label: "Observação", type: "textarea" },
  ];

  const novo = (
    <Button onClick={crud.openNew}>
      <Plus /> Novo valor a receber
    </Button>
  );

  return (
    <>
      <PageHeader title="Valores a cobrar / receber" description="Controle quem te deve e quando. Ao receber, a entrada é lançada automaticamente." actions={novo} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="A receber" value={formatBRL(soma(pendentes))} icon={HandCoins} tone="income" hint={`${pendentes.length} pendente(s)`} />
        <StatCard label="Atrasados" value={formatBRL(soma(atrasados))} icon={AlertTriangle} tone="expense" hint={`${atrasados.length} atrasado(s)`} />
        <StatCard label="Recebido no mês" value={formatBRL(soma(recebidoMes))} icon={TrendingUp} tone="income" />
      </div>

      <Tabs value={filtro} onValueChange={(v) => setFiltro(v as Filtro)} className="mb-4">
        <TabsList>
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          <TabsTrigger value="recebido">Recebidos</TabsTrigger>
          <TabsTrigger value="todos">Todos</TabsTrigger>
        </TabsList>
      </Tabs>

      {items.length === 0 ? (
        <EmptyState icon={HandCoins} title="Nada por aqui" description="Cadastre valores que alguém precisa te pagar." action={novo} />
      ) : (
        <ListCard>
          {items.map((c) => {
            const pes = c.pessoa_id ? pessoasMap.get(c.pessoa_id) : undefined;
            const atrasado = c.status === "pendente" && c.data_prevista < hoje;
            return (
              <ListRow
                key={c.id}
                leading={
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold text-white" style={{ background: pes?.cor ?? "#94a3b8" }}>
                    {(pes?.nome ?? "?").slice(0, 1).toUpperCase()}
                  </div>
                }
                title={
                  <span className="flex items-center gap-2">
                    {c.descricao}
                    {c.status === "recebido" ? <Badge variant="success">recebido</Badge> : atrasado ? <Badge variant="destructive">atrasado</Badge> : null}
                  </span>
                }
                subtitle={[
                  pes?.nome ?? "Sem pessoa",
                  c.status === "recebido" ? `Recebido em ${formatDate(c.data_recebimento)}` : `Previsto para ${formatDate(c.data_prevista)}`,
                ].join(" · ")}
                trailing={<span className="text-sm font-semibold tabular-nums text-income">{formatBRL(Number(c.valor))}</span>}
                actions={
                  <RowActions onEdit={() => crud.openEdit(c)} onDelete={() => crud.askDelete(c)}>
                    {c.status === "pendente" ? (
                      <Button size="sm" variant="outline" className="h-8" onClick={() => setRecebendo(c)}>
                        <CheckCircle2 /> Receber
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Desfazer recebimento" onClick={() => estornar.mutate([c])}>
                        <RotateCcw />
                      </Button>
                    )}
                  </RowActions>
                }
              />
            );
          })}
        </ListCard>
      )}

      <FormDialog
        open={crud.formOpen}
        onOpenChange={crud.setFormOpen}
        title={crud.editing ? "Editar valor a receber" : "Novo valor a receber"}
        fields={fields}
        initial={crud.editing ?? { descricao: "", pessoa_id: "", valor: "", data_prevista: today(), observacao: "" }}
        onSubmit={async (v) => {
          if (crud.editing) await update.mutateAsync({ id: crud.editing.id, data: v as Partial<Cobranca> });
          else await create.mutateAsync({ ...(v as unknown as Insert<"cobrancas">), status: "pendente", data_recebimento: null });
          toast.success("Valor a receber salvo");
        }}
      />

      <FormDialog
        open={!!recebendo}
        onOpenChange={(o) => !o && setRecebendo(null)}
        title="Registrar recebimento"
        description={recebendo ? `${recebendo.descricao} — ${formatBRL(Number(recebendo.valor))}` : undefined}
        fields={[
          { name: "data", label: "Data do recebimento", type: "date", required: true },
          { name: "categoria_id", label: "Categoria da entrada", type: "select", options: categoriasEntrada.map((c) => ({ value: c.id, label: c.nome, color: c.cor })) },
        ]}
        initial={{ data: today(), categoria_id: "" }}
        submitLabel="Confirmar recebimento"
        onSubmit={async (v) => {
          if (!recebendo) return;
          await receber.mutateAsync([recebendo, v.data as string, (v.categoria_id as string | null) ?? null]);
          toast.success("Recebido! Entrada lançada.");
        }}
      />

      <ConfirmDelete
        open={!!crud.deleting}
        onOpenChange={(o) => !o && crud.clearDelete()}
        title={`Excluir "${crud.deleting?.descricao}"?`}
        description="Se já foi recebido, a entrada lançada continuará em Entradas e saídas."
        onConfirm={() => crud.deleting && remove.mutate(crud.deleting.id)}
      />
    </>
  );
}
