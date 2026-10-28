-- Migration: Criação da Tabela de Registros de Saldos Pendentes com Validação Administrativa
-- Database: Supabase PostgreSQL

create table if not exists public.registros_saldos (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    email text,
    whatsapp text,
    saldo_rentalhash numeric(15, 2) not null default 0,
    moeda_rentalhash text not null default 'USDT',
    comprovante_rentalhash_url text,
    validado_rentalhash boolean not null default false,
    saldo_hashsell numeric(15, 2) not null default 0,
    moeda_hashsell text not null default 'USDT',
    comprovante_hashsell_url text,
    validado_hashsell boolean not null default false,
    observacoes text,
    status text not null default 'pendente', -- 'pendente', 'validado', 'divergente', 'rejeitado'
    validado_por text,
    validado_em timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_registros_saldos_created on public.registros_saldos(created_at desc);
create index if not exists idx_registros_saldos_status on public.registros_saldos(status);

-- Trigger para updated_at
drop trigger if exists trg_registros_saldos_updated_at on public.registros_saldos;
create trigger trg_registros_saldos_updated_at
before update on public.registros_saldos
for each row execute function public.set_updated_at();

-- ROW LEVEL SECURITY
alter table public.registros_saldos enable row level security;

-- Público pode submeter seus saldos e prints
drop policy if exists "Público pode registrar saldos" on public.registros_saldos;
create policy "Público pode registrar saldos"
    on public.registros_saldos for insert
    with check (true);

-- Apenas administradores autenticados podem consultar a lista de saldos e comprovantes dos operadores
drop policy if exists "Apenas administradores consultam saldos" on public.registros_saldos;
create policy "Apenas administradores consultam saldos"
    on public.registros_saldos for select
    using (public.is_admin());

-- Apenas administradores autenticados podem atualizar ou remover registros
drop policy if exists "Apenas administradores gerenciam saldos" on public.registros_saldos;
create policy "Apenas administradores gerenciam saldos"
    on public.registros_saldos for all
    using (public.is_admin());

-- Storage Bucket para comprovantes
insert into storage.buckets (id, name, public) 
values ('comprovantes', 'comprovantes', true)
on conflict (id) do nothing;

drop policy if exists "Upload público de comprovantes" on storage.objects;
create policy "Upload público de comprovantes"
on storage.objects for insert
with check (bucket_id = 'comprovantes');

drop policy if exists "Leitura de comprovantes" on storage.objects;
create policy "Leitura de comprovantes"
on storage.objects for select
using (bucket_id = 'comprovantes');
