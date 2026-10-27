import { beforeEach, describe, expect, it } from "vitest";
import { createActions } from "./actions";
import { LocalRepository } from "./local-repository";
import type { Insert } from "@/lib/types";

let repo: LocalRepository;
let actions: ReturnType<typeof createActions>;

beforeEach(() => {
  localStorage.clear();
  repo = new LocalRepository(localStorage);
  actions = createActions(repo);
});

const contrato: Insert<"contratos"> = {
  tipo: "emprestimo",
  descricao: "Pessoal",
  motivo_id: null,
  instituicao: "Banco X",
  pessoa_id: null,
  categoria_id: null,
  valor_total: 3000,
  num_parcelas: 3,
  valor_parcela: 1000,
  data_inicio: "2026-11-10",
  observacao: null,
};

describe("LocalRepository", () => {
  it("cria categorias e motivos padrão uma única vez", async () => {
    const cats = await repo.list("categorias");
    expect(cats.map((c) => c.nome).sort()).toEqual(["Bônus", "Despesa", "Investimento", "Salário"]);
    new LocalRepository(localStorage);
    expect(await repo.list("categorias")).toHaveLength(4);
    expect((await repo.list("motivos")).length).toBeGreaterThan(0);
  });

  it("faz CRUD completo", async () => {
    const p = await repo.create("pessoas", { nome: "Ana", relacao: "Titular", cor: "#000000" });
    expect(p.id).toBeTruthy();
    await repo.update("pessoas", p.id, { nome: "Ana Maria" });
    expect((await repo.list("pessoas"))[0].nome).toBe("Ana Maria");
    await repo.remove("pessoas", p.id);
    expect(await repo.list("pessoas")).toHaveLength(0);
  });
});

describe("actions", () => {
  it("pagar e estornar boleto gera/remove a saída", async () => {
    const b = await repo.create("boletos", {
      descricao: "Luz",
      beneficiario: null,
      valor: 150.5,
      vencimento: "2026-10-10",
      codigo_barras: null,
      pessoa_id: null,
      categoria_id: null,
      status: "pendente",
      data_pagamento: null,
    });
    await actions.pagarBoleto(b, "2026-10-09");
    const [t] = await repo.list("transacoes");
    expect(t).toMatchObject({ tipo: "saida", valor: 150.5, forma: "boleto", boleto_id: b.id, status: "confirmado" });
    expect((await repo.list("boletos"))[0].status).toBe("pago");

    await actions.estornarBoleto(b);
    expect(await repo.list("transacoes")).toHaveLength(0);
    expect((await repo.list("boletos"))[0].status).toBe("pendente");
  });

  it("receber cobrança gera entrada", async () => {
    const c = await repo.create("cobrancas", {
      descricao: "João",
      pessoa_id: null,
      valor: 200,
      data_prevista: "2026-10-20",
      status: "pendente",
      data_recebimento: null,
      observacao: null,
    });
    await actions.receberCobranca(c, "2026-10-21", null);
    const [t] = await repo.list("transacoes");
    expect(t).toMatchObject({ tipo: "entrada", valor: 200, cobranca_id: c.id, data: "2026-10-21" });
  });

  it("contrato: gera parcelas, preserva pagas ao recalcular e remove tudo ao excluir", async () => {
    const c = await actions.criarContrato(contrato, true);
    let parcelas = await repo.list("transacoes");
    expect(parcelas).toHaveLength(3);

    const primeira = parcelas.find((p) => p.parcela === 1)!;
    await repo.update("transacoes", primeira.id, { status: "confirmado" });

    await actions.atualizarContrato(c.id, { ...contrato, num_parcelas: 4, valor_parcela: 800 }, true);
    parcelas = await repo.list("transacoes");
    expect(parcelas).toHaveLength(4);
    expect(parcelas.find((p) => p.parcela === 1)).toMatchObject({ id: primeira.id, valor: 1000, status: "confirmado" });
    expect(parcelas.filter((p) => p.status === "pendente").every((p) => p.valor === 800)).toBe(true);

    await actions.removerContrato(c.id);
    expect(await repo.list("transacoes")).toHaveLength(0);
    expect(await repo.list("contratos")).toHaveLength(0);
  });
});
