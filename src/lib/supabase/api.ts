import { supabase } from './client';
import { 
  Categoria, 
  Questionamento, 
  HistoricoAtualizacao, 
  RespostaRentalHash, 
  ComunicadoComitiva, 
  SimilarQuestionResult,
  StatusDemanda,
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
          status: 'pendente', // Submetido para moderação / aprovação da comitiva
          apoios_count: 1, // Autor apoia por padrão
          visualizacoes: 0
        }
      ])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Registra log no histórico inicial
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
    // Tenta primeiro pela RPC inteligente de similaridade trigram
    const { data: rpcData, error: rpcError } = await supabase.rpc('buscar_questionamentos_semelhantes', {
      p_termo: term.trim(),
      p_limite: 5
    });

    if (!rpcError && rpcData && rpcData.length > 0) {
      return rpcData as SimilarQuestionResult[];
    }

    // Fallback para query com ILIKE
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
    // Tenta utilizar a stored procedure registrar_apoio para transação atômica
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

    // Fallback direto via tabelas caso RPC ainda não tenha sido criada
    const { data: existing } = await supabase
      .from('apoios')
      .select('id')
      .eq('questionamento_id', questionamentoId)
      .eq('identificador_eleitor', identificador)
      .single();

    if (existing) {
      // Remove apoio
      await supabase.from('apoios').delete().eq('id', existing.id);
      return { success: true, apoiado: false, novoTotal: 0, message: 'Apoio removido' };
    } else {
      // Adiciona apoio
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
      .select('id, ativo')
      .eq('id', userId)
      .eq('ativo', true)
      .single();

    if (error || !data) return false;
    return true;
  } catch {
    return false;
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

    // Adiciona ao histórico de atualizações
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

    // Registra auditoria
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

    // Atualiza status do questionamento para 'respondido'
    await supabase
      .from('questionamentos')
      .update({ 
        status: 'respondido', 
        resposta_resumo: payload.titulo,
        updated_at: new Date().toISOString() 
      })
      .eq('id', payload.questionamento_id);

    // Registra no histórico
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
