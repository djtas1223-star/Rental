-- ============================================================================
-- CORREÇÃO E ATIVAÇÃO DA TABELA DE SALDOS + MIGRAÇÃO DOS REGISTROS EXISTENTES
-- ============================================================================

-- 1. Criação da tabela oficial de registros de saldos (caso ainda não exista)
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

-- Índices de consulta rápida
create index if not exists idx_registros_saldos_created on public.registros_saldos(created_at desc);
create index if not exists idx_registros_saldos_status on public.registros_saldos(status);

-- 2. Habilitação de RLS e Políticas de Acesso
alter table public.registros_saldos enable row level security;

-- Público pode registrar saldos (anônimo ou autenticado)
drop policy if exists "Público pode registrar saldos" on public.registros_saldos;
create policy "Público pode registrar saldos"
    on public.registros_saldos for insert
    with check (true);

-- Administradores e membros autenticados consultam e gerenciam
drop policy if exists "Apenas administradores consultam saldos" on public.registros_saldos;
create policy "Apenas administradores consultam saldos"
    on public.registros_saldos for select
    using (auth.role() = 'authenticated' or public.is_admin());

drop policy if exists "Apenas administradores gerenciam saldos" on public.registros_saldos;
create policy "Apenas administradores gerenciam saldos"
    on public.registros_saldos for all
    using (auth.role() = 'authenticated' or public.is_admin());

-- 3. MIGRAÇÃO AUTOMÁTICA DOS SALDOS QUE CAÍRAM EM QUESTIONAMENTOS
do $$
declare
    r record;
    v_json jsonb;
begin
    for r in select id, titulo, descricao, autor_nome, autor_email, created_at 
             from public.questionamentos 
             where titulo ilike '[SALDO OPERADOR]%' loop
        begin
            v_json := r.descricao::jsonb;
            
            insert into public.registros_saldos (
                nome,
                email,
                whatsapp,
                saldo_rentalhash,
                moeda_rentalhash,
                comprovante_rentalhash_url,
                saldo_hashsell,
                moeda_hashsell,
                comprovante_hashsell_url,
                observacoes,
                status,
                created_at
            ) values (
                coalesce(nullif(v_json->>'nome', ''), r.autor_nome, replace(r.titulo, '[SALDO OPERADOR] ', '')),
                coalesce(v_json->>'email', r.autor_email),
                v_json->>'whatsapp',
                coalesce((v_json->>'saldo_rentalhash')::numeric, 0),
                coalesce(v_json->>'moeda_rentalhash', 'USDT'),
                v_json->>'comprovante_rentalhash_url',
                coalesce((v_json->>'saldo_hashsell')::numeric, 0),
                coalesce(v_json->>'moeda_hashsell', 'USDT'),
                v_json->>'comprovante_hashsell_url',
                v_json->>'observacoes',
                'pendente',
                r.created_at
            );
        exception when others then
            -- Se algum registro tiver formato diferente, ignora e segue
            null;
        end;
    end loop;

    -- Limpa os registros de saldos da tabela de questionamentos para não poluir as Demandas
    delete from public.questionamentos where titulo ilike '[SALDO OPERADOR]%';
end;
$$;

-- 4. Notifica o cache do PostgREST para atualização imediata
notify pgrst, 'reload schema';
