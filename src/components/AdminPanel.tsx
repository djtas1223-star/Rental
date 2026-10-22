'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  User, 
  LogOut, 
  ShieldCheck, 
  FileText, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  MessageSquare, 
  Database, 
  Copy, 
  Check, 
  ListFilter,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { 
  fetchQuestionamentos, 
  adminUpdateQuestionamentoStatus, 
  adminAddRespostaRentalHash, 
  adminCreateComunicado,
  checkIsAdmin
} from '@/lib/supabase/api';
import { Questionamento, StatusDemanda } from '@/types/database';

export default function AdminPanel() {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Admin tabs: 'moderacao' | 'resposta' | 'comunicado' | 'sql'
  const [activeTab, setActiveTab] = useState<'moderacao' | 'resposta' | 'comunicado' | 'sql'>('moderacao');

  // Demands state
  const [demandas, setDemandas] = useState<Questionamento[]>([]);
  const [loadingDemandas, setLoadingDemandas] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // RentalHash response form state
  const [selectedDemandaId, setSelectedDemandaId] = useState('');
  const [respTitulo, setRespTitulo] = useState('');
  const [respConteudo, setRespConteudo] = useState('');
  const [respRepresentante, setRespRepresentante] = useState('Diretoria de Operações RentalHash');
  const [respAnexo, setRespAnexo] = useState('');
  const [respLoading, setRespLoading] = useState(false);

  // Comunicado form state
  const [comTitulo, setComTitulo] = useState('');
  const [comResumo, setComResumo] = useState('');
  const [comConteudo, setComConteudo] = useState('');
  const [comDestaque, setComDestaque] = useState(false);
  const [comLoading, setComLoading] = useState(false);

  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAllDemandas = async () => {
    setLoadingDemandas(true);
    try {
      const data = await fetchQuestionamentos({ includeAllStatus: true, status: 'todos' });
      setDemandas(data);
      if (data.length > 0 && !selectedDemandaId) {
        setSelectedDemandaId(data[0].id);
      }
    } finally {
      setLoadingDemandas(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadAllDemandas();
    }
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthError(error.message);
      } else {
        setSession(data.session);
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Falha ao autenticar');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const handleStatusChange = async (id: string, novoStatus: StatusDemanda, motivo: string) => {
    try {
      const res = await adminUpdateQuestionamentoStatus(
        id, 
        novoStatus, 
        motivo, 
        session?.user?.email || 'Membro da Comitiva'
      );
      if (res.success) {
        setActionSuccess(`Status alterado para "${novoStatus.replace('_', ' ')}" com sucesso!`);
        loadAllDemandas();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        alert(res.error || 'Erro ao alterar status');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePublishResposta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemandaId || !respTitulo || !respConteudo) {
      alert('Selecione uma demanda e preencha o título e conteúdo da resposta.');
      return;
    }

    setRespLoading(true);
    try {
      const res = await adminAddRespostaRentalHash({
        questionamento_id: selectedDemandaId,
        titulo: respTitulo,
        conteudo: respConteudo,
        autor_representante: respRepresentante,
        documento_anexo_url: respAnexo || undefined,
      });

      if (res.success) {
        setActionSuccess('Resposta oficial da RentalHash publicada com sucesso!');
        setRespTitulo('');
        setRespConteudo('');
        setRespAnexo('');
        loadAllDemandas();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        alert(res.error || 'Falha ao publicar resposta');
      }
    } finally {
      setRespLoading(false);
    }
  };

  const handlePublishComunicado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comTitulo || !comResumo || !comConteudo) {
      alert('Preencha todos os campos do comunicado.');
      return;
    }

    setComLoading(true);
    try {
      const res = await adminCreateComunicado({
        titulo: comTitulo,
        resumo: comResumo,
        conteudo: comConteudo,
        autor_nome: session?.user?.email || 'Comitiva Geral SpreadHunter',
        destaque: comDestaque,
      });

      if (res.success) {
        setActionSuccess('Comunicado publicado no mural geral com sucesso!');
        setComTitulo('');
        setComResumo('');
        setComConteudo('');
        setComDestaque(false);
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        alert(res.error || 'Falha ao publicar comunicado');
      }
    } finally {
      setComLoading(false);
    }
  };

  if (loadingSession) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  // TELA DE LOGIN SE NÃO ESTIVER AUTENTICADO
  if (!session) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200/90 shadow-md p-6 sm:p-8">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-center text-slate-900">
          Acesso Restrito da Comitiva
        </h2>
        <p className="text-xs text-center text-slate-500 mb-6 mt-1">
          Área exclusiva para moderação de dúvidas, publicação de respostas da RentalHash e comunicados.
        </p>

        {authError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email do Membro da Comitiva
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="comitiva@spreadhunter.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Senha de Acesso
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {authLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando credenciais...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Entrar no Painel</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Dúvidas de acesso? Contate o coordenador da comitiva ou execute a migration no Supabase SQL Editor.
          </p>
        </div>
      </div>
    );
  }

  // TELA DO PAINEL LOGADO
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 my-8">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Painel de Governança da Comitiva
            </h2>
            <p className="text-xs text-slate-500">
              Conectado como: <strong className="text-slate-700">{session.user.email}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllDemandas}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="my-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 my-6 border-b border-slate-100 pb-3">
        <button
          onClick={() => setActiveTab('moderacao')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'moderacao'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>Triagem & Moderação ({demandas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('resposta')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'resposta'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Publicar Resposta RentalHash</span>
        </button>

        <button
          onClick={() => setActiveTab('comunicado')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'comunicado'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Novo Comunicado / Ata</span>
        </button>

        <button
          onClick={() => setActiveTab('sql')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ml-auto ${
            activeTab === 'sql'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Guia Supabase & Migration</span>
        </button>
      </div>

      {/* TAB 1: MODERAÇÃO */}
      {activeTab === 'moderacao' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">
              Demandas em Pauta e Triagem
            </h3>
            {loadingDemandas && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Carregando...
              </span>
            )}
          </div>

          {demandas.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
              Nenhuma demanda cadastrada no momento.
            </div>
          ) : (
            <div className="space-y-3">
              {demandas.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800 uppercase">
                          {d.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-500">
                          {d.categoria?.nome || 'Geral'} • Apoios: <strong>{d.apoios_count}</strong>
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{d.titulo}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1">{d.descricao}</p>
                    </div>

                    <div className="text-right text-[11px] text-slate-400">
                      Autor: {d.autor_nome} ({d.autor_email || 'Sem email'})
                    </div>
                  </div>

                  {/* Ações de Moderação */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80">
                    <span className="text-[11px] font-semibold text-slate-500 mr-1">
                      Mudar Status:
                    </span>

                    {d.status !== 'em_analise' && (
                      <button
                        onClick={() => handleStatusChange(d.id, 'em_analise', 'Demanda aceita pela comitiva para triagem')}
                        className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-[11px] font-semibold rounded-lg transition-colors"
                      >
                        Colocar Em Análise
                      </button>
                    )}

                    {d.status !== 'encaminhado' && (
                      <button
                        onClick={() => handleStatusChange(d.id, 'encaminhado', 'Pauta formalizada e enviada para a diretoria da RentalHash')}
                        className="px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[11px] font-semibold rounded-lg transition-colors"
                      >
                        Encaminhar à RentalHash
                      </button>
                    )}

                    {d.status !== 'concluido' && (
                      <button
                        onClick={() => handleStatusChange(d.id, 'concluido', 'Demanda resolvida e encerrada em comum acordo')}
                        className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-semibold rounded-lg transition-colors"
                      >
                        Marcar Concluído
                      </button>
                    )}

                    {d.status !== 'rejeitado' && (
                      <button
                        onClick={() => handleStatusChange(d.id, 'rejeitado', 'Demanda fora do escopo ou em desacordo com as regras')}
                        className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-[11px] font-semibold rounded-lg transition-colors"
                      >
                        Rejeitar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PUBLICAR RESPOSTA RENTALHASH */}
      {activeTab === 'resposta' && (
        <form onSubmit={handlePublishResposta} className="space-y-4 max-w-2xl">
          <h3 className="text-sm font-bold text-slate-900">
            Vincular Resposta Oficial da RentalHash a uma Demanda
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Selecione a Demanda Encaminhada
            </label>
            <select
              value={selectedDemandaId}
              onChange={(e) => setSelectedDemandaId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
            >
              {demandas.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.status.toUpperCase()}] {d.titulo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Título da Resposta Oficial
            </label>
            <input
              type="text"
              required
              value={respTitulo}
              onChange={(e) => setRespTitulo(e.target.value)}
              placeholder="Ex: Esclarecimento Oficial da RentalHash sobre Ajustes de Hashrate"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Representante da RentalHash Responsável
            </label>
            <input
              type="text"
              value={respRepresentante}
              onChange={(e) => setRespRepresentante(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Conteúdo Integral do Posicionamento
            </label>
            <textarea
              required
              rows={5}
              value={respConteudo}
              onChange={(e) => setRespConteudo(e.target.value)}
              placeholder="Transcreva o posicionamento fornecido pela empresa..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Link de Documento ou Comprovante (Opcional)
            </label>
            <input
              type="url"
              value={respAnexo}
              onChange={(e) => setRespAnexo(e.target.value)}
              placeholder="https://exemplo.com/documento-oficial.pdf"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={respLoading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2"
          >
            {respLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Publicar Resposta Oficial</span>
          </button>
        </form>
      )}

      {/* TAB 3: COMUNICADOS DA COMITIVA */}
      {activeTab === 'comunicado' && (
        <form onSubmit={handlePublishComunicado} className="space-y-4 max-w-2xl">
          <h3 className="text-sm font-bold text-slate-900">
            Publicar Novo Comunicado ou Ata de Reunião
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Título do Comunicado
            </label>
            <input
              type="text"
              required
              value={comTitulo}
              onChange={(e) => setComTitulo(e.target.value)}
              placeholder="Ex: Ata da Reunião com a Diretoria RentalHash - 22/10"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resumo / Destaque para o Mural
            </label>
            <input
              type="text"
              required
              value={comResumo}
              onChange={(e) => setComResumo(e.target.value)}
              placeholder="Breve frase explicativa para os operadores"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Texto Completo do Comunicado
            </label>
            <textarea
              required
              rows={6}
              value={comConteudo}
              onChange={(e) => setComConteudo(e.target.value)}
              placeholder="Insira os tópicos deliberados, prazos pactuados e orientações aos operadores..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs resize-y"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={comDestaque}
              onChange={(e) => setComDestaque(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Fixar como comunicado prioritário (Destaque no topo)</span>
          </label>

          <button
            type="submit"
            disabled={comLoading}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2"
          >
            {comLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            <span>Publicar Comunicado</span>
          </button>
        </form>
      )}

      {/* TAB 4: SQL MIGRATIONS & SUPABASE GUIDE */}
      {activeTab === 'sql' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
            <h4 className="font-bold mb-1">Instruções para Execução no Supabase</h4>
            <p>
              As tabelas e políticas de RLS estão prontas no arquivo{' '}
              <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-300 font-mono">
                supabase/migrations/20250101000000_comitiva_schema.sql
              </code>
              .
            </p>
            <p className="mt-1">
              Acesse seu painel do Supabase em{' '}
              <a 
                href="https://supabase.com/dashboard/project/plrytbbwjeomqkjgbdlb/sql" 
                target="_blank" 
                rel="noreferrer" 
                className="underline font-bold"
              >
                SQL Editor do Projeto plrytbbwjeomqkjgbdlb
              </a>{' '}
              e clique em "Run" para criar as tabelas com RLS e triggers.
            </p>
          </div>

          <div className="text-xs text-slate-600">
            <p className="font-semibold mb-1">Configuração de Administrador:</p>
            <p>
              Para promover um usuário ao papel de administrador pleno da comitiva, execute no SQL Editor do Supabase:
            </p>
            <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] mt-2 overflow-x-auto">
{`insert into public.usuarios_administradores (id, email, nome, papel, ativo)
values (
  'SEU_USER_ID_DO_AUTH_USERS',
  '${session.user.email}',
  'Operador Comitiva',
  'admin',
  true
)
on conflict (id) do nothing;`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
