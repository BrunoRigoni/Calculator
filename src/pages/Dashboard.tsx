import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownCircle, ArrowUpCircle, CalendarClock, HandCoins, Receipt, Wallet, Building2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransacaoDialog } from "@/components/forms/TransacaoDialog";
import { ColorDot } from "@/components/shared/ColorDot";
import { MonthPicker } from "@/components/shared/MonthPicker";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { useList, useLookup } from "@/hooks/use-data";
import { doMes, formatBRL, formatDate, monthKey, resumir, shiftMonth, somarPor, today } from "@/lib/finance";
import type { TipoMovimento } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Vencimento {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: "pagar" | "receber";
  origem: string;
  link: string;
}

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--popover-foreground))",
  fontSize: 12,
};

export default function Dashboard() {
  const [mes, setMes] = useState(monthKey(today()));
  const [novo, setNovo] = useState<TipoMovimento | null>(null);
  const { data: transacoes = [] } = useList("transacoes");
  const { data: boletos = [] } = useList("boletos");
  const { data: cobrancas = [] } = useList("cobrancas");
  const { data: cartoes = [] } = useList("cartoes");
  const categoriasMap = useLookup("categorias");

  const doMesAtual = useMemo(() => doMes(transacoes, mes), [transacoes, mes]);
  const resumo = resumir(doMesAtual);
  const hoje = today();

  const porCategoria = somarPor(
    doMesAtual.filter((t) => t.tipo === "saida"),
    (t) => t.categoria_id,
  ).map((r) => {
    const c = r.key ? categoriasMap.get(r.key) : undefined;
    return { name: c?.nome ?? "Sem categoria", value: r.total, color: c?.cor ?? "#94a3b8" };
  });

  const entradasPorCategoria = somarPor(
    doMesAtual.filter((t) => t.tipo === "entrada"),
    (t) => t.categoria_id,
  ).map((r) => {
    const c = r.key ? categoriasMap.get(r.key) : undefined;
    return { name: c?.nome ?? "Sem categoria", value: r.total, color: c?.cor ?? "#94a3b8" };
  });

  const historico = Array.from({ length: 6 }, (_, i) => {
    const m = shiftMonth(mes, i - 5);
    const r = resumir(doMes(transacoes, m));
    return {
      mes: format(parseISO(`${m}-01`), "MMM", { locale: ptBR }),
      Entradas: r.entradas + r.entradasPendentes,
      Saídas: r.saidas + r.saidasPendentes,
    };
  });

  const porCartao = cartoes
    .map((c) => ({ ...c, total: doMesAtual.filter((t) => t.cartao_id === c.id && t.tipo === "saida").reduce((s, t) => s + Number(t.valor), 0) }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const vencimentos: Vencimento[] = [
    ...boletos
      .filter((b) => b.status === "pendente")
      .map((b) => ({ id: b.id, data: b.vencimento, descricao: b.descricao, valor: Number(b.valor), tipo: "pagar" as const, origem: "Boleto", link: "/boletos" })),
    ...transacoes
      .filter((t) => t.status === "pendente" && !t.boleto_id)
      .map((t) => ({
        id: t.id,
        data: t.data,
        descricao: t.descricao,
        valor: Number(t.valor),
        tipo: t.tipo === "entrada" ? ("receber" as const) : ("pagar" as const),
        origem: t.contrato_id ? "Parcela" : "Lançamento",
        link: t.contrato_id ? (t.forma === "emprestimo" ? "/emprestimos" : "/financiamentos") : `/lancamentos?mes=${monthKey(t.data)}`,
      })),
    ...cobrancas
      .filter((c) => c.status === "pendente")
      .map((c) => ({ id: c.id, data: c.data_prevista, descricao: c.descricao, valor: Number(c.valor), tipo: "receber" as const, origem: "A receber", link: "/a-receber" })),
  ]
    .filter((v) => v.data <= format(parseISO(`${shiftMonth(monthKey(hoje), 1)}-28`), "yyyy-MM-dd"))
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 8);

  return (
    <>
      <PageHeader
        title="Painel"
        description="Resumo das finanças da casa no mês."
        actions={
          <>
            <Button variant="outline" onClick={() => setNovo("entrada")} className="border-income/40 text-income hover:text-income">
              <ArrowUpCircle /> Entrada
            </Button>
            <Button onClick={() => setNovo("saida")} className="bg-expense hover:bg-expense/90">
              <ArrowDownCircle /> Saída
            </Button>
          </>
        }
      />
      <div className="mb-4">
        <MonthPicker value={mes} onChange={setMes} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Entradas" value={formatBRL(resumo.entradas)} icon={ArrowUpCircle} tone="income" hint={resumo.entradasPendentes ? `+ ${formatBRL(resumo.entradasPendentes)} previsto` : "Recebido no mês"} />
        <StatCard label="Saídas" value={formatBRL(resumo.saidas)} icon={ArrowDownCircle} tone="expense" hint={resumo.saidasPendentes ? `+ ${formatBRL(resumo.saidasPendentes)} a pagar` : "Pago no mês"} />
        <StatCard label="Saldo do mês" value={formatBRL(resumo.saldo)} icon={Wallet} tone={resumo.saldo >= 0 ? "income" : "expense"} />
        <StatCard
          label="Saldo previsto"
          value={formatBRL(resumo.saldo + resumo.entradasPendentes - resumo.saidasPendentes)}
          icon={CalendarClock}
          tone="invest"
          hint="Com pendentes do mês"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Últimos 6 meses</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historico} margin={{ left: -12, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatBRL(v)} cursor={{ fill: "hsl(var(--muted))" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Entradas" fill="hsl(var(--income))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Saídas" fill="hsl(var(--expense))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Saídas por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <Distribuicao dados={porCategoria} vazio="Nenhuma saída no mês." />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Próximos vencimentos</CardTitle>
            <Badge variant="secondary" className="hidden sm:inline-flex">até o fim do próximo mês</Badge>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {vencimentos.length === 0 ? (
              <p className="px-5 pb-4 text-sm text-muted-foreground">Nada pendente. 🎉</p>
            ) : (
              <div className="divide-y">
                {vencimentos.map((v) => {
                  const atrasado = v.data < hoje;
                  return (
                    <Link key={`${v.origem}-${v.id}`} to={v.link} className="flex items-center gap-3 px-5 py-2.5 hover:bg-accent/40">
                      <div className={cn("rounded-lg p-2", v.tipo === "receber" ? "bg-income/10 text-income" : "bg-expense/10 text-expense")}>
                        {v.origem === "Boleto" ? <Receipt className="h-4 w-4" /> : v.origem === "Parcela" ? <Building2 className="h-4 w-4" /> : <HandCoins className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{v.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.origem} · {formatDate(v.data)} {atrasado && <span className="font-medium text-expense">· atrasado</span>}
                        </p>
                      </div>
                      <p className={cn("text-sm font-semibold tabular-nums", v.tipo === "receber" ? "text-income" : "text-expense")}>
                        {v.tipo === "receber" ? "+" : "−"} {formatBRL(v.valor)}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Entradas por categoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {entradasPorCategoria.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma entrada no mês.</p>
              ) : (
                entradasPorCategoria.map((e) => (
                  <div key={e.name} className="flex items-center gap-2 text-sm">
                    <ColorDot color={e.color} />
                    <span className="flex-1 truncate">{e.name}</span>
                    <span className="font-medium tabular-nums">{formatBRL(e.value)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cartões no mês</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {porCartao.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem gastos em cartão.</p>
              ) : (
                porCartao.map((c) => (
                  <Link key={c.id} to={`/lancamentos?cartao=${c.id}&mes=${mes}`} className="flex items-center gap-2 text-sm hover:underline">
                    <span className="h-4 w-6 rounded" style={{ background: c.cor }} />
                    <span className="flex-1 truncate">{c.nome}</span>
                    <span className="font-medium tabular-nums">{formatBRL(c.total)}</span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <TransacaoDialog open={novo !== null} onOpenChange={(o) => !o && setNovo(null)} tipo={novo ?? "saida"} />
    </>
  );
}

function Distribuicao({ dados, vazio }: { dados: { name: string; value: number; color: string }[]; vazio: string }) {
  if (dados.length === 0) return <p className="py-16 text-center text-sm text-muted-foreground">{vazio}</p>;
  const total = dados.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex min-w-0 flex-col items-center gap-4 sm:flex-row lg:flex-col">
      <div className="h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={dados} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2} stroke="none">
              {dados.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatBRL(v)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full space-y-2">
        {dados.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-sm">
            <ColorDot color={d.color} />
            <span className="flex-1 truncate">{d.name}</span>
            <span className="text-xs text-muted-foreground">{Math.round((d.value / total) * 100)}%</span>
            <span className="font-medium tabular-nums">{formatBRL(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
