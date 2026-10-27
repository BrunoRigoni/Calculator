import { addMonths, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Contrato, Insert, Transacao } from "./types";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const formatBRL = (v: number) => brl.format(Number.isFinite(v) ? v : 0);

export const formatDate = (iso: string | null | undefined) => (iso ? format(parseISO(iso), "dd/MM/yyyy") : "—");

export const today = () => format(new Date(), "yyyy-MM-dd");

/** "2026-10" */
export const monthKey = (iso: string) => iso.slice(0, 7);

export const monthLabel = (key: string) => {
  const s = format(parseISO(`${key}-01`), "MMMM 'de' yyyy", { locale: ptBR });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const shiftMonth = (key: string, delta: number) => format(addMonths(parseISO(`${key}-01`), delta), "yyyy-MM");

export const round2 = (v: number) => Math.round(v * 100) / 100;

/**
 * Gera as parcelas mensais de um financiamento/empréstimo como transações de saída
 * pendentes. A última parcela absorve a diferença de arredondamento quando o valor
 * da parcela é derivado do total.
 */
export function gerarParcelas(c: Contrato): Insert<"transacoes">[] {
  const n = Math.max(1, Math.floor(c.num_parcelas));
  const inicio = parseISO(c.data_inicio);
  const rotulo = c.tipo === "financiamento" ? "Financiamento" : "Empréstimo";
  return Array.from({ length: n }, (_, i) => ({
    tipo: "saida" as const,
    descricao: `${rotulo}: ${c.descricao} (${i + 1}/${n})`,
    valor: c.valor_parcela,
    data: format(addMonths(inicio, i), "yyyy-MM-dd"),
    status: "pendente" as const,
    forma: c.tipo,
    pessoa_id: c.pessoa_id,
    categoria_id: c.categoria_id,
    cartao_id: null,
    boleto_id: null,
    contrato_id: c.id,
    cobranca_id: null,
    parcela: i + 1,
    observacao: null,
  }));
}

export interface Resumo {
  entradas: number;
  saidas: number;
  saldo: number;
  entradasPendentes: number;
  saidasPendentes: number;
}

/** Totais de um conjunto de transações. Saldo considera apenas o que foi confirmado. */
export function resumir(transacoes: Transacao[]): Resumo {
  const r: Resumo = { entradas: 0, saidas: 0, saldo: 0, entradasPendentes: 0, saidasPendentes: 0 };
  for (const t of transacoes) {
    const v = Number(t.valor) || 0;
    if (t.tipo === "entrada") {
      if (t.status === "confirmado") r.entradas += v;
      else r.entradasPendentes += v;
    } else if (t.status === "confirmado") r.saidas += v;
    else r.saidasPendentes += v;
  }
  r.entradas = round2(r.entradas);
  r.saidas = round2(r.saidas);
  r.entradasPendentes = round2(r.entradasPendentes);
  r.saidasPendentes = round2(r.saidasPendentes);
  r.saldo = round2(r.entradas - r.saidas);
  return r;
}

/** Soma por chave (ex.: categoria_id), ordenado do maior para o menor. */
export function somarPor<K extends string | null>(items: Transacao[], key: (t: Transacao) => K) {
  const map = new Map<K, number>();
  for (const t of items) map.set(key(t), (map.get(key(t)) ?? 0) + (Number(t.valor) || 0));
  return [...map.entries()].map(([k, total]) => ({ key: k, total: round2(total) })).sort((a, b) => b.total - a.total);
}

export const doMes = (items: Transacao[], mes: string) => items.filter((t) => monthKey(t.data) === mes);
