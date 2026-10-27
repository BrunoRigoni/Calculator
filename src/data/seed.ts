import type { Insert } from "@/lib/types";

// Dados iniciais. Mantidos em sincronia com a função seed_default_data()
// em supabase/migrations.
export const DEFAULT_CATEGORIAS: Insert<"categorias">[] = [
  { nome: "Salário", tipo: "entrada", cor: "#10b981" },
  { nome: "Bônus", tipo: "entrada", cor: "#22c55e" },
  { nome: "Despesa", tipo: "saida", cor: "#ef4444" },
  { nome: "Investimento", tipo: "saida", cor: "#6366f1" },
];

export const DEFAULT_MOTIVOS: Insert<"motivos">[] = [
  { nome: "Imóvel", tipo: "financiamento" },
  { nome: "Veículo", tipo: "financiamento" },
  { nome: "Emergência", tipo: "emprestimo" },
  { nome: "Reforma", tipo: "emprestimo" },
];
