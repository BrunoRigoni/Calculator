// Modelos de domínio. Os nomes de campos seguem snake_case para espelhar
// exatamente as colunas do Supabase (supabase/migrations), sem mapeamento.

export type Id = string;

interface Base {
  id: Id;
  created_at: string;
}

export type TipoMovimento = "entrada" | "saida";
export type TipoContrato = "financiamento" | "emprestimo";
export type StatusTransacao = "pendente" | "confirmado";
export type FormaPagamento =
  | "pix"
  | "dinheiro"
  | "debito"
  | "transferencia"
  | "cartao"
  | "boleto"
  | "financiamento"
  | "emprestimo"
  | "outro";

export interface Pessoa extends Base {
  nome: string;
  relacao: string | null;
  cor: string;
}

export interface Categoria extends Base {
  nome: string;
  tipo: TipoMovimento;
  cor: string;
}

export interface Cartao extends Base {
  nome: string;
  cor: string;
}

/** Motivo de financiamento ou empréstimo (cadastrável). */
export interface Motivo extends Base {
  nome: string;
  tipo: TipoContrato;
}

export interface Boleto extends Base {
  descricao: string;
  beneficiario: string | null;
  valor: number;
  vencimento: string;
  codigo_barras: string | null;
  pessoa_id: Id | null;
  categoria_id: Id | null;
  status: "pendente" | "pago";
  data_pagamento: string | null;
}

/** Financiamento ou empréstimo. As parcelas viram transações de saída. */
export interface Contrato extends Base {
  tipo: TipoContrato;
  descricao: string;
  motivo_id: Id | null;
  instituicao: string | null;
  pessoa_id: Id | null;
  categoria_id: Id | null;
  valor_total: number;
  num_parcelas: number;
  valor_parcela: number;
  data_inicio: string;
  observacao: string | null;
}

/** Valor a cobrar/receber de alguém em uma data. */
export interface Cobranca extends Base {
  descricao: string;
  pessoa_id: Id | null;
  valor: number;
  data_prevista: string;
  status: "pendente" | "recebido";
  data_recebimento: string | null;
  observacao: string | null;
}

/** Entrada ou saída de valores. */
export interface Transacao extends Base {
  tipo: TipoMovimento;
  descricao: string;
  valor: number;
  data: string;
  status: StatusTransacao;
  forma: FormaPagamento;
  pessoa_id: Id | null;
  categoria_id: Id | null;
  cartao_id: Id | null;
  boleto_id: Id | null;
  contrato_id: Id | null;
  cobranca_id: Id | null;
  parcela: number | null;
  observacao: string | null;
}

export interface Tables {
  pessoas: Pessoa;
  categorias: Categoria;
  cartoes: Cartao;
  motivos: Motivo;
  boletos: Boleto;
  contratos: Contrato;
  cobrancas: Cobranca;
  transacoes: Transacao;
}

export type TableName = keyof Tables;
export type Row<T extends TableName> = Tables[T];
export type Insert<T extends TableName> = Omit<Row<T>, "id" | "created_at">;
export type Update<T extends TableName> = Partial<Insert<T>>;

export const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string }[] = [
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "debito", label: "Débito" },
  { value: "transferencia", label: "Transferência" },
  { value: "cartao", label: "Cartão de crédito" },
  { value: "boleto", label: "Boleto" },
  { value: "financiamento", label: "Financiamento" },
  { value: "emprestimo", label: "Empréstimo" },
  { value: "outro", label: "Outro" },
];
