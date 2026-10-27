import { useState } from "react";
import { Link } from "react-router-dom";
import { Banknote, Building2, CheckCircle2, ChevronDown, Circle, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDelete } from "@/components/shared/ConfirmDelete";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormDialog, type Field, type Values } from "@/components/shared/FormDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { RowActions } from "@/components/shared/RowActions";
import { StatCard } from "@/components/shared/StatCard";
import { actions } from "@/data";
import { useAction, useList, useLookup, useUpdate } from "@/hooks/use-data";
import { useCrudState } from "@/hooks/use-crud-state";
import { formatBRL, formatDate, round2, today } from "@/lib/finance";
import type { Contrato, Insert, TipoContrato, Transacao } from "@/lib/types";
import { cn } from "@/lib/utils";

const TEXTOS = {
  financiamento: {
    titulo: "Financiamentos",
    desc: "Imóvel, veículo e outros bens financiados. As parcelas viram saídas mensais.",
    novo: "Novo financiamento",
    instituicao: "Instituição financeira",
    icon: Building2,
  },
  emprestimo: {
    titulo: "Empréstimos",
    desc: "Empréstimos pessoais, consignados etc. As parcelas viram saídas mensais.",
    novo: "Novo empréstimo",
    instituicao: "Credor (banco ou pessoa)",
    icon: Banknote,
  },
} as const;

export default function Contratos({ tipo }: { tipo: TipoContrato }) {
  const txt = TEXTOS[tipo];
  const { data: todos = [] } = useList("contratos");
  const { data: motivos = [] } = useList("motivos");
  const { data: pessoas = [] } = useList("pessoas");
  const { data: categorias = [] } = useList("categorias");
  const { data: transacoes = [] } = useList("transacoes");
  const motivosMap = useLookup("motivos");
  const pessoasMap = useLookup("pessoas");
  const criar = useAction(actions.criarContrato);
  const atualizar = useAction(actions.atualizarContrato);
  const remover = useAction(actions.removerContrato);
  const updateTx = useUpdate("transacoes");
  const crud = useCrudState<Contrato>();
  const [aberto, setAberto] = useState<string | null>(null);

  const contratos = todos.filter((c) => c.tipo === tipo);
  const parcelasDe = (id: string) => transacoes.filter((t) => t.contrato_id === id).sort((a, b) => (a.parcela ?? 0) - (b.parcela ?? 0));
  const totalPendente = contratos.reduce((s, c) => s + parcelasDe(c.id).filter((p) => p.status === "pendente").reduce((x, p) => x + Number(p.valor), 0), 0);
  const parcelaMensal = contratos.reduce((s, c) => (parcelasDe(c.id).some((p) => p.status === "pendente") ? s + Number(c.valor_parcela) : s), 0);

  const fields: Field[] = [
    { name: "descricao", label: "Descrição", type: "text", required: true, full: true, placeholder: tipo === "financiamento" ? "Ex.: Apartamento Centro" : "Ex.: Empréstimo consignado" },
    {
      name: "motivo_id",
      label: "Motivo",
      type: "select",
      required: true,
      options: motivos.filter((m) => m.tipo === tipo).map((m) => ({ value: m.id, label: m.nome })),
      hint: "Gerencie a lista em Cadastros › Motivos.",
    },
    { name: "instituicao", label: txt.instituicao, type: "text" },
    { name: "pessoa_id", label: "Responsável", type: "select", options: pessoas.map((p) => ({ value: p.id, label: p.nome, color: p.cor })) },
    {
      name: "categoria_id",
      label: "Categoria das parcelas",
      type: "select",
      options: categorias.filter((c) => c.tipo === "saida").map((c) => ({ value: c.id, label: c.nome, color: c.cor })),
    },
    { name: "valor_total", label: "Valor total", type: "money", required: true },
    { name: "num_parcelas", label: "Nº de parcelas", type: "integer", required: true },
    { name: "valor_parcela", label: "Valor da parcela", type: "money", required: true, hint: "Calculado pelo total ÷ parcelas; ajuste se houver juros." },
    { name: "data_inicio", label: "1ª parcela", type: "date", required: true },
    { name: "observacao", label: "Observação", type: "textarea" },
    {
      name: "gerar",
      label: crud.editing ? "Recalcular parcelas pendentes" : "Lançar parcelas em Entradas e saídas",
      type: "switch",
      full: true,
      hint: crud.editing ? "Parcelas já pagas são mantidas." : undefined,
    },
  ];

  const derive = (v: Values, changed: string): Values => {
    if (changed !== "valor_total" && changed !== "num_parcelas") return {};
    const total = Number(v.valor_total);
    const n = Number(v.num_parcelas);
    return total > 0 && n >= 1 ? { valor_parcela: String(round2(total / n)) } : {};
  };

  const initial: Values = crud.editing
    ? { ...crud.editing, gerar: false }
    : {
        descricao: "",
        motivo_id: motivos.find((m) => m.tipo === tipo)?.id ?? "",
        instituicao: "",
        pessoa_id: "",
        categoria_id: categorias.find((c) => c.tipo === "saida")?.id ?? "",
        valor_total: "",
        num_parcelas: "12",
        valor_parcela: "",
        data_inicio: today(),
        observacao: "",
        gerar: true,
      };

  const novo = (
    <Button onClick={crud.openNew}>
      <Plus /> {txt.novo}
    </Button>
  );

  return (
    <>
      <PageHeader title={txt.titulo} description={txt.desc} actions={novo} />

      {contratos.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatCard label="Saldo devedor" value={formatBRL(totalPendente)} icon={txt.icon} tone="expense" hint={`${contratos.length} contrato(s)`} />
          <StatCard label="Parcelas por mês" value={formatBRL(parcelaMensal)} icon={txt.icon} />
        </div>
      )}

      {contratos.length === 0 ? (
        <EmptyState icon={txt.icon} title={`Nenhum ${tipo === "financiamento" ? "financiamento" : "empréstimo"} cadastrado`} action={novo} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {contratos.map((c) => {
            const parcelas = parcelasDe(c.id);
            const pagas = parcelas.filter((p) => p.status === "confirmado");
            const pct = c.num_parcelas ? Math.round((pagas.length / c.num_parcelas) * 100) : 0;
            const proxima = parcelas.find((p) => p.status === "pendente");
            const motivo = c.motivo_id ? motivosMap.get(c.motivo_id) : undefined;
            const pes = c.pessoa_id ? pessoasMap.get(c.pessoa_id) : undefined;
            return (
              <Card key={c.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold">{c.descricao}</h3>
                      {motivo && <Badge variant="secondary">{motivo.nome}</Badge>}
                      {pct === 100 && <Badge variant="success">quitado</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{[c.instituicao, pes?.nome].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                  <RowActions onEdit={() => crud.openEdit(c)} onDelete={() => crud.askDelete(c)} />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold tabular-nums">{formatBRL(Number(c.valor_total))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Parcela</p>
                    <p className="font-semibold tabular-nums">{formatBRL(Number(c.valor_parcela))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Próxima</p>
                    <p className="font-semibold">{proxima ? formatDate(proxima.data) : "—"}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>
                      {pagas.length} de {c.num_parcelas} pagas
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {parcelas.length > 0 ? (
                  <>
                    <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => setAberto(aberto === c.id ? null : c.id)}>
                      <ChevronDown className={cn("transition-transform", aberto === c.id && "rotate-180")} />
                      {aberto === c.id ? "Ocultar parcelas" : "Ver parcelas"}
                    </Button>
                    {aberto === c.id && <Parcelas parcelas={parcelas} onToggle={(p) => updateTx.mutate({ id: p.id, data: { status: p.status === "confirmado" ? "pendente" : "confirmado" } })} />}
                  </>
                ) : (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Parcelas não lançadas. Edite e ative “Recalcular parcelas” ou registre em{" "}
                    <Link to="/lancamentos" className="underline">
                      Entradas e saídas
                    </Link>
                    .
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <FormDialog
        open={crud.formOpen}
        onOpenChange={crud.setFormOpen}
        title={crud.editing ? `Editar ${tipo === "financiamento" ? "financiamento" : "empréstimo"}` : txt.novo}
        fields={fields}
        initial={initial}
        derive={derive}
        onSubmit={async (v) => {
          const { gerar, ...rest } = v;
          const data = { ...rest, tipo } as Insert<"contratos">;
          if (crud.editing) await atualizar.mutateAsync([crud.editing.id, data, Boolean(gerar)]);
          else await criar.mutateAsync([data, Boolean(gerar)]);
          toast.success("Salvo");
        }}
      />
      <ConfirmDelete
        open={!!crud.deleting}
        onOpenChange={(o) => !o && crud.clearDelete()}
        title={`Excluir "${crud.deleting?.descricao}"?`}
        description="Todas as parcelas deste contrato (pagas e pendentes) também serão excluídas de Entradas e saídas."
        onConfirm={() => crud.deleting && remover.mutate([crud.deleting.id])}
      />
    </>
  );
}

function Parcelas({ parcelas, onToggle }: { parcelas: Transacao[]; onToggle: (p: Transacao) => void }) {
  return (
    <div className="mt-2 max-h-72 divide-y overflow-y-auto rounded-lg border">
      {parcelas.map((p) => {
        const pago = p.status === "confirmado";
        return (
          <button key={p.id} onClick={() => onToggle(p)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent/50">
            {pago ? <CheckCircle2 className="h-4 w-4 text-income" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
            <span className="w-12 text-xs text-muted-foreground">#{p.parcela}</span>
            <span className="flex-1">{formatDate(p.data)}</span>
            <span className={cn("tabular-nums", pago && "text-muted-foreground line-through")}>{formatBRL(Number(p.valor))}</span>
          </button>
        );
      })}
    </div>
  );
}
