import { useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Copy, Plus, Receipt, RotateCcw } from "lucide-react";
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
import { formatBRL, formatDate, today } from "@/lib/finance";
import type { Boleto, Insert } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filtro = "pendente" | "pago" | "todos";

export default function Boletos() {
  const [filtro, setFiltro] = useState<Filtro>("pendente");
  const { data = [] } = useList("boletos");
  const { data: categorias = [] } = useList("categorias");
  const { data: pessoas = [] } = useList("pessoas");
  const pessoasMap = useLookup("pessoas");
  const create = useCreate("boletos");
  const update = useUpdate("boletos");
  const remove = useRemove("boletos");
  const pagar = useAction(actions.pagarBoleto);
  const estornar = useAction(actions.estornarBoleto);
  const crud = useCrudState<Boleto>();
  const [pagando, setPagando] = useState<Boleto | null>(null);

  const hoje = today();
  const items = data
    .filter((b) => filtro === "todos" || b.status === filtro)
    .sort((a, b) => (filtro === "pago" ? b.vencimento.localeCompare(a.vencimento) : a.vencimento.localeCompare(b.vencimento)));
  const pendentes = data.filter((b) => b.status === "pendente");
  const vencidos = pendentes.filter((b) => b.vencimento < hoje);

  const fields: Field[] = [
    { name: "descricao", label: "Descrição", type: "text", required: true, full: true, placeholder: "Ex.: Conta de luz" },
    { name: "valor", label: "Valor", type: "money", required: true },
    { name: "vencimento", label: "Vencimento", type: "date", required: true },
    { name: "beneficiario", label: "Beneficiário", type: "text", placeholder: "Ex.: Enel" },
    {
      name: "categoria_id",
      label: "Categoria",
      type: "select",
      options: categorias.filter((c) => c.tipo === "saida").map((c) => ({ value: c.id, label: c.nome, color: c.cor })),
    },
    { name: "pessoa_id", label: "Responsável", type: "select", options: pessoas.map((p) => ({ value: p.id, label: p.nome, color: p.cor })) },
    { name: "codigo_barras", label: "Código de barras / linha digitável", type: "text", full: true },
  ];

  const novo = (
    <Button onClick={crud.openNew}>
      <Plus /> Novo boleto
    </Button>
  );

  return (
    <>
      <PageHeader title="Boletos" description="Contas a pagar por boleto. Ao pagar, a saída é lançada automaticamente." actions={novo} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="A pagar" value={formatBRL(pendentes.reduce((s, b) => s + Number(b.valor), 0))} icon={CalendarClock} tone="expense" hint={`${pendentes.length} boleto(s)`} />
        <StatCard label="Vencidos" value={formatBRL(vencidos.reduce((s, b) => s + Number(b.valor), 0))} icon={AlertTriangle} tone="expense" hint={`${vencidos.length} boleto(s)`} />
      </div>

      <Tabs value={filtro} onValueChange={(v) => setFiltro(v as Filtro)} className="mb-4">
        <TabsList>
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          <TabsTrigger value="pago">Pagos</TabsTrigger>
          <TabsTrigger value="todos">Todos</TabsTrigger>
        </TabsList>
      </Tabs>

      {items.length === 0 ? (
        <EmptyState icon={Receipt} title="Nenhum boleto aqui" description="Cadastre boletos para não perder vencimentos." action={novo} />
      ) : (
        <ListCard>
          {items.map((b) => {
            const vencido = b.status === "pendente" && b.vencimento < hoje;
            const pes = b.pessoa_id ? pessoasMap.get(b.pessoa_id) : undefined;
            return (
              <ListRow
                key={b.id}
                leading={
                  <div className={cn("rounded-lg p-2", b.status === "pago" ? "bg-income/10 text-income" : vencido ? "bg-expense/10 text-expense" : "bg-muted text-muted-foreground")}>
                    <Receipt className="h-4 w-4" />
                  </div>
                }
                title={
                  <span className="flex items-center gap-2">
                    {b.descricao}
                    {b.status === "pago" ? <Badge variant="success">pago</Badge> : vencido ? <Badge variant="destructive">vencido</Badge> : null}
                  </span>
                }
                subtitle={[
                  b.status === "pago" ? `Pago em ${formatDate(b.data_pagamento)}` : `Vence em ${formatDate(b.vencimento)}`,
                  b.beneficiario,
                  pes?.nome,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                trailing={<span className="text-sm font-semibold tabular-nums">{formatBRL(Number(b.valor))}</span>}
                actions={
                  <RowActions onEdit={() => crud.openEdit(b)} onDelete={() => crud.askDelete(b)}>
                    {b.codigo_barras && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Copiar código de barras"
                        onClick={() => navigator.clipboard?.writeText(b.codigo_barras!).then(() => toast.success("Código copiado"))}
                      >
                        <Copy />
                      </Button>
                    )}
                    {b.status === "pendente" ? (
                      <Button size="sm" variant="outline" className="h-8" onClick={() => setPagando(b)}>
                        <CheckCircle2 /> Pagar
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Desfazer pagamento" onClick={() => estornar.mutate([b])}>
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
        title={crud.editing ? "Editar boleto" : "Novo boleto"}
        fields={fields}
        initial={
          crud.editing ?? {
            descricao: "",
            valor: "",
            vencimento: today(),
            beneficiario: "",
            categoria_id: categorias.find((c) => c.tipo === "saida")?.id ?? "",
            pessoa_id: "",
            codigo_barras: "",
          }
        }
        onSubmit={async (v) => {
          if (crud.editing) await update.mutateAsync({ id: crud.editing.id, data: v as Partial<Boleto> });
          else await create.mutateAsync({ ...(v as unknown as Insert<"boletos">), status: "pendente", data_pagamento: null });
          toast.success("Boleto salvo");
        }}
      />

      <FormDialog
        open={!!pagando}
        onOpenChange={(o) => !o && setPagando(null)}
        title="Registrar pagamento"
        description={pagando ? `${pagando.descricao} — ${formatBRL(Number(pagando.valor))}` : undefined}
        fields={[{ name: "data", label: "Data do pagamento", type: "date", required: true, full: true }]}
        initial={{ data: today() }}
        submitLabel="Confirmar pagamento"
        onSubmit={async (v) => {
          if (!pagando) return;
          await pagar.mutateAsync([pagando, v.data as string]);
          toast.success("Boleto pago e saída lançada");
        }}
      />

      <ConfirmDelete
        open={!!crud.deleting}
        onOpenChange={(o) => !o && crud.clearDelete()}
        title={`Excluir o boleto ${crud.deleting?.descricao}?`}
        description="Se já foi pago, a saída lançada continuará em Entradas e saídas."
        onConfirm={() => crud.deleting && remove.mutate(crud.deleting.id)}
      />
    </>
  );
}
