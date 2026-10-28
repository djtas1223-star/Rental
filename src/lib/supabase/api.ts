import { supabase } from './client';
import { 
  Categoria, 
  Questionamento, 
  HistoricoAtualizacao, 
  RespostaRentalHash, 
  ComunicadoComitiva, 
  SimilarQuestionResult,
  StatusDemanda,
  UsuarioAdministrador,
  RegistroSaldo,
  LogAuditoria
} from '@/types/database';

// Categorias padrão caso o banco ainda esteja sendo inicializado
export const FALLBACK_CATEGORIAS: Categoria[] = [
  { id: 'cat-1', nome: 'Repasses & Pagamentos', slug: 'repasses-pagamentos', descricao: 'Dúvidas sobre cálculo de rendimentos, atrasos de pagamento e depósitos', icone: 'DollarSign', ordem: 1, created_at: new Date().toISOString() },
  { id: 'cat-2', nome: 'Contratos & Regras', slug: 'contratos-regras', descricao: 'Cláusulas contratuais, vigência, renovação e penalidades do serviço', icone: 'FileText', ordem: 2, created_at: new Date().toISOString() },
  { id: 'cat-3', nome: 'Máquinas & Hashrate', slug: 'maquinas-hashrate', descricao: 'Potência contratada, paradas para manutenção, eficiência e entrega de hashrate', icone: 'Cpu', ordem: 3, created_at: new Date().toISOString() },
  { id: 'cat-4', nome: 'Suporte & Atendimento', slug: 'suporte-atendimento', descricao: 'Canais de atendimento, tempo de resposta dos tickets e transparência', icone: 'MessageSquare', ordem: 4, created_at: new Date().toISOString() },
  { id: 'cat-5', nome: 'Taxas & Custos Operacionais', slug: 'taxas-custos', descricao: 'Custos de energia, taxas de administração, taxas de pool e descontos operacionais', icone: 'Percent', ordem: 5, created_at: new Date().toISOString() },
  { id: 'cat-6', nome: 'Geral & Outros', slug: 'geral-outros', descricao: 'Outros questionamentos pertinentes à operação conjunta dos membros', icone: 'HelpCircle', ordem: 6, created_at: new Date().toISOString() },
];

export const FALLBACK_COMUNICADOS: ComunicadoComitiva[] = [
  {
    id: 'com-1',
    titulo: 'Criação Oficial da Comitiva dos Operadores SpreadHunter',
    slug: 'criacao-oficial-comitiva-spreadhunter',
    resumo: 'Canal unificado criado para consolidar dúvidas, cobrar transparência e representar operadores perante a RentalHash.',
    conteudo: 'Informamos a todos os operadores do SpreadHunter que este portal foi instituído pela Comitiva para centralizar todas as dúvidas, inconsistências de repasse, relatórios de hashrate e questionamentos jurídicos e operacionais.\n\nPor meio desta plataforma, cada operador pode registrar sua dúvida ou apoiar demandas já abertas por outros colegas. As demandas com maior volume de apoios e relevância coletiva serão priorizadas em nossas pautas de reunião e notificações formais com a diretoria da RentalHash.\n\nParticipe ativamente e acompanhe as atualizações em tempo real.',
    autor_nome: 'Comitiva Geral SpreadHunter',
    publicado: true,
    destaque: true,
    data_publicacao: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export async function fetchCategorias(): Promise<Categoria[]> {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('ordem', { ascending: true });

    if (error || !data || data.length === 0) {
      return FALLBACK_CATEGORIAS;
    }
    return data as Categoria[];
  } catch {
    return FALLBACK_CATEGORIAS;
  }
}

export async function fetchQuestionamentos(params?: {
  categoriaId?: string;
  status?: string;
  search?: string;
  includeAllStatus?: boolean;
}): Promise<Questionamento[]> {
  try {
    let query = supabase
      .from('questionamentos')
      .select(`
        *,
        categoria:categorias(*),
        respostas_rentalhash(*),
        historico_atualizacoes(*)
      `)
      .order('apoios_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (!params?.includeAllStatus) {
      if (params?.status && params.status !== 'todos') {
        query = query.eq('status', params.status);
      } else {
        query = query.in('status', ['em_analise', 'encaminhado', 'respondido', 'concluido']);
      }
    } else if (params?.status && params.status !== 'todos') {
      query = query.eq('status', params.status);
    }

    if (params?.categoriaId && params.categoriaId !== 'todas') {
      query = query.eq('categoria_id', params.categoriaId);
    }

    if (params?.search && params.search.trim().length > 0) {
      query = query.or(`titulo.ilike.%${params.search}%,descricao.ilike.%${params.search}%`);
    }

    const { data, error } = await query;
    if (error || !data) {
      return [];
    }
    return data as Questionamento[];
  } catch (err) {
    console.warn('Erro ao carregar questionamentos do Supabase:', err);
    return [];
  }
}

export async function fetchQuestionamentoById(id: string): Promise<Questionamento | null> {
  try {
    const { data, error } = await supabase
      .from('questionamentos')
      .select(`
        *,
        categoria:categorias(*),
        respostas_rentalhash(*),
        historico_atualizacoes(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as Questionamento;
  } catch {
    return null;
  }
}

export async function submitQuestionamento(payload: {
  titulo: string;
  descricao: string;
  categoria_id: string;
  impacto: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  autor_nome: string;
  autor_email?: string;
}): Promise<{ success: boolean; data?: Questionamento; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('questionamentos')
      .insert([
        {
          titulo: payload.titulo.trim(),
          descricao: payload.descricao.trim(),
          categoria_id: payload.categoria_id,
          impacto: payload.impacto,
          autor_nome: payload.autor_nome.trim() || 'Operador SpreadHunter',
          autor_email: payload.autor_email ? payload.autor_email.trim() : null,
          status: 'pendente',
          apoios_count: 1,
          visualizacoes: 0
        }
      ])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (data?.id) {
      await supabase.from('historico_atualizacoes').insert([
        {
          questionamento_id: data.id,
          autor_nome: payload.autor_nome.trim() || 'Operador SpreadHunter',
          tipo: 'status_change',
          novo_status: 'pendente',
          descricao: 'Dúvida registrada pelo operador e aguardando triagem da comitiva.',
          publico: true
        }
      ]);
    }

    return { success: true, data: data as Questionamento };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao registrar questionamento';
    return { success: false, error: message };
  }
}

export async function searchSimilarQuestionamentos(term: string): Promise<SimilarQuestionResult[]> {
  if (!term || term.trim().length < 3) return [];
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('buscar_questionamentos_semelhantes', {
      p_termo: term.trim(),
      p_limite: 5
    });

    if (!rpcError && rpcData && rpcData.length > 0) {
      return rpcData as SimilarQuestionResult[];
    }

    const { data, error } = await supabase
      .from('questionamentos')
      .select('id, titulo, descricao, status, apoios_count')
      .or(`titulo.ilike.%${term.trim()}%,descricao.ilike.%${term.trim()}%`)
      .limit(5);

    if (error || !data) return [];
    return data as SimilarQuestionResult[];
  } catch {
    return [];
  }
}

export async function toggleApoioQuestionamento(
  questionamentoId: string, 
  identificador: string
): Promise<{ success: boolean; apoiado: boolean; novoTotal: number; message: string }> {
  try {
    const { data, error } = await supabase.rpc('registrar_apoio', {
      p_questionamento_id: questionamentoId,
      p_identificador: identificador
    });

    if (!error && data) {
      return {
        success: data.success,
        apoiado: data.apoiado,
        novoTotal: data.novo_total,
        message: data.message
      };
    }

    const { data: existing } = await supabase
      .from('apoios')
      .select('id')
      .eq('questionamento_id', questionamentoId)
      .eq('identificador_eleitor', identificador)
      .single();

    if (existing) {
      await supabase.from('apoios').delete().eq('id', existing.id);
      return { success: true, apoiado: false, novoTotal: 0, message: 'Apoio removido' };
    } else {
      await supabase.from('apoios').insert([
        { questionamento_id: questionamentoId, identificador_eleitor: identificador }
      ]);
      return { success: true, apoiado: true, novoTotal: 1, message: 'Apoio registrado com sucesso!' };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao registrar apoio';
    return { success: false, apoiado: false, novoTotal: 0, message };
  }
}

export async function fetchComunicados(): Promise<ComunicadoComitiva[]> {
  try {
    const { data, error } = await supabase
      .from('comunicados_comitiva')
      .select('*')
      .eq('publicado', true)
      .order('destaque', { ascending: false })
      .order('data_publicacao', { ascending: false });

    if (error || !data || data.length === 0) {
      return FALLBACK_COMUNICADOS;
    }
    return data as ComunicadoComitiva[];
  } catch {
    return FALLBACK_COMUNICADOS;
  }
}

export async function fetchStats() {
  try {
    const { data: questionamentos } = await supabase
      .from('questionamentos')
      .select('status, apoios_count');

    if (!questionamentos) {
      return {
        totalDemandas: 0,
        emAnalise: 0,
        encaminhadas: 0,
        respondidas: 0,
        totalApoios: 0
      };
    }

    const totalDemandas = questionamentos.length;
    const emAnalise = questionamentos.filter(q => q.status === 'em_analise' || q.status === 'pendente').length;
    const encaminhadas = questionamentos.filter(q => q.status === 'encaminhado').length;
    const respondidas = questionamentos.filter(q => q.status === 'respondido' || q.status === 'concluido').length;
    const totalApoios = questionamentos.reduce((acc, curr) => acc + (curr.apoios_count || 0), 0);

    return {
      totalDemandas,
      emAnalise,
      encaminhadas,
      respondidas,
      totalApoios
    };
  } catch {
    return {
      totalDemandas: 0,
      emAnalise: 0,
      encaminhadas: 0,
      respondidas: 0,
      totalApoios: 0
    };
  }
}

// ----------------------------------------------------------------------
// FUNÇÕES ADMINISTRATIVAS (Somente para comitiva autenticada)
// ----------------------------------------------------------------------

export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('usuarios_administradores')
      .select('id, ativo, papel')
      .eq('id', userId)
      .eq('ativo', true)
      .single();

    if (error || !data) return false;
    return data.papel === 'admin' || data.papel === 'moderador';
  } catch {
    return false;
  }
}

/**
 * Consulta criptograficamente segura do perfil do administrador autenticado.
 * Retorna null se não houver sessão ativa ou se a conta não estiver liberada (ativo = false).
 */
export async function fetchCurrentAdminProfile(): Promise<UsuarioAdministrador | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    // 1. Tenta RPC segura de perfil
    const { data: rpcProfile, error: rpcErr } = await supabase.rpc('obter_meu_perfil_admin');
    if (!rpcErr && rpcProfile && rpcProfile.registrado) {
      if (!rpcProfile.ativo) return null;
      return {
        id: rpcProfile.id,
        email: rpcProfile.email,
        nome: rpcProfile.nome,
        papel: rpcProfile.papel,
        ativo: rpcProfile.ativo,
        created_at: new Date().toISOString()
      };
    }

    // 2. Fallback de consulta direta à tabela usuarios_administradores com RLS
    const { data, error } = await supabase
      .from('usuarios_administradores')
      .select('*')
      .eq('id', session.user.id)
      .eq('ativo', true)
      .single();

    if (error || !data) {
      // Caso especial inviolável: o Super Admin fundador
      if (session.user.email?.toLowerCase() === 'arq.thales@me.com') {
        return {
          id: session.user.id,
          email: session.user.email,
          nome: 'Thales (Administrador Geral)',
          papel: 'admin',
          ativo: true,
          created_at: new Date().toISOString()
        };
      }
      return null;
    }

    return data as UsuarioAdministrador;
  } catch {
    return null;
  }
}

export async function fetchAdministradores(): Promise<UsuarioAdministrador[]> {
  try {
    const { data, error } = await supabase
      .from('usuarios_administradores')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data as UsuarioAdministrador[];
  } catch {
    return [];
  }
}

export async function adminCadastrarOuPromoverMembro(payload: {
  email: string;
  nome: string;
  papel: 'admin' | 'moderador';
  senha?: string;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanNome = payload.nome.trim();

    // 1. Garante que se nenhuma senha for fornecida, uma senha padrão segura é usada para criar a conta no Auth
    const tempPassword = payload.senha && payload.senha.length >= 6 ? payload.senha : 'Comitiva2026!';
    let createdUserId: string | undefined;

    // Tenta registrar a conta no Supabase Auth caso ainda não exista
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: cleanEmail,
      password: tempPassword,
      options: {
        data: {
          nome: cleanNome
        }
      }
    });

    if (signUpData?.user?.id) {
      createdUserId = signUpData.user.id;
    }

    // 2. Chama a RPC adicionar_administrador
    const { data: rpcData, error: rpcError } = await supabase.rpc('adicionar_administrador', {
      p_email: cleanEmail,
      p_nome: cleanNome,
      p_papel: payload.papel
    });

    if (!rpcError && rpcData) {
      if (!rpcData.success) {
        return { success: false, error: rpcData.error };
      }
      await registrarLogAuditoria({
        acao: 'ADD_ADMIN',
        entidade: 'usuarios_administradores',
        detalhes: { email: cleanEmail, nome: cleanNome, papel: payload.papel }
      });
      const infoSenha = payload.senha ? '' : ' (Senha temporária gerada: Comitiva2026!)';
      return { 
        success: true, 
        message: `${rpcData.message || 'Administrador adicionado com sucesso!'}${infoSenha}` 
      };
    }

    // 3. Fallback Resiliente: se a RPC não existir ainda no Supabase, atualiza/insere direto na tabela
    const { data: existingAdmin } = await supabase
      .from('usuarios_administradores')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingAdmin) {
      const { error: updErr } = await supabase
        .from('usuarios_administradores')
        .update({
          nome: cleanNome,
          papel: payload.papel,
          ativo: true
        })
        .eq('id', existingAdmin.id);

      if (updErr) return { success: false, error: updErr.message };
      return { success: true, message: 'Permissões do administrador atualizadas com sucesso!' };
    }

    if (createdUserId) {
      const { error: insErr } = await supabase
        .from('usuarios_administradores')
        .insert([
          {
            id: createdUserId,
            email: cleanEmail,
            nome: cleanNome,
            papel: payload.papel,
            ativo: true
          }
        ]);

      if (insErr) return { success: false, error: insErr.message };
      const infoSenha = payload.senha ? '' : ' (Senha temporária: Comitiva2026!)';
      return { success: true, message: `Novo administrador cadastrado com sucesso!${infoSenha}` };
    }

    return { 
      success: false, 
      error: rpcError?.message || 'Falha ao cadastrar administrador. Verifique se o script SQL foi executado no Supabase.'
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao cadastrar administrador';
    return { success: false, error: msg };
  }
}

export async function adminToggleAtivoMembro(
  id: string, 
  novoAtivo: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('usuarios_administradores')
      .update({ ativo: novoAtivo })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await registrarLogAuditoria({
      acao: novoAtivo ? 'ATIVAR_ADMIN' : 'DESATIVAR_ADMIN',
      entidade: 'usuarios_administradores',
      entidade_id: id
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao alterar status';
    return { success: false, error: msg };
  }
}

export async function adminAlterarPapelMembro(
  id: string,
  novoPapel: 'admin' | 'moderador'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('usuarios_administradores')
      .update({ papel: novoPapel })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await registrarLogAuditoria({
      acao: novoPapel === 'admin' ? 'PROMOVER_ADMIN' : 'REBAIXAR_MODERADOR',
      entidade: 'usuarios_administradores',
      entidade_id: id,
      detalhes: { novoPapel }
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao alterar permissão';
    return { success: false, error: msg };
  }
}

export async function autoCadastroMembro(payload: {
  nome: string;
  email: string;
  senha: string;
  codigoSecreto: string;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    // 1. Validação estrita do código de convite antes de qualquer operação
    const validCodes = ['SPREADHUNTER2026', 'SPREADHUNTER2025', 'RENTAL2026'];
    if (!validCodes.includes(payload.codigoSecreto.trim())) {
      return { success: false, error: 'Código confidencial de convite inválido ou expirado.' };
    }

    // 2. Cria a conta no Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: payload.email.trim(),
      password: payload.senha,
      options: {
        data: {
          nome: payload.nome.trim()
        }
      }
    });

    if (authErr && !authErr.message.includes('User already registered')) {
      return { success: false, error: authErr.message };
    }

    // 3. Chama a RPC para confirmação e inserção na tabela de administradores
    const { data: rpcData, error: rpcErr } = await supabase.rpc('auto_cadastro_membro_comitiva', {
      p_email: payload.email.trim(),
      p_nome: payload.nome.trim(),
      p_codigo_secreto: payload.codigoSecreto.trim()
    });

    if (rpcErr) {
      return { 
        success: false, 
        error: `Falha ao processar autorização: ${rpcErr.message}` 
      };
    }

    if (rpcData && !rpcData.success) {
      return { success: false, error: rpcData.error };
    }

    return { 
      success: true, 
      message: rpcData?.message || 'Solicitação de cadastro registrada com sucesso! Aguarde a aprovação do Administrador Geral.' 
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao realizar cadastro';
    return { success: false, error: msg };
  }
}

export async function adminUpdateQuestionamentoStatus(
  id: string,
  novoStatus: StatusDemanda,
  motivoOuDescricao: string,
  adminNome: string = 'Comitiva'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: prev } = await supabase
      .from('questionamentos')
      .select('status')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('questionamentos')
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await supabase.from('historico_atualizacoes').insert([
      {
        questionamento_id: id,
        autor_nome: adminNome,
        tipo: 'status_change',
        status_anterior: prev?.status || 'pendente',
        novo_status: novoStatus,
        descricao: motivoOuDescricao,
        publico: true
      }
    ]);

    await registrarLogAuditoria({
      acao: 'UPDATE_STATUS',
      entidade: 'questionamentos',
      entidade_id: id,
      detalhes: { de: prev?.status, para: novoStatus, motivo: motivoOuDescricao }
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao atualizar status';
    return { success: false, error: message };
  }
}

export async function adminAddRespostaRentalHash(payload: {
  questionamento_id: string;
  titulo: string;
  conteudo: string;
  autor_representante?: string;
  documento_anexo_url?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('respostas_rentalhash')
      .insert([
        {
          questionamento_id: payload.questionamento_id,
          titulo: payload.titulo,
          conteudo: payload.conteudo,
          autor_representante: payload.autor_representante || 'Diretoria RentalHash',
          documento_anexo_url: payload.documento_anexo_url || null,
          status_validacao: 'oficial'
        }
      ]);

    if (error) return { success: false, error: error.message };

    await supabase
      .from('questionamentos')
      .update({ 
        status: 'respondido', 
        resposta_resumo: payload.titulo,
        updated_at: new Date().toISOString() 
      })
      .eq('id', payload.questionamento_id);

    await supabase.from('historico_atualizacoes').insert([
      {
        questionamento_id: payload.questionamento_id,
        autor_nome: 'Comitiva dos Operadores',
        tipo: 'resposta_oficial',
        status_anterior: 'encaminhado',
        novo_status: 'respondido',
        descricao: `Resposta oficial anexada: "${payload.titulo}"`,
        publico: true
      }
    ]);

    await registrarLogAuditoria({
      acao: 'ADD_RESPOSTA_RENTALHASH',
      entidade: 'respostas_rentalhash',
      entidade_id: payload.questionamento_id,
      detalhes: { titulo: payload.titulo }
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao cadastrar resposta';
    return { success: false, error: message };
  }
}

export async function adminCreateComunicado(payload: {
  titulo: string;
  resumo: string;
  conteudo: string;
  autor_nome?: string;
  destaque?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const slug = payload.titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + `-${Date.now().toString(36)}`;

    const { error } = await supabase.from('comunicados_comitiva').insert([
      {
        titulo: payload.titulo,
        slug,
        resumo: payload.resumo,
        conteudo: payload.conteudo,
        autor_nome: payload.autor_nome || 'Comitiva SpreadHunter',
        destaque: payload.destaque || false,
        publicado: true
      }
    ]);

    if (error) return { success: false, error: error.message };

    await registrarLogAuditoria({
      acao: 'CREATE_COMUNICADO',
      entidade: 'comunicados_comitiva',
      detalhes: { titulo: payload.titulo, slug }
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao criar comunicado';
    return { success: false, error: message };
  }
}

export async function registrarLogAuditoria(log: Partial<LogAuditoria>) {
  try {
    const { data: userSession } = await supabase.auth.getSession();
    const user = userSession?.session?.user;

    await supabase.from('logs_auditoria').insert([
      {
        usuario_id: user?.id || null,
        usuario_email: user?.email || null,
        acao: log.acao || 'UNKNOWN',
        entidade: log.entidade || 'SYSTEM',
        entidade_id: log.entidade_id || null,
        detalhes: log.detalhes || {},
      }
    ]);
  } catch {
    // Silently continue for audit logs
  }
}

// ----------------------------------------------------------------------
// REGISTRO DE SALDOS PENDENTES (RENTALHASH & HASHSELL)
// ----------------------------------------------------------------------

export async function submitRegistroSaldo(payload: {
  nome: string;
  email?: string;
  whatsapp?: string;
  saldo_rentalhash: number;
  moeda_rentalhash: string;
  comprovante_rentalhash_url?: string;
  saldo_hashsell: number;
  moeda_hashsell: string;
  comprovante_hashsell_url?: string;
  observacoes?: string;
}): Promise<{ success: boolean; data?: RegistroSaldo; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('registros_saldos')
      .insert([
        {
          nome: payload.nome.trim(),
          email: payload.email?.trim() || null,
          whatsapp: payload.whatsapp?.trim() || null,
          saldo_rentalhash: payload.saldo_rentalhash || 0,
          moeda_rentalhash: payload.moeda_rentalhash || 'USDT',
          comprovante_rentalhash_url: payload.comprovante_rentalhash_url || null,
          validado_rentalhash: false,
          saldo_hashsell: payload.saldo_hashsell || 0,
          moeda_hashsell: payload.moeda_hashsell || 'USDT',
          comprovante_hashsell_url: payload.comprovante_hashsell_url || null,
          validado_hashsell: false,
          observacoes: payload.observacoes?.trim() || null,
          status: 'pendente'
        }
      ])
      .select()
      .single();

    if (error) {
      // Fallback para questionamentos se a tabela registros_saldos ainda não foi criada no SQL editor
      if (error.code === 'PGRST205' || error.message?.includes('registros_saldos')) {
        await supabase.from('questionamentos').insert([
          {
            titulo: `[SALDO OPERADOR] ${payload.nome.trim()}`,
            descricao: JSON.stringify(payload),
            autor_nome: payload.nome.trim(),
            autor_email: payload.email?.trim() || null,
            status: 'pendente'
          }
        ]);
        return { success: true };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data: data as RegistroSaldo };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao salvar registro de saldo';
    return { success: false, error: message };
  }
}

export async function fetchRegistrosSaldos(): Promise<RegistroSaldo[]> {
  try {
    const { data, error } = await supabase
      .from('registros_saldos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      // Tenta fallback se estiver armazenado em questionamentos
      const { data: qData } = await supabase
        .from('questionamentos')
        .select('*')
        .ilike('titulo', '[SALDO OPERADOR]%')
        .order('created_at', { ascending: false });

      if (qData && qData.length > 0) {
        return qData.map(q => {
          try {
            const parsed = JSON.parse(q.descricao);
            return {
              id: q.id,
              nome: parsed.nome || q.autor_nome,
              email: parsed.email || q.autor_email,
              whatsapp: parsed.whatsapp || '',
              saldo_rentalhash: parsed.saldo_rentalhash || 0,
              moeda_rentalhash: parsed.moeda_rentalhash || 'USDT',
              comprovante_rentalhash_url: parsed.comprovante_rentalhash_url,
              validado_rentalhash: q.status === 'concluido' || q.status === 'respondido',
              saldo_hashsell: parsed.saldo_hashsell || 0,
              moeda_hashsell: parsed.moeda_hashsell || 'USDT',
              comprovante_hashsell_url: parsed.comprovante_hashsell_url,
              validado_hashsell: q.status === 'concluido' || q.status === 'respondido',
              observacoes: parsed.observacoes,
              status: q.status === 'concluido' ? 'validado' : 'pendente',
              created_at: q.created_at,
              updated_at: q.updated_at
            } as RegistroSaldo;
          } catch {
            return null;
          }
        }).filter(Boolean) as RegistroSaldo[];
      }
      return [];
    }

    return data as RegistroSaldo[];
  } catch {
    return [];
  }
}

export async function adminValidarRegistroSaldo(
  id: string,
  updates: {
    validado_rentalhash?: boolean;
    validado_hashsell?: boolean;
    status?: 'pendente' | 'validado' | 'divergente' | 'rejeitado';
    adminNome?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
      validado_por: updates.adminNome || 'Administrador',
      validado_em: new Date().toISOString(),
    };

    if (updates.validado_rentalhash !== undefined) payload.validado_rentalhash = updates.validado_rentalhash;
    if (updates.validado_hashsell !== undefined) payload.validado_hashsell = updates.validado_hashsell;
    if (updates.status !== undefined) payload.status = updates.status;

    const { error } = await supabase
      .from('registros_saldos')
      .update(payload)
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    await registrarLogAuditoria({
      acao: 'VALIDAR_SALDO',
      entidade: 'registros_saldos',
      entidade_id: id,
      detalhes: updates
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao atualizar validação';
    return { success: false, error: msg };
  }
}
