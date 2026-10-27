import { gerarParcelas } from "@/lib/finance";
import type { Boleto, Cobranca, Contrato, Id, Insert, Transacao } from "@/lib/types";
import type { Repository } from "./repository";

/**
 * Operações de negócio que envolvem mais de uma tabela. Ficam fora das telas
 * para serem reaproveitadas (e, no futuro, movidas para RPC/Edge Functions).
 */
export function createActions(repo: Repository) {
  const transacoesDe = async (pred: (t: Transacao) => boolean) =>
    (await repo.list("transacoes")).filter(pred);

  return {
    async pagarBoleto(b: Boleto, data: string) {
      await repo.update("boletos", b.id, { status: "pago", data_pagamento: data });
      await repo.create("transacoes", {
        tipo: "saida",
        descricao: `Boleto: ${b.descricao}`,
        valor: b.valor,
        data,
        status: "confirmado",
        forma: "boleto",
        pessoa_id: b.pessoa_id,
        categoria_id: b.categoria_id,
        cartao_id: null,
        boleto_id: b.id,
        contrato_id: null,
        cobranca_id: null,
        parcela: null,
        observacao: b.codigo_barras,
      });
    },

    async estornarBoleto(b: Boleto) {
      for (const t of await transacoesDe((t) => t.boleto_id === b.id)) await repo.remove("transacoes", t.id);
      await repo.update("boletos", b.id, { status: "pendente", data_pagamento: null });
    },

    async receberCobranca(c: Cobranca, data: string, categoria_id: Id | null) {
      await repo.update("cobrancas", c.id, { status: "recebido", data_recebimento: data });
      await repo.create("transacoes", {
        tipo: "entrada",
        descricao: `Recebido: ${c.descricao}`,
        valor: c.valor,
        data,
        status: "confirmado",
        forma: "pix",
        pessoa_id: c.pessoa_id,
        categoria_id,
        cartao_id: null,
        boleto_id: null,
        contrato_id: null,
        cobranca_id: c.id,
        parcela: null,
        observacao: c.observacao,
      });
    },

    async estornarCobranca(c: Cobranca) {
      for (const t of await transacoesDe((t) => t.cobranca_id === c.id)) await repo.remove("transacoes", t.id);
      await repo.update("cobrancas", c.id, { status: "pendente", data_recebimento: null });
    },

    /** Cria o contrato e, opcionalmente, suas parcelas como saídas pendentes. */
    async criarContrato(data: Insert<"contratos">, gerar: boolean) {
      const c = await repo.create("contratos", data);
      if (gerar) await repo.createMany("transacoes", gerarParcelas(c));
      return c;
    },

    /**
     * Atualiza o contrato. Com `regerar`, substitui as parcelas pendentes
     * mantendo as já pagas (pelo número da parcela).
     */
    async atualizarContrato(id: Id, data: Insert<"contratos">, regerar: boolean) {
      const c: Contrato = await repo.update("contratos", id, data);
      if (!regerar) return c;
      const parcelas = await transacoesDe((t) => t.contrato_id === id);
      const pagas = new Set(parcelas.filter((t) => t.status === "confirmado").map((t) => t.parcela));
      for (const t of parcelas.filter((t) => t.status !== "confirmado")) await repo.remove("transacoes", t.id);
      await repo.createMany(
        "transacoes",
        gerarParcelas(c).filter((p) => !pagas.has(p.parcela)),
      );
      return c;
    },

    async removerContrato(id: Id) {
      for (const t of await transacoesDe((t) => t.contrato_id === id)) await repo.remove("transacoes", t.id);
      await repo.remove("contratos", id);
    },
  };
}
