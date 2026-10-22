-- Migration: Schema da Comitiva dos Operadores SpreadHunter
-- Database: Supabase PostgreSQL

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- 1. TABELA: categorias
create table if not exists public.categorias (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    slug text not null unique,
    descricao text,
    icone text default 'HelpCircle',
    ordem integer default 0,
    created_at timestamptz not null default now()
);

-- 2. TABELA: questionamentos (Demandas dos operadores)
create table if not exists public.questionamentos (
    id uuid primary key default gen_random_uuid(),
    categoria_id uuid references public.categorias(id) on delete set null,
    titulo text not null,
    descricao text not null,
    impacto text not null default 'Médio', -- 'Baixo', 'Médio', 'Alto', 'Crítico'
    autor_nome text not null default 'Operador SpreadHunter',
    autor_email text,
    status text not null default 'pendente', -- 'pendente', 'em_analise', 'encaminhado', 'respondido', 'concluido', 'rejeitado'
    apoios_count integer not null default 0,
    visualizacoes integer not null default 0,
    resposta_resumo text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Index for searching and filtering
create index if not exists idx_questionamentos_status on public.questionamentos(status);
create index if not exists idx_questionamentos_categoria on public.questionamentos(categoria_id);
create index if not exists idx_questionamentos_created on public.questionamentos(created_at desc);
create index if not exists idx_questionamentos_titulo_trgm on public.questionamentos using gin (titulo gin_trgm_ops);

-- 3. TABELA: apoios (Sistema anti-duplicidade de votos/apoios)
create table if not exists public.apoios (
    id uuid primary key default gen_random_uuid(),
    questionamento_id uuid not null references public.questionamentos(id) on delete cascade,
    identificador_eleitor text not null, -- Hash de IP/Fingerprint/Sessão do operador
    created_at timestamptz not null default now(),
    constraint uq_questionamento_eleitor unique (questionamento_id, identificador_eleitor)
);

create index if not exists idx_apoios_questionamento on public.apoios(questionamento_id);
create index if not exists idx_apoios_identificador on public.apoios(identificador_eleitor);

-- 4. TABELA: historico_atualizacoes (Linha do tempo da demanda)
create table if not exists public.historico_atualizacoes (
    id uuid primary key default gen_random_uuid(),
    questionamento_id uuid not null references public.questionamentos(id) on delete cascade,
    autor_id uuid references auth.users(id) on delete set null,
    autor_nome text not null default 'Comitiva dos Operadores',
    tipo text not null default 'status_change', -- 'status_change', 'atualizacao_publica', 'reuniao', 'resposta_oficial'
    status_anterior text,
    novo_status text,
    descricao text not null,
    publico boolean not null default true,
    created_at timestamptz not null default now()
);

create index if not exists idx_historico_questionamento on public.historico_atualizacoes(questionamento_id, created_at asc);

-- 5. TABELA: respostas_rentalhash (Posicionamentos oficiais da RentalHash)
create table if not exists public.respostas_rentalhash (
    id uuid primary key default gen_random_uuid(),
    questionamento_id uuid not null references public.questionamentos(id) on delete cascade,
    titulo text not null,
    conteudo text not null,
    autor_representante text not null default 'Diretoria RentalHash',
    data_resposta timestamptz not null default now(),
    documento_anexo_url text,
    status_validacao text not null default 'oficial', -- 'preliminar', 'oficial', 'em_revisao'
    created_at timestamptz not null default now()
);

create index if not exists idx_respostas_questionamento on public.respostas_rentalhash(questionamento_id);

-- 6. TABELA: comunicados_comitiva (Mural de avisos gerais)
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

-- 7. TABELA: usuarios_administradores (Membros autorizados da comitiva)
create table if not exists public.usuarios_administradores (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null unique,
    nome text not null,
    papel text not null default 'moderador', -- 'admin', 'moderador'
    ativo boolean not null default true,
    created_at timestamptz not null default now()
);

-- 8. TABELA: logs_auditoria (Rastreabilidade das ações)
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

--------------------------------------------------------------------------------
-- HELPER FUNCTIONS & TRIGGERS
--------------------------------------------------------------------------------

-- Função para verificar se usuário autenticado é admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.usuarios_administradores
    where id = auth.uid() and ativo = true
  );
$$;

-- Função trigger para atualizar updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_questionamentos_updated_at on public.questionamentos;
create trigger trg_questionamentos_updated_at
before update on public.questionamentos
for each row execute function public.set_updated_at();

drop trigger if exists trg_comunicados_updated_at on public.comunicados_comitiva;
create trigger trg_comunicados_updated_at
before update on public.comunicados_comitiva
for each row execute function public.set_updated_at();

-- Trigger para manter apoios_count sincronizado
create or replace function public.sync_apoios_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (TG_OP = 'INSERT') then
    update public.questionamentos
    set apoios_count = apoios_count + 1
    where id = new.questionamento_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.questionamentos
    set apoios_count = greatest(0, apoios_count - 1)
    where id = old.questionamento_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_apoios on public.apoios;
create trigger trg_sync_apoios
after insert or delete on public.apoios
for each row execute function public.sync_apoios_count();

-- RPC: Registrar apoio com prevenção de duplicidade
create or replace function public.registrar_apoio(
    p_questionamento_id uuid,
    p_identificador text
)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_ja_apoiou boolean;
    v_novo_total integer;
begin
    -- Verificar se já apoiou
    select exists(
        select 1 from public.apoios
        where questionamento_id = p_questionamento_id
          and identificador_eleitor = p_identificador
    ) into v_ja_apoiou;

    if v_ja_apoiou then
        -- Se já apoiou, remove o apoio (toggle/desfazer)
        delete from public.apoios
        where questionamento_id = p_questionamento_id
          and identificador_eleitor = p_identificador;
          
        select apoios_count into v_novo_total
        from public.questionamentos
        where id = p_questionamento_id;

        return jsonb_build_object(
            'success', true,
            'apoiado', false,
            'message', 'Apoio removido com sucesso.',
            'novo_total', coalesce(v_novo_total, 0)
        );
    else
        -- Insere novo apoio
        insert into public.apoios (questionamento_id, identificador_eleitor)
        values (p_questionamento_id, p_identificador);

        select apoios_count into v_novo_total
        from public.questionamentos
        where id = p_questionamento_id;

        return jsonb_build_object(
            'success', true,
            'apoiado', true,
            'message', 'Apoio registrado com sucesso!',
            'novo_total', coalesce(v_novo_total, 0)
        );
    end if;
exception when unique_violation then
    return jsonb_build_object(
        'success', false,
        'apoiado', true,
        'message', 'Você já apoiou este questionamento anteriormente.'
    );
end;
$$;

-- RPC: Busca inteligente de questionamentos semelhantes
create or replace function public.buscar_questionamentos_semelhantes(
    p_termo text,
    p_limite integer default 5
)
returns table (
    id uuid,
    titulo text,
    descricao text,
    status text,
    apoios_count integer,
    similarity real
)
language plpgsql
security definer
as $$
begin
    return query
    select 
        q.id,
        q.titulo,
        q.descricao,
        q.status,
        q.apoios_count,
        similarity(q.titulo, p_termo) as similarity
    from public.questionamentos q
    where q.status in ('pendente', 'em_analise', 'encaminhado', 'respondido', 'concluido')
      and (
        q.titulo ilike '%' || p_termo || '%'
        or similarity(q.titulo, p_termo) > 0.15
        or q.descricao ilike '%' || p_termo || '%'
      )
    order by similarity desc, q.apoios_count desc
    limit p_limite;
end;
$$;

-- RPC: Gerenciar administradores (adicionar ou promover)
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
begin
    -- Localizar ID do usuário no auth.users
    select id into v_user_id from auth.users where lower(email) = lower(trim(p_email)) limit 1;

    if v_user_id is null then
        return jsonb_build_object(
            'success', false, 
            'error', 'Usuário com o email ' || p_email || ' ainda não se cadastrou no sistema.'
        );
    end if;

    -- Confirmar email automaticamente caso ainda não esteja confirmado
    update auth.users
    set email_confirmed_at = coalesce(email_confirmed_at, now())
    where id = v_user_id;

    -- Insere ou atualiza na tabela de administradores
    insert into public.usuarios_administradores (id, email, nome, papel, ativo)
    values (v_user_id, lower(trim(p_email)), p_nome, p_papel, true)
    on conflict (id) do update set
        papel = p_papel,
        nome = p_nome,
        ativo = true;

    return jsonb_build_object('success', true, 'message', 'Administrador configurado com sucesso!');
end;
$$;

-- RPC: Auto-cadastro na página secreta de novos membros
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
    -- Validação do código de acesso
    if trim(p_codigo_secreto) != 'SPREADHUNTER2026' 
       and trim(p_codigo_secreto) != 'SPREADHUNTER2025' 
       and trim(p_codigo_secreto) != 'RENTAL2026' then
        return jsonb_build_object('success', false, 'error', 'Código de segurança de convite inválido.');
    end if;

    -- Localizar ID do usuário recém-criado no auth.users
    select id into v_user_id from auth.users where lower(email) = lower(trim(p_email)) limit 1;

    if v_user_id is null then
        return jsonb_build_object('success', false, 'error', 'Conta ainda não encontrada no sistema de autenticação.');
    end if;

    -- Confirmação automática de email para liberação de login
    update auth.users
    set email_confirmed_at = coalesce(email_confirmed_at, now())
    where id = v_user_id;

    -- Inserção na tabela de administradores/equipe com papel inicial de moderador
    insert into public.usuarios_administradores (id, email, nome, papel, ativo)
    values (v_user_id, lower(trim(p_email)), p_nome, 'moderador', true)
    on conflict (id) do update set
        nome = p_nome,
        ativo = true;

    return jsonb_build_object('success', true, 'message', 'Cadastro realizado com sucesso! Sua conta está liberada para login.');
end;
$$;

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------------------------------

alter table public.categorias enable row level security;
alter table public.questionamentos enable row level security;
alter table public.apoios enable row level security;
alter table public.historico_atualizacoes enable row level security;
alter table public.respostas_rentalhash enable row level security;
alter table public.comunicados_comitiva enable row level security;
alter table public.usuarios_administradores enable row level security;
alter table public.logs_auditoria enable row level security;

-- Categorias
drop policy if exists "Categorias são visíveis publicamente" on public.categorias;
create policy "Categorias são visíveis publicamente" 
    on public.categorias for select using (true);

drop policy if exists "Apenas administradores gerenciam categorias" on public.categorias;
create policy "Apenas administradores gerenciam categorias" 
    on public.categorias for all using (public.is_admin());

-- Questionamentos
drop policy if exists "Público visualiza questionamentos aprovados e ativos" on public.questionamentos;
create policy "Público visualiza questionamentos aprovados e ativos" 
    on public.questionamentos for select 
    using (status in ('em_analise', 'encaminhado', 'respondido', 'concluido') or public.is_admin());

drop policy if exists "Público pode submeter novos questionamentos" on public.questionamentos;
create policy "Público pode submeter novos questionamentos" 
    on public.questionamentos for insert 
    with check (true);

drop policy if exists "Administradores gerenciam questionamentos" on public.questionamentos;
create policy "Administradores gerenciam questionamentos" 
    on public.questionamentos for all 
    using (public.is_admin());

-- Apoios
drop policy if exists "Público pode visualizar apoios" on public.apoios;
create policy "Público pode visualizar apoios" 
    on public.apoios for select using (true);

drop policy if exists "Público pode registrar apoios" on public.apoios;
create policy "Público pode registrar apoios" 
    on public.apoios for insert with check (true);

drop policy if exists "Público pode remover seu próprio apoio ou admin gerenciar" on public.apoios;
create policy "Público pode remover seu próprio apoio ou admin gerenciar" 
    on public.apoios for delete 
    using (public.is_admin() or identificador_eleitor is not null);

-- Histórico de Atualizações
drop policy if exists "Público pode visualizar atualizações marcadas como públicas" on public.historico_atualizacoes;
create policy "Público pode visualizar atualizações marcadas como públicas" 
    on public.historico_atualizacoes for select 
    using (publico = true or public.is_admin());

drop policy if exists "Apenas administradores gerenciam histórico" on public.historico_atualizacoes;
create policy "Apenas administradores gerenciam histórico" 
    on public.historico_atualizacoes for all 
    using (public.is_admin());

-- Respostas RentalHash
drop policy if exists "Respostas oficiais são públicas" on public.respostas_rentalhash;
create policy "Respostas oficiais são públicas" 
    on public.respostas_rentalhash for select using (true);

drop policy if exists "Apenas administradores inserem/alteram respostas" on public.respostas_rentalhash;
create policy "Apenas administradores inserem/alteram respostas" 
    on public.respostas_rentalhash for all 
    using (public.is_admin());

-- Comunicados da Comitiva
drop policy if exists "Comunicados publicados são públicos" on public.comunicados_comitiva;
create policy "Comunicados publicados são públicos" 
    on public.comunicados_comitiva for select 
    using (publicado = true or public.is_admin());

drop policy if exists "Apenas administradores gerenciam comunicados" on public.comunicados_comitiva;
create policy "Apenas administradores gerenciam comunicados" 
    on public.comunicados_comitiva for all 
    using (public.is_admin());

-- Usuários Administradores
drop policy if exists "Usuários podem consultar seu próprio status de admin" on public.usuarios_administradores;
create policy "Usuários podem consultar seu próprio status de admin" 
    on public.usuarios_administradores for select 
    using (auth.uid() = id or public.is_admin());

drop policy if exists "Apenas administradores gerenciam outros administradores" on public.usuarios_administradores;
create policy "Apenas administradores gerenciam outros administradores" 
    on public.usuarios_administradores for all 
    using (public.is_admin());

-- Logs de Auditoria
drop policy if exists "Apenas administradores visualizam logs de auditoria" on public.logs_auditoria;
create policy "Apenas administradores visualizam logs de auditoria" 
    on public.logs_auditoria for select 
    using (public.is_admin());

drop policy if exists "Inserção de logs permitida" on public.logs_auditoria;
create policy "Inserção de logs permitida" 
    on public.logs_auditoria for insert 
    with check (true);

--------------------------------------------------------------------------------
-- SEED DATA (Categorias e Dados Iniciais)
--------------------------------------------------------------------------------

insert into public.categorias (nome, slug, descricao, icone, ordem) values
('Repasses & Pagamentos', 'repasses-pagamentos', 'Dúvidas sobre cálculo de rendimentos, atrasos de pagamento e depósitos', 'DollarSign', 1),
('Contratos & Regras', 'contratos-regras', 'Cláusulas contratuais, vigência, renovação e penalidades do serviço de aluguel', 'FileText', 2),
('Máquinas & Hashrate', 'maquinas-hashrate', 'Potência contratada, paradas para manutenção, eficiência e entrega de hashrate', 'Cpu', 3),
('Suporte & Comunicação', 'suporte-comunicacao', 'Canais de atendimento, tempo de resposta dos tickets e transparência da RentalHash', 'MessageSquare', 4),
('Taxas & Custos Operacionais', 'taxas-custos', 'Custos de energia, taxas de administração, taxas de pool e descontos operacionais', 'Percent', 5),
('Geral & Outros', 'geral-outros', 'Outros questionamentos pertinentes à operação conjunta dos membros da comitiva', 'HelpCircle', 6)
on conflict (slug) do nothing;

-- Exemplo inicial de comunicado oficial da comitiva
insert into public.comunicados_comitiva (titulo, slug, resumo, conteudo, autor_nome, publicado, destaque, data_publicacao) values
(
  'Criação Oficial da Comitiva dos Operadores SpreadHunter',
  'criacao-oficial-comitiva-spreadhunter',
  'Canal unificado criado para consolidar dúvidas, cobrar transparência e representar operadores perante a RentalHash.',
  'Informamos a todos os operadores do SpreadHunter que este portal foi instituído pela Comitiva para centralizar todas as dúvidas, inconsistências de repasse, relatórios de hashrate e questionamentos jurídicos e operacionais.\n\nPor meio desta plataforma, cada operador pode registrar sua dúvida ou apoiar demandas já abertas por outros colegas. As demandas com maior volume de apoios e relevância coletiva serão priorizadas em nossas pautas de reunião e notificações formais com a diretoria da RentalHash.\n\nParticipe ativamente e acompanhe as atualizações em tempo real.',
  'Comitiva Geral SpreadHunter',
  true,
  true,
  now()
)
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- CONFIGURAÇÃO DO ADMINISTRADOR PRINCIPAL (Thales)
-- -----------------------------------------------------------------------------
-- Confirmação imediata de email para arq.thales@me.com caso já exista no auth.users
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where lower(email) = 'arq.thales@me.com';

-- Registro automático como Administrador Pleno na tabela da comitiva
insert into public.usuarios_administradores (id, email, nome, papel, ativo)
select 
    id, 
    email, 
    'Thales (Administrador)', 
    'admin', 
    true
from auth.users 
where lower(email) = 'arq.thales@me.com'
on conflict (id) do update 
set papel = 'admin', ativo = true;
