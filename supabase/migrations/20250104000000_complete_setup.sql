-- ============================================================================
-- SCRIPT MESTRE DE INSTALAÇÃO COMPLETA: COMITIVA SPREADHUNTER
-- Executar no Supabase SQL Editor (Roda em 1 clique sem erros de dependência)
-- ============================================================================

-- Habilitar extensões necessárias
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ----------------------------------------------------------------------------
-- 1. FUNÇÃO AUXILIAR DE TIMESTAMP (necessária para os triggers)
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. TABELA DE ADMINISTRADORES (CRIADA PRIMEIRO)
-- ----------------------------------------------------------------------------
create table if not exists public.usuarios_administradores (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null unique,
    nome text not null,
    papel text not null default 'moderador', -- 'admin', 'moderador'
    ativo boolean not null default true,
    created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. TABELA DE LOGS DE AUDITORIA
-- ----------------------------------------------------------------------------
create table if not exists public.logs_auditoria (
    id uuid primary key default gen_random_uuid(),
    usuario_id uuid references auth.users(id) on delete set null,
    usuario_email text,
    acao text not null,
    entidade text not null,
    entidade_id text,
    detalhes jsonb default '{}'::jsonb,
    ip_origem text,
    created_at timestamptz not null default now()
);

create index if not exists idx_logs_auditoria_data on public.logs_auditoria(created_at desc);

-- ----------------------------------------------------------------------------
-- 4. TABELA DE REGISTRO DE SALDOS PENDENTES & COMPROVANTES
-- ----------------------------------------------------------------------------
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

drop trigger if exists trg_registros_saldos_updated_at on public.registros_saldos;
create trigger trg_registros_saldos_updated_at
before update on public.registros_saldos
for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. TABELA DE COMUNICADOS DA COMITIVA
-- ----------------------------------------------------------------------------
create table if not exists public.comunicados_comitiva (
    id uuid primary key default gen_random_uuid(),
    titulo text not null,
    slug text not null unique,
    resumo text not null,
    conteudo text not null,
    autor_nome text not null default 'Comitiva SpreadHunter',
    publicado boolean not null default true,
    destaque boolean not null default false,
    data_publicacao timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_comunicados_publicado on public.comunicados_comitiva(publicado, data_publicacao desc);

-- ----------------------------------------------------------------------------
-- 6. FUNÇÕES DE CHECAGEM DE SEGURANÇA (Agora a tabela já existe com certeza)
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.usuarios_administradores
    where id = auth.uid() 
      and ativo = true 
      and papel in ('admin', 'moderador')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.usuarios_administradores
    where id = auth.uid() 
      and ativo = true 
      and papel = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- 7. FUNÇÃO RPC: ADICIONAR ADMINISTRADOR
-- ----------------------------------------------------------------------------
create or replace function public.adicionar_administrador(
    p_email text,
    p_nome text,
    p_papel text default 'moderador'
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_user_id uuid;
    v_caller_is_super boolean;
begin
    -- Validação: apenas administradores ativos podem adicionar/promover outros membros
    select public.is_admin() into v_caller_is_super;
    if not v_caller_is_super then
        return jsonb_build_object(
            'success', false, 
            'error', 'Acesso negado: Somente administradores autorizados podem gerenciar a equipe.'
        );
    end if;

    if p_papel not in ('admin', 'moderador') then
        p_papel := 'moderador';
    end if;

    select id into v_user_id from auth.users where lower(email) = lower(trim(p_email)) limit 1;

    if v_user_id is null then
        return jsonb_build_object(
            'success', false, 
            'error', 'Usuário com o email ' || p_email || ' ainda não possui conta registrada no sistema.'
        );
    end if;

    update auth.users
    set email_confirmed_at = coalesce(email_confirmed_at, now())
    where id = v_user_id;

    insert into public.usuarios_administradores (id, email, nome, papel, ativo)
    values (v_user_id, lower(trim(p_email)), p_nome, p_papel, true)
    on conflict (id) do update set
        papel = p_papel,
        nome = p_nome,
        ativo = true;

    return jsonb_build_object('success', true, 'message', 'Administrador configurado com sucesso!');
end;
$$;

-- ----------------------------------------------------------------------------
-- 8. FUNÇÃO RPC: AUTO-CADASTRO DE MEMBRO DA COMITIVA
-- ----------------------------------------------------------------------------
create or replace function public.auto_cadastro_membro_comitiva(
    p_email text,
    p_nome text,
    p_codigo_secreto text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_user_id uuid;
begin
    if trim(p_codigo_secreto) != 'SPREADHUNTER2026' 
       and trim(p_codigo_secreto) != 'SPREADHUNTER2025' 
       and trim(p_codigo_secreto) != 'RENTAL2026' then
        return jsonb_build_object('success', false, 'error', 'Código de convite de segurança inválido.');
    end if;

    select id into v_user_id from auth.users where lower(email) = lower(trim(p_email)) limit 1;

    if v_user_id is null then
        return jsonb_build_object('success', false, 'error', 'Conta ainda não encontrada no sistema de autenticação.');
    end if;

    update auth.users
    set email_confirmed_at = coalesce(email_confirmed_at, now())
    where id = v_user_id;

    -- Entra como inativo aguardando liberação do admin no painel
    insert into public.usuarios_administradores (id, email, nome, papel, ativo)
    values (v_user_id, lower(trim(p_email)), p_nome, 'moderador', false)
    on conflict (id) do update set
        nome = p_nome;

    return jsonb_build_object(
        'success', true, 
        'message', 'Solicitação de cadastro recebida! Aguarde a aprovação do Administrador Geral no painel.'
    );
end;
$$;

-- ----------------------------------------------------------------------------
-- 9. FUNÇÃO RPC: OBTER PERFIL DO ADMIN LOGADO
-- ----------------------------------------------------------------------------
create or replace function public.obter_meu_perfil_admin()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
stable
as $$
declare
    v_admin record;
begin
    if auth.uid() is null then
        return jsonb_build_object('autenticado', false, 'ativo', false);
    end if;

    select id, email, nome, papel, ativo
    into v_admin
    from public.usuarios_administradores
    where id = auth.uid();

    if not found then
        return jsonb_build_object(
            'autenticado', true,
            'registrado', false,
            'ativo', false,
            'papel', 'nenhum'
        );
    end if;

    return jsonb_build_object(
        'autenticado', true,
        'registrado', true,
        'id', v_admin.id,
        'email', v_admin.email,
        'nome', v_admin.nome,
        'papel', v_admin.papel,
        'ativo', v_admin.ativo
    );
end;
$$;

-- ----------------------------------------------------------------------------
-- 10. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------

-- usuarios_administradores
alter table public.usuarios_administradores enable row level security;

drop policy if exists "Usuários podem consultar seu próprio status de admin" on public.usuarios_administradores;
create policy "Usuários podem consultar seu próprio status de admin" 
    on public.usuarios_administradores for select 
    using (auth.uid() = id or public.is_admin());

drop policy if exists "Apenas administradores gerenciam outros administradores" on public.usuarios_administradores;
create policy "Apenas administradores gerenciam outros administradores" 
    on public.usuarios_administradores for all 
    using (public.is_admin());

-- registros_saldos
alter table public.registros_saldos enable row level security;

drop policy if exists "Público pode registrar saldos" on public.registros_saldos;
create policy "Público pode registrar saldos"
    on public.registros_saldos for insert
    with check (true);

drop policy if exists "Apenas administradores consultam saldos" on public.registros_saldos;
create policy "Apenas administradores consultam saldos"
    on public.registros_saldos for select
    using (public.is_admin());

drop policy if exists "Apenas administradores gerenciam saldos" on public.registros_saldos;
create policy "Apenas administradores gerenciam saldos"
    on public.registros_saldos for all
    using (public.is_admin());

-- comunicados_comitiva
alter table public.comunicados_comitiva enable row level security;

drop policy if exists "Comunicados publicados são públicos" on public.comunicados_comitiva;
create policy "Comunicados publicados são públicos" 
    on public.comunicados_comitiva for select 
    using (publicado = true or public.is_admin());

drop policy if exists "Apenas administradores gerenciam comunicados" on public.comunicados_comitiva;
create policy "Apenas administradores gerenciam comunicados" 
    on public.comunicados_comitiva for all 
    using (public.is_admin());

-- logs_auditoria
alter table public.logs_auditoria enable row level security;

drop policy if exists "Apenas administradores visualizam logs de auditoria" on public.logs_auditoria;
create policy "Apenas administradores visualizam logs de auditoria" 
    on public.logs_auditoria for select 
    using (public.is_admin());

drop policy if exists "Inserção de logs permitida" on public.logs_auditoria;
drop policy if exists "Apenas autenticados inserem logs" on public.logs_auditoria;
create policy "Apenas autenticados inserem logs"
    on public.logs_auditoria for insert
    with check (auth.role() = 'authenticated' or public.is_admin());

-- ----------------------------------------------------------------------------
-- 11. BUCKET DE STORAGE PARA COMPROVANTES
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 12. CONFIGURAÇÃO DO SUPER ADMIN THALES
-- ----------------------------------------------------------------------------
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where lower(email) = 'arq.thales@me.com';

insert into public.usuarios_administradores (id, email, nome, papel, ativo)
select 
    id, 
    email, 
    'Thales (Administrador Geral)', 
    'admin', 
    true
from auth.users 
where lower(email) = 'arq.thales@me.com'
on conflict (id) do update 
set papel = 'admin', ativo = true;

-- ----------------------------------------------------------------------------
-- 13. RECARREGAR O CACHE DO SCHEMA DO POSTGREST
-- ----------------------------------------------------------------------------
notify pgrst, 'reload schema';
