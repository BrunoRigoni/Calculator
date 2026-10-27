-- Controle financeiro da casa — schema inicial.
-- Cada registro pertence a um usuário (user_id) e é isolado por RLS.
-- Os nomes das colunas espelham src/lib/types.ts.

-- ---------------------------------------------------------------------------
-- Cadastros
-- ---------------------------------------------------------------------------
create table public.pessoas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  relacao text,
  cor text not null default '#0ea5e9',
  created_at timestamptz not null default now()
);

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  tipo text not null check (tipo in ('entrada', 'saida')),
  cor text not null default '#64748b',
  created_at timestamptz not null default now()
);

create table public.cartoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  cor text not null default '#820ad1',
  created_at timestamptz not null default now()
);

create table public.motivos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  tipo text not null check (tipo in ('financiamento', 'emprestimo')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Despesas e recebíveis
-- ---------------------------------------------------------------------------
create table public.boletos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  descricao text not null,
  beneficiario text,
  valor numeric(14, 2) not null check (valor >= 0),
  vencimento date not null,
  codigo_barras text,
  pessoa_id uuid references public.pessoas (id) on delete set null,
  categoria_id uuid references public.categorias (id) on delete set null,
  status text not null default 'pendente' check (status in ('pendente', 'pago')),
  data_pagamento date,
  created_at timestamptz not null default now()
);

-- Financiamentos e empréstimos.
create table public.contratos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('financiamento', 'emprestimo')),
  descricao text not null,
  motivo_id uuid references public.motivos (id) on delete set null,
  instituicao text,
  pessoa_id uuid references public.pessoas (id) on delete set null,
  categoria_id uuid references public.categorias (id) on delete set null,
  valor_total numeric(14, 2) not null check (valor_total >= 0),
  num_parcelas integer not null check (num_parcelas >= 1),
  valor_parcela numeric(14, 2) not null check (valor_parcela >= 0),
  data_inicio date not null,
  observacao text,
  created_at timestamptz not null default now()
);

-- Valores a cobrar / receber.
create table public.cobrancas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  descricao text not null,
  pessoa_id uuid references public.pessoas (id) on delete set null,
  valor numeric(14, 2) not null check (valor >= 0),
  data_prevista date not null,
  status text not null default 'pendente' check (status in ('pendente', 'recebido')),
  data_recebimento date,
  observacao text,
  created_at timestamptz not null default now()
);

-- Entradas e saídas.
create table public.transacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida')),
  descricao text not null,
  valor numeric(14, 2) not null check (valor >= 0),
  data date not null,
  status text not null default 'confirmado' check (status in ('pendente', 'confirmado')),
  forma text not null default 'pix'
    check (forma in ('pix', 'dinheiro', 'debito', 'transferencia', 'cartao', 'boleto', 'financiamento', 'emprestimo', 'outro')),
  pessoa_id uuid references public.pessoas (id) on delete set null,
  categoria_id uuid references public.categorias (id) on delete set null,
  cartao_id uuid references public.cartoes (id) on delete set null,
  boleto_id uuid references public.boletos (id) on delete set null,
  contrato_id uuid references public.contratos (id) on delete cascade,
  cobranca_id uuid references public.cobrancas (id) on delete set null,
  parcela integer check (parcela is null or parcela >= 1),
  observacao text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------
create index on public.pessoas (user_id);
create index on public.categorias (user_id, tipo);
create index on public.cartoes (user_id);
create index on public.motivos (user_id, tipo);
create index on public.boletos (user_id, status, vencimento);
create index on public.contratos (user_id, tipo);
create index on public.cobrancas (user_id, status, data_prevista);
create index on public.transacoes (user_id, data);
create index on public.transacoes (contrato_id);
create index on public.transacoes (boleto_id);
create index on public.transacoes (cobranca_id);
create index on public.transacoes (cartao_id);

-- ---------------------------------------------------------------------------
-- RLS: cada usuário só enxerga e altera os próprios dados.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['pessoas', 'categorias', 'cartoes', 'motivos', 'boletos', 'contratos', 'cobrancas', 'transacoes'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own_select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "own_insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "own_update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "own_delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Dados padrão para cada novo usuário (mesmos de src/data/seed.ts).
-- ---------------------------------------------------------------------------
create or replace function public.seed_default_data()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categorias (user_id, nome, tipo, cor) values
    (new.id, 'Salário', 'entrada', '#10b981'),
    (new.id, 'Bônus', 'entrada', '#22c55e'),
    (new.id, 'Despesa', 'saida', '#ef4444'),
    (new.id, 'Investimento', 'saida', '#6366f1');
  insert into public.motivos (user_id, nome, tipo) values
    (new.id, 'Imóvel', 'financiamento'),
    (new.id, 'Veículo', 'financiamento'),
    (new.id, 'Emergência', 'emprestimo'),
    (new.id, 'Reforma', 'emprestimo');
  return new;
end;
$$;

revoke execute on function public.seed_default_data() from public, anon, authenticated;

create trigger on_auth_user_created_seed
  after insert on auth.users
  for each row execute function public.seed_default_data();
