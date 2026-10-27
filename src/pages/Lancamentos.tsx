import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowDownCircle, ArrowLeftRight, ArrowUpCircle, CheckCircle2, Circle, Search, Wallet, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransacaoDialog } from "@/components/forms/TransacaoDialog";
import { ColorDot } from "@/components/shared/ColorDot";
import { ConfirmDelete } from "@/components/shared/ConfirmDelete";
import { EmptyState } from "@/components/shared/EmptyState";
import { MonthPicker } from "@/components/shared/MonthPicker";
import { PageHeader } from "@/components/shared/PageHeader";
import { RowActions } from "@/components/shared/RowActions";
import { StatCard } from "@/components/shared/StatCard";
import { useList, useLookup, useRemove, useUpdate } from "@/hooks/use-data";
import { useCrudState } from "@/hooks/use-crud-state";
import { doMes, formatBRL, formatDate, monthKey, resumir, today } from "@/lib/finance";
import { FORMAS_PAGAMENTO, type TipoMovimento, type Transacao } from "@/lib/types";
import { cn } from "@/lib/utils";

const ALL = "__all__";
const formaLabel = new Map(FORMAS_PAGAMENTO.map((f) => [f.value, f.label]));

export default function Lancamentos() {
  const [params, setParams] = useSearchParams();
  const mes = params.get("mes") ?? monthKey(today());
  const aba = (params.get("tipo") as TipoMovimento | null) ?? "todos";
  const pessoa = params.get("pessoa") ?? ALL;
  const categoria = params.get("categoria") ?? ALL;
  const cartao = params.get("cartao");
  const [busca, setBusca] = useState("");

  const setParam = (key: string, value: string | null) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === null || value === ALL || value === "todos") next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );

  const { data: transacoes = [], isLoading } = useList("transacoes");
  const { data: pessoas = [] } = useList("pessoas");
  const { data: categorias = [] } = useList("categorias");
  const pessoasMap = useLookup("pessoas");
  const categoriasMap = useLookup("categorias");
  const cartoesMap = useLookup("cartoes");
  const update = useUpdate("transacoes");
  const remove = useRemove("transacoes");
  const crud = useCrudState<Transacao>();
  const [novoTipo, setNovoTipo] = useState<TipoMovimento>("saida");

  const doMesAtual = useMemo(() => doMes(transacoes, mes), [transacoes, mes]);
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return doMesAtual
      .filter((t) => aba === "todos" || t.tipo === aba)
      .filter((t) => pessoa === ALL || t.pessoa_id === pessoa)
      .filter((t) => categoria === ALL || t.categoria_id === categoria)
      .filter((t) => !cartao || t.cartao_id === cartao)
      .filter((t) => !q || t.descricao.toLowerCase().includes(q))
      .sort((a, b) => b.data.localeCompare(a.data) || b.created_at.localeCompare(a.created_at));
  }, [doMesAtual, aba, pessoa, categoria, cartao, busca]);

  const resumo = resumir(filtrados);
  const grupos = useMemo(() => {
    const m = new Map<string, Transacao[]>();
    for (const t of filtrados) m.set(t.data, [...(m.get(t.data) ?? []), t]);
    return [...m.entries()];
  }, [filtrados]);

  const novo = (tipo: TipoMovimento) => {
    setNovoTipo(tipo);
    crud.openNew();
  };

  return (
    <>
      <PageHeader
        title="Entradas e saídas"
        description="Todos os valores que entram e saem da casa."
        actions={
          <>
            <Button variant="outline" onClick={() => novo("entrada")} className="border-income/40 text-income hover:text-income">
              <ArrowUpCircle /> Entrada
            </Button>
            <Button onClick={() => novo("saida")} className="bg-expense hover:bg-expense/90">
              <ArrowDownCircle /> Saída
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <MonthPicker value={mes} onChange={(m) => setParam("mes", m)} />
        <Tabs value={aba} onValueChange={(v) => setParam("tipo", v)}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="entrada">Entradas</TabsTrigger>
            <TabsTrigger value="saida">Saídas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Entradas" value={formatBRL(resumo.entradas)} icon={ArrowUpCircle} tone="income" hint={resumo.entradasPendentes ? `+ ${formatBRL(resumo.entradasPendentes)} a receber` : undefined} />
        <StatCard label="Saídas" value={formatBRL(resumo.saidas)} icon={ArrowDownCircle} tone="expense" hint={resumo.saidasPendentes ? `+ ${formatBRL(resumo.saidasPendentes)} a pagar` : undefined} />
        <StatCard label="Saldo" value={formatBRL(resumo.saldo)} icon={Wallet} />
        <StatCard label="Previsto" value={formatBRL(resumo.saldo + resumo.entradasPendentes - resumo.saidasPendentes)} icon={ArrowLeftRight} hint="Incluindo pendentes" />
      </div>

      <Card className="mb-4 grid gap-2 p-3 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar descrição" className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <Select value={pessoa} onValueChange={(v) => setParam("pessoa", v)}>
          <SelectTrigger aria-label="Filtrar por pessoa">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as pessoas</SelectItem>
            {pessoas.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoria} onValueChange={(v) => setParam("categoria", v)}>
          <SelectTrigger aria-label="Filtrar por categoria">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as categorias</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome} ({c.tipo === "entrada" ? "entrada" : "saída"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {cartao && (
          <div className="sm:col-span-3">
            <Badge variant="secondary" className="gap-1.5">
              Cartão: {cartoesMap.get(cartao)?.nome ?? "—"}
              <button onClick={() => setParam("cartao", null)} aria-label="Remover filtro de cartão">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}
      </Card>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : grupos.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Nenhum lançamento neste período"
          description="Registre entradas (salário, bônus…) e saídas (despesas, investimentos…)."
          action={<Button onClick={() => novo("saida")}>Adicionar lançamento</Button>}
        />
      ) : (
        <div className="space-y-5">
          {grupos.map(([data, itens]) => (
            <section key={data}>
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{formatDate(data)}</h2>
              <Card className="divide-y overflow-hidden">
                {itens.map((t) => {
                  const cat = t.categoria_id ? categoriasMap.get(t.categoria_id) : undefined;
                  const pes = t.pessoa_id ? pessoasMap.get(t.pessoa_id) : undefined;
                  const car = t.cartao_id ? cartoesMap.get(t.cartao_id) : undefined;
                  const confirmado = t.status === "confirmado";
                  return (
                    <div key={t.id} className="flex items-center gap-3 px-3 py-3 sm:px-4">
                      <button
                        onClick={() => update.mutate({ id: t.id, data: { status: confirmado ? "pendente" : "confirmado" } })}
                        className={cn("shrink-0", confirmado ? "text-income" : "text-muted-foreground hover:text-foreground")}
                        aria-label={confirmado ? "Marcar como pendente" : "Marcar como pago/recebido"}
                        title={confirmado ? "Confirmado" : "Pendente — clique para confirmar"}
                      >
                        {confirmado ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                      </button>
                      <button type="button" onClick={() => crud.openEdit(t)} className="min-w-0 flex-1 text-left" aria-label={`Editar ${t.descricao}`}>
                        <p className="truncate text-sm font-medium">{t.descricao}</p>
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <ColorDot color={cat?.cor} />
                            {cat?.nome ?? "Sem categoria"}
                          </span>
                          <span>· {car ? car.nome : formaLabel.get(t.forma)}</span>
                          {pes && <span>· {pes.nome}</span>}
                          {!confirmado && <Badge variant="warning" className="px-1.5 py-0 text-[10px]">pendente</Badge>}
                        </p>
                      </button>
                      <p className={cn("shrink-0 text-sm font-semibold tabular-nums", t.tipo === "entrada" ? "text-income" : "text-expense")}>
                        {t.tipo === "entrada" ? "+" : "−"} {formatBRL(Number(t.valor))}
                      </p>
                      <div className="hidden sm:block">
                        <RowActions onEdit={() => crud.openEdit(t)} onDelete={() => crud.askDelete(t)} />
                      </div>
                    </div>
                  );
                })}
              </Card>
            </section>
          ))}
        </div>
      )}

      <TransacaoDialog
        open={crud.formOpen}
        onOpenChange={crud.setFormOpen}
        editing={crud.editing}
        tipo={novoTipo}
        defaults={cartao ? { forma: "cartao", cartao_id: cartao } : undefined}
        onDelete={crud.askDelete}
      />
      <ConfirmDelete
        open={!!crud.deleting}
        onOpenChange={(o) => !o && crud.clearDelete()}
        title="Excluir lançamento?"
        description={crud.deleting?.descricao}
        onConfirm={() => crud.deleting && remove.mutate(crud.deleting.id)}
      />
    </>
  );
}
