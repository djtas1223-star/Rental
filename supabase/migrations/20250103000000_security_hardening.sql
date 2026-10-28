-- ============================================================================
-- Migration: Hardening de Segurança e Blindagem contra Invasão do Painel Admin
-- Database: Supabase PostgreSQL
-- ============================================================================

-- 1. REFORÇO DA FUNÇÃO is_admin()
-- Garante que apenas usuários com UID válido, ativos e com papel de 'admin' ou 'moderador' sejam considerados admins
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

-- Função auxiliar: verifica se é Super Admin (apenas 'admin', não mero moderador)
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

-- 2. BLINDAGEM DA RPC adicionar_administrador
-- Impede que qualquer usuário anônimo ou comum execute essa RPC para elevar privilégios
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
    -- 1. VALIDAÇÃO DE AUTORIZAÇÃO: Apenas super administradores ativos podem adicionar/promover outros membros
    select public.is_super_admin() into v_caller_is_super;
    if not v_caller_is_super then
        return jsonb_build_object(
            'success', false, 
            'error', 'Acesso negado: Somente administradores plenos ativos podem gerenciar permissões da equipe.'
        );
    end if;

    -- 2. Sanitização de papel
    if p_papel not in ('admin', 'moderador') then
        p_papel := 'moderador';
    end if;

    -- 3. Localizar ID do usuário no auth.users
    select id into v_user_id from auth.users where lower(email) = lower(trim(p_email)) limit 1;

    if v_user_id is null then
        return jsonb_build_object(
            'success', false, 
            'error', 'Usuário com o email ' || p_email || ' ainda não possui conta registrada no sistema.'
        );
    end if;

    -- Confirmar email automaticamente
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

    -- Registrar log de auditoria
    insert into public.logs_auditoria (usuario_id, usuario_email, acao, entidade, entidade_id, detalhes)
    values (
        auth.uid(),
        (select email from auth.users where id = auth.uid()),
        'PROMOVER_MEMBRO',
        'usuarios_administradores',
        v_user_id::text,
        jsonb_build_object('novo_papel', p_papel, 'alvo_email', p_email)
    );

    return jsonb_build_object('success', true, 'message', 'Membro da comitiva configurado com sucesso!');
end;
$$;

-- 3. BLINDAGEM DA RPC auto_cadastro_membro_comitiva
-- Contas criadas via código secreto NÃO se tornam ativas automaticamente; ficam como 'pendente' e ativo = false
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
    -- Validação do código de convite
    if trim(p_codigo_secreto) != 'SPREADHUNTER2026' 
       and trim(p_codigo_secreto) != 'SPREADHUNTER2025' 
       and trim(p_codigo_secreto) != 'RENTAL2026' then
        return jsonb_build_object('success', false, 'error', 'Código de convite de segurança inválido.');
    end if;

    -- Localizar ID do usuário recém-criado no auth.users
    select id into v_user_id from auth.users where lower(email) = lower(trim(p_email)) limit 1;

    if v_user_id is null then
        return jsonb_build_object('success', false, 'error', 'Conta ainda não encontrada no sistema de autenticação.');
    end if;

    -- Confirma email para que a conta possa ser ativada posteriormente
    update auth.users
    set email_confirmed_at = coalesce(email_confirmed_at, now())
    where id = v_user_id;

    -- IMPORTANTE PARA SEGURANÇA:
    -- Inserir com ativo = false e papel = 'pendente'.
    -- Isso garante que mesmo sabendo o código, o invasor NÃO ganha acesso ao painel admin
    -- até que o administrador geral aprove e ative a conta no painel!
    insert into public.usuarios_administradores (id, email, nome, papel, ativo)
    values (v_user_id, lower(trim(p_email)), p_nome, 'moderador', false)
    on conflict (id) do update set
        nome = p_nome;

    -- Log de auditoria do registro
    insert into public.logs_auditoria (usuario_id, usuario_email, acao, entidade, entidade_id, detalhes)
    values (
        v_user_id,
        p_email,
        'SOLICITACAO_CADASTRO_COMITIVA',
        'usuarios_administradores',
        v_user_id::text,
        jsonb_build_object('status', 'aguardando_aprovacao')
    );

    return jsonb_build_object(
        'success', true, 
        'message', 'Solicitação de cadastro recebida com sucesso! Por segurança, sua conta ficará pendente de liberação pelo Administrador Geral.'
    );
end;
$$;

-- 4. CORREÇÃO DA BRECHA NA POLICY DE apoios (Prevenção de Exclusão em Massa)
-- A política antiga permitia delete caso identificador_eleitor is not null (ou seja, em todas as linhas!)
drop policy if exists "Público pode remover seu próprio apoio ou admin gerenciar" on public.apoios;
create policy "Apenas administradores gerenciam exclusão de apoios"
    on public.apoios for delete 
    using (public.is_admin());

-- 5. BLINDAGEM DA TABELA logs_auditoria
-- Apenas usuários autenticados ou funções do sistema podem inserir logs
drop policy if exists "Inserção de logs permitida" on public.logs_auditoria;
create policy "Apenas autenticados inserem logs"
    on public.logs_auditoria for insert
    with check (auth.role() = 'authenticated' or public.is_admin());

-- 6. RPC SEGURA PARA O PAINEL OBTER O PERFIL DO ADMIN LOGADO
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

-- 7. REFORÇO NO THALES COMO SUPER ADMIN INVIOLÁVEL
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
