export type StatusDemanda = 
  | 'pendente' 
  | 'em_analise' 
  | 'encaminhado' 
  | 'respondido' 
  | 'concluido' 
  | 'rejeitado';

export type ImpactoNivel = 'Baixo' | 'Médio' | 'Alto' | 'Crítico';

export interface Categoria {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  icone: string;
  ordem: number;
  created_at: string;
}

export interface Questionamento {
  id: string;
  categoria_id: string | null;
  categoria?: Categoria;
  titulo: string;
  descricao: string;
  impacto: ImpactoNivel;
  autor_nome: string;
  autor_email?: string | null;
  status: StatusDemanda;
  apoios_count: number;
  visualizacoes: number;
  resposta_resumo?: string | null;
  created_at: string;
  updated_at: string;
  respostas_rentalhash?: RespostaRentalHash[];
  historico_atualizacoes?: HistoricoAtualizacao[];
}

export interface RegistroSaldo {
  id: string;
  nome: string;
  email?: string | null;
  whatsapp?: string | null;
  saldo_rentalhash: number;
  moeda_rentalhash: string;
  comprovante_rentalhash_url?: string | null;
  validado_rentalhash: boolean;
  saldo_hashsell: number;
  moeda_hashsell: string;
  comprovante_hashsell_url?: string | null;
  validado_hashsell: boolean;
  observacoes?: string | null;
  status: 'pendente' | 'validado' | 'divergente' | 'rejeitado';
  validado_por?: string | null;
  validado_em?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Apoio {
  id: string;
  questionamento_id: string;
  identificador_eleitor: string;
  created_at: string;
}

export interface HistoricoAtualizacao {
  id: string;
  questionamento_id: string;
  autor_id?: string | null;
  autor_nome: string;
  tipo: 'status_change' | 'atualizacao_publica' | 'reuniao' | 'resposta_oficial';
  status_anterior?: string | null;
  novo_status?: string | null;
  descricao: string;
  publico: boolean;
  created_at: string;
}

export interface RespostaRentalHash {
  id: string;
  questionamento_id: string;
  titulo: string;
  conteudo: string;
  autor_representante: string;
  data_resposta: string;
  documento_anexo_url?: string | null;
  status_validacao: 'preliminar' | 'oficial' | 'em_revisao';
  created_at: string;
}

export interface ComunicadoComitiva {
  id: string;
  titulo: string;
  slug: string;
  resumo: string;
  conteudo: string;
  autor_nome: string;
  publicado: boolean;
  destaque: boolean;
  data_publicacao: string;
  created_at: string;
  updated_at: string;
}

export interface UsuarioAdministrador {
  id: string;
  email: string;
  nome: string;
  papel: 'admin' | 'moderador';
  ativo: boolean;
  created_at: string;
}

export interface LogAuditoria {
  id: string;
  usuario_id?: string | null;
  usuario_email?: string | null;
  acao: string;
  entidade: string;
  entidade_id?: string | null;
  detalhes?: Record<string, unknown>;
  ip_origem?: string | null;
  created_at: string;
}

export interface SimilarQuestionResult {
  id: string;
  titulo: string;
  descricao: string;
  status: StatusDemanda;
  apoios_count: number;
  similarity?: number;
}
