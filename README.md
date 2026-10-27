# Finanças da Casa

Sistema de controle financeiro doméstico — responsivo, moderno e pronto para ser conectado à **Lovable** (Supabase).

## Funcionalidades

| Módulo | O que faz |
| --- | --- |
| **Painel** | Entradas, saídas, saldo e saldo previsto do mês; gráfico dos últimos 6 meses; saídas por categoria; próximos vencimentos; gasto por cartão. |
| **Entradas e saídas** | Lançamentos com tipo, valor, data, categoria, pessoa, forma de pagamento, cartão e status (pago/pendente). Filtros por mês, tipo, pessoa, categoria, cartão e busca. |
| **A receber** | Valores a cobrar de alguém, com data prevista. Ao marcar como recebido, a entrada é lançada automaticamente. |
| **Cartões** | Cadastro de cartão (nome + cor do banco) e gasto do mês por cartão. |
| **Boletos** | Boletos com vencimento, beneficiário e código de barras. Ao pagar, a saída é lançada automaticamente (e pode ser desfeita). |
| **Financiamentos** | Com motivo, instituição, valor total, parcelas. Gera as parcelas como saídas mensais e mostra o progresso. |
| **Empréstimos** | Igual aos financiamentos, com motivos próprios. |
| **Pessoas** | Membros da casa e pessoas com quem há valores a pagar/receber. |
| **Categorias** | Totalmente cadastráveis. Padrão: entradas **Salário** e **Bônus**; saídas **Despesa** e **Investimento**. |
| **Motivos** | Motivos de financiamento e de empréstimo, cadastráveis. |

Tema claro/escuro, navegação lateral no desktop e barra inferior no celular.

## Stack (mesma do template da Lovable)

Vite · React 18 · TypeScript · Tailwind CSS · shadcn/ui (Radix) · TanStack Query · React Router · Recharts · Supabase JS.

## Rodando localmente

```bash
npm install
npm run dev        # http://localhost:8080
npm test           # testes unitários (regras de negócio e persistência)
npm run lint
npm run build
```

Sem variáveis de ambiente o app roda em **modo local**: os dados ficam salvos no navegador (localStorage).

## Conectando na Lovable / Supabase

1. Na Lovable, importe este repositório do GitHub.
2. Conecte o Supabase pela integração da Lovable (ou crie um projeto em supabase.com).
3. Aplique a migration `supabase/migrations/20261027000000_controle_financeiro.sql`
   (a Lovable aplica as migrations da pasta `supabase/`; manualmente, cole no SQL Editor do Supabase).
4. Defina as variáveis (a Lovable faz isso automaticamente ao conectar):
   ```
   VITE_SUPABASE_URL=https://<projeto>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<anon/publishable key>
   ```

Com as variáveis definidas, o app passa a usar o Supabase e exige login (e-mail/senha). Cada usuário enxerga apenas os próprios dados (RLS), e categorias/motivos padrão são criados automaticamente no cadastro.

## Arquitetura

```
src/
  lib/types.ts               modelos (snake_case = colunas do banco)
  lib/finance.ts             cálculos: resumo do mês, parcelas, formatação
  data/repository.ts         interface única de persistência
  data/local-repository.ts   implementação localStorage (modo offline)
  data/supabase-repository.ts implementação Supabase
  data/actions.ts            regras que envolvem várias tabelas (pagar boleto, gerar parcelas…)
  integrations/supabase/     cliente Supabase (caminho padrão da Lovable)
  hooks/use-data.ts          hooks TanStack Query genéricos por tabela
  components/ui/             componentes shadcn/ui
  components/shared/         formulário configurável, listas, cards
  pages/                     telas
supabase/migrations/         schema, índices, RLS e seed
```

As telas só conhecem a interface `Repository`; trocar o backend não exige mudar a UI. Novas entidades seguem o mesmo padrão: tipo em `types.ts`, tabela na migration, página usando `useList/useCreate/useUpdate/useRemove`.

## Validação

- `npm test`: 9 testes (cálculo de resumo, geração de parcelas, CRUD local, pagar/estornar boleto, receber cobrança, recalcular/excluir contrato).
- Migration testada em PostgreSQL 16 com o schema `auth` simulado: seed por usuário, isolamento RLS entre usuários, cascade das parcelas e checks de valor.
- Teste E2E (Playwright) dos fluxos principais em desktop (1366px) e celular (390px), sem erros de console e sem rolagem horizontal.
