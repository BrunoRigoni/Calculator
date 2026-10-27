import { describe, expect, it } from "vitest";
import { doMes, gerarParcelas, resumir, shiftMonth, somarPor } from "./finance";
import type { Contrato, Transacao } from "./types";

const t = (p: Partial<Transacao>): Transacao => ({
  id: Math.random().toString(),
  created_at: "",
  tipo: "saida",
  descricao: "x",
  valor: 0,
  data: "2026-10-01",
  status: "confirmado",
  forma: "pix",
  pessoa_id: null,
  categoria_id: null,
  cartao_id: null,
  boleto_id: null,
  contrato_id: null,
  cobranca_id: null,
  parcela: null,
  observacao: null,
  ...p,
});

describe("resumir", () => {
  it("separa confirmados e pendentes e calcula saldo", () => {
    const r = resumir([
      t({ tipo: "entrada", valor: 5000 }),
      t({ tipo: "entrada", valor: 1000, status: "pendente" }),
      t({ tipo: "saida", valor: 1200.1 }),
      t({ tipo: "saida", valor: 300.2 }),
      t({ tipo: "saida", valor: 99, status: "pendente" }),
    ]);
    expect(r).toEqual({ entradas: 5000, saidas: 1500.3, saldo: 3499.7, entradasPendentes: 1000, saidasPendentes: 99 });
  });
});

describe("gerarParcelas", () => {
  const c: Contrato = {
    id: "c1",
    created_at: "",
    tipo: "financiamento",
    descricao: "Carro",
    motivo_id: null,
    instituicao: "Banco",
    pessoa_id: "p1",
    categoria_id: "cat",
    valor_total: 12000,
    num_parcelas: 3,
    valor_parcela: 4000,
    data_inicio: "2026-01-31",
    observacao: null,
  };

  it("gera uma saída pendente por mês vinculada ao contrato", () => {
    const ps = gerarParcelas(c);
    expect(ps).toHaveLength(3);
    expect(ps.map((p) => p.data)).toEqual(["2026-01-31", "2026-02-28", "2026-03-31"]);
    expect(ps.every((p) => p.contrato_id === "c1" && p.status === "pendente" && p.tipo === "saida")).toBe(true);
    expect(ps[2].descricao).toBe("Financiamento: Carro (3/3)");
  });
});

describe("helpers de mês", () => {
  it("navega entre meses e filtra", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(doMes([t({ data: "2026-10-05" }), t({ data: "2026-11-01" })], "2026-10")).toHaveLength(1);
  });

  it("soma por chave em ordem decrescente", () => {
    const r = somarPor([t({ categoria_id: "a", valor: 1 }), t({ categoria_id: "b", valor: 5 }), t({ categoria_id: "a", valor: 2 })], (x) => x.categoria_id);
    expect(r).toEqual([{ key: "b", total: 5 }, { key: "a", total: 3 }]);
  });
});
