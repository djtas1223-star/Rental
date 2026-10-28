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
  RefreshCw,
  Users,
  UserPlus,
  Shield,
  DollarSign,
  Eye,
  CheckCheck,
  AlertTriangle,
  Download,
  ExternalLink,
  Phone,
  Mail,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { 
  fetchQuestionamentos, 
  adminUpdateQuestionamentoStatus, 
  adminAddRespostaRentalHash, 
  adminCreateComunicado,
  fetchAdministradores,
  adminCadastrarOuPromoverMembro,
  adminToggleAtivoMembro,
  adminAlterarPapelMembro,
  fetchRegistrosSaldos,
  adminValidarRegistroSaldo
} from '@/lib/supabase/api';
import { Questionamento, StatusDemanda, UsuarioAdministrador, RegistroSaldo } from '@/types/database';

export default function AdminPanel() {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Admin tabs: 'saldos' | 'moderacao' | 'resposta' | 'comunicado' | 'administradores'
  const [activeTab, setActiveTab] = useState<'saldos' | 'moderacao' | 'resposta' | 'comunicado' | 'administradores'>('saldos');

  // Saldos state
  const [registrosSaldos, setRegistrosSaldos] = useState<RegistroSaldo[]>([]);
  const [loadingSaldos, setLoadingSaldos] = useState(false);
  const [activePrintModal, setActivePrintModal] = useState<{
    url: string;
    titulo: string;
    operador: string;
    valor: string;
    registroId: string;
    tipo: 'rentalhash' | 'hashsell';
    validado: boolean;
  } | null>(null);

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

  // Administradores state
  const [administradores, setAdministradores] = useState<UsuarioAdministrador[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminNome, setNewAdminNome] = useState('');
  const [newAdminPapel, setNewAdminPapel] = useState<'admin' | 'moderador'>('moderador');
  const [newAdminSenha, setNewAdminSenha] = useState('');
  const [submittingAdmin, setSubmittingAdmin] = useState(false);

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

  const loadAllData = async () => {
    loadSaldos();
    loadAllDemandas();
    loadAdministradores();
  };

  const loadSaldos = async () => {
    setLoadingSaldos(true);
    try {
      const data = await fetchRegistrosSaldos();
      setRegistrosSaldos(data);
    } finally {
      setLoadingSaldos(false);
    }
  };

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

  const loadAdministradores = async () => {
    setLoadingAdmins(true);
    try {
      const data = await fetchAdministradores();
      setAdministradores(data);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadAllData();
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
        if (error.message.includes('Email not confirmed')) {
          setAuthError('Email ainda não confirmado. Execute o comando SQL no Supabase para confirmar imediatamente.');
        } else {
          setAuthError(error.message);
        }
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

  // CÁLCULO DOS SOMATÓRIOS VALIDADOS E PENDENTES
  const totalRentalHashValidado = registrosSaldos
    .filter((r) => r.validado_rentalhash)
    .reduce((acc, r) => acc + (Number(r.saldo_rentalhash) || 0), 0);

  const totalHashsellValidado = registrosSaldos
    .filter((r) => r.validado_hashsell)
    .reduce((acc, r) => acc + (Number(r.saldo_hashsell) || 0), 0);

  const totalGeralValidado = totalRentalHashValidado + totalHashsellValidado;

  const totalPendentesValidacao = registrosSaldos.filter(
    (r) => !r.validado_rentalhash || !r.validado_hashsell
  ).length;

  // AÇÕES DE VALIDAÇÃO DE SALDO (DAR O OK)
  const handleToggleValidacaoItem = async (
    registroId: string,
    tipo: 'rentalhash' | 'hashsell',
    valorAtual: boolean
  ) => {
    const novoValor = !valorAtual;
    try {
      const registro = registrosSaldos.find((r) => r.id === registroId);
      if (!registro) return;

      const updates: any = {
        adminNome: session?.user?.email || 'Administrador',
      };

      if (tipo === 'rentalhash') {
        updates.validado_rentalhash = novoValor;
        if (novoValor && registro.validado_hashsell) {
          updates.status = 'validado';
        }
      } else {
        updates.validado_hashsell = novoValor;
        if (novoValor && registro.validado_rentalhash) {
          updates.status = 'validado';
        }
      }

      const res = await adminValidarRegistroSaldo(registroId, updates);
      if (res.success) {
        setRegistrosSaldos((prev) =>
          prev.map((r) => (r.id === registroId ? { ...r, ...updates } : r))
        );
        setActionSuccess(
          novoValor
            ? `Saldo ${tipo.toUpperCase()} validado com sucesso! Entrou no somatório.`
            : `Validação ${tipo.toUpperCase()} removida.`
        );
        setTimeout(() => setActionSuccess(null), 3500);

        if (activePrintModal) {
          setActivePrintModal((prev) => (prev ? { ...prev, validado: novoValor } : null));
        }
      } else {
        alert(res.error || 'Erro ao validar saldo');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleValidarTudo = async (registroId: string) => {
    try {
      const updates = {
        validado_rentalhash: true,
        validado_hashsell: true,
        status: 'validado' as const,
        adminNome: session?.user?.email || 'Administrador',
      };

      const res = await adminValidarRegistroSaldo(registroId, updates);
      if (res.success) {
        setRegistrosSaldos((prev) =>
          prev.map((r) => (r.id === registroId ? { ...r, ...updates } : r))
        );
        setActionSuccess('Operador 100% validado! Ambos os valores entraram no somatório.');
        setTimeout(() => setActionSuccess(null), 3500);
      } else {
        alert(res.error || 'Erro ao validar registro');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMarcarDivergente = async (registroId: string) => {
    try {
      const updates = {
        validado_rentalhash: false,
        validado_hashsell: false,
        status: 'divergente' as const,
        adminNome: session?.user?.email || 'Administrador',
      };

      const res = await adminValidarRegistroSaldo(registroId, updates);
      if (res.success) {
        setRegistrosSaldos((prev) =>
          prev.map((r) => (r.id === registroId ? { ...r, ...updates } : r))
        );
        setActionSuccess('Registro marcado como Divergente/Inconsistente com o print.');
        setTimeout(() => setActionSuccess(null), 3500);
      } else {
        alert(res.error || 'Erro ao atualizar status');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // EXPORTAR PLANILHA CSV
  const handleExportCSV = () => {
    if (registrosSaldos.length === 0) {
      alert('Nenhum registro para exportar.');
      return;
    }

    const headers = [
      'Nome Operador',
      'Email',
      'WhatsApp',
      'Saldo RentalHash',
      'Moeda RentalHash',
      'RentalHash Validado?',
      'Saldo Hashsell',
      'Moeda Hashsell',
      'Hashsell Validado?',
      'Status Geral',
      'Observações',
      'Data Cadastro'
    ];

    const rows = registrosSaldos.map((r) => [
      `"${r.nome.replace(/"/g, '""')}"`,
      `"${(r.email || '').replace(/"/g, '""')}"`,
      `"${(r.whatsapp || '').replace(/"/g, '""')}"`,
      r.saldo_rentalhash,
      r.moeda_rentalhash,
      r.validado_rentalhash ? 'SIM (OK)' : 'NAO',
      r.saldo_hashsell,
      r.moeda_hashsell,
      r.validado_hashsell ? 'SIM (OK)' : 'NAO',
      r.status.toUpperCase(),
      `"${(r.observacoes || '').replace(/"/g, '""')}"`,
      new Date(r.created_at).toLocaleString('pt-BR')
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `censo_saldos_spreadhunter_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const handleCadastrarAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminNome.trim()) {
      alert('Preencha o email e o nome do administrador.');
      return;
    }

    setSubmittingAdmin(true);
    try {
      const res = await adminCadastrarOuPromoverMembro({
        email: newAdminEmail,
        nome: newAdminNome,
        papel: newAdminPapel,
        senha: newAdminSenha || undefined,
      });

      if (res.success) {
        setActionSuccess(res.message || 'Administrador adicionado com sucesso!');
        setNewAdminEmail('');
        setNewAdminNome('');
        setNewAdminSenha('');
        loadAdministradores();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        alert(res.error || 'Falha ao adicionar administrador.');
      }
    } finally {
      setSubmittingAdmin(false);
    }
  };

  const handleToggleAtivoAdmin = async (id: string, atualAtivo: boolean) => {
    try {
      const res = await adminToggleAtivoMembro(id, !atualAtivo);
      if (res.success) {
        loadAdministradores();
      } else {
        alert(res.error || 'Erro ao alterar status');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAlterarPapelAdmin = async (id: string, novoPapel: 'admin' | 'moderador') => {
    try {
      const res = await adminAlterarPapelMembro(id, novoPapel);
      if (res.success) {
        setActionSuccess(`Permissão alterada para ${novoPapel.toUpperCase()} com sucesso!`);
        loadAdministradores();
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        alert(res.error || 'Erro ao alterar papel');
      }
    } catch (err: any) {
      alert(err.message);
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
          Área exclusiva para validação de saldos, auditoria de comprovantes e governança.
        </p>

        {authError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Erro de Acesso</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">{authError}</p>
            </div>
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
              placeholder="arq.thales@me.com"
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
      </div>
    );
  }

  // TELA DO PAINEL LOGADO
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 my-8 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Painel de Governança & Auditoria da Comitiva
            </h2>
            <p className="text-xs text-slate-500">
              Conectado como: <strong className="text-slate-700">{session.user.email}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllData}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Atualizar dados"
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
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
        <button
          onClick={() => setActiveTab('saldos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'saldos'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Saldos & Validação ({registrosSaldos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('moderacao')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'moderacao'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>Demandas & Pautas ({demandas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('resposta')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
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
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'comunicado'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Novo Comunicado / Ata</span>
        </button>

        <button
          onClick={() => setActiveTab('administradores')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ml-auto ${
            activeTab === 'administradores'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Administradores ({administradores.length})</span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* TAB 1: SALDOS REGISTRADOS & VALIDAÇÃO COM SOMATÓRIOS             */}
      {/* ================================================================ */}
      {activeTab === 'saldos' && (
        <div className="space-y-6">
          {/* CARDS DOS SOMATÓRIOS OFICIAIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Geral Validado */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950 to-slate-900 text-white shadow-md border border-emerald-800/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                Total Geral Auditado
              </span>
              <div className="text-2xl font-black text-white">
                USDT {totalGeralValidado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Soma de todos os saldos validados com print conferido
              </p>
            </div>

            {/* Total RentalHash Validado */}
            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
                RentalHash Validado
              </span>
              <div className="text-xl sm:text-2xl font-black text-blue-900">
                USDT {totalRentalHashValidado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-blue-600 mt-1">
                Comprovantes conferidos e validados com OK
              </p>
            </div>

            {/* Total Hashsell Validado */}
            <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 block mb-1">
                Hashsell Validado
              </span>
              <div className="text-xl sm:text-2xl font-black text-purple-900">
                USDT {totalHashsellValidado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-purple-600 mt-1">
                Comprovantes conferidos e validados com OK
              </p>
            </div>

            {/* Pendentes de Validação */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block mb-1">
                Aguardando Validação
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-900">
                {totalPendentesValidacao} operadores
              </div>
              <p className="text-[11px] text-amber-700 mt-1">
                Cadastros pendentes de conferência do print
              </p>
            </div>
          </div>

          {/* BARRA DE AÇÕES DA TABELA DE SALDOS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Conferência de Prints e Validação de Saldos
              </h3>
              <p className="text-xs text-slate-500">
                Compare o print anexado com o valor declarado pelo operador. Ao clicar em <strong>"Validar (Dar OK)"</strong>, o saldo entra imediatamente no somatório oficial.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                title="Exportar para Excel / CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Planilha CSV</span>
              </button>
            </div>
          </div>

          {/* LISTA / TABELA DE OPERADORES E SALDOS */}
          {loadingSaldos ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
              Carregando registros de saldos...
            </div>
          ) : registrosSaldos.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
              Nenhum operador cadastrou saldos até o momento.
            </div>
          ) : (
            <div className="space-y-4">
              {registrosSaldos.map((reg) => (
                <div
                  key={reg.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    reg.status === 'validado'
                      ? 'bg-emerald-50/20 border-emerald-200'
                      : reg.status === 'divergente'
                      ? 'bg-red-50/20 border-red-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Dados do Operador */}
                    <div className="space-y-1.5 max-w-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{reg.nome}</span>
                        {reg.status === 'validado' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCheck className="w-3 h-3" /> Auditado (OK)
                          </span>
                        ) : reg.status === 'divergente' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Divergente
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Aguardando Validação
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {reg.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{reg.email}</span>
                          </span>
                        )}
                        {reg.whatsapp && (
                          <a
                            href={`https://wa.me/55${reg.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-emerald-700 font-semibold hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{reg.whatsapp}</span>
                          </a>
                        )}
                      </div>

                      {reg.observacoes && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                          "{reg.observacoes}"
                        </p>
                      )}
                    </div>

                    {/* Bloco RentalHash */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 min-w-[220px] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-800 uppercase">
                          RentalHash
                        </span>
                        {reg.validado_rentalhash ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Validado
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
                            Não validado
                          </span>
                        )}
                      </div>

                      <div className="text-base font-bold text-slate-900">
                        {reg.moeda_rentalhash} {Number(reg.saldo_rentalhash).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200">
                        {reg.comprovante_rentalhash_url ? (
                          <button
                            type="button"
                            onClick={() =>
                              setActivePrintModal({
                                url: reg.comprovante_rentalhash_url!,
                                titulo: 'Print Comprovante RentalHash',
                                operador: reg.nome,
                                valor: `${reg.moeda_rentalhash} ${Number(reg.saldo_rentalhash).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                                registroId: reg.id,
                                tipo: 'rentalhash',
                                validado: reg.validado_rentalhash,
                              })
                            }
                            className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Print</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Sem anexo</span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleValidacaoItem(reg.id, 'rentalhash', reg.validado_rentalhash)
                          }
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                            reg.validado_rentalhash
                              ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          }`}
                        >
                          {reg.validado_rentalhash ? 'Desfazer' : 'Dar OK'}
                        </button>
                      </div>
                    </div>

                    {/* Bloco Hashsell */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 min-w-[220px] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-purple-800 uppercase">
                          Hashsell
                        </span>
                        {reg.validado_hashsell ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Validado
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
                            Não validado
                          </span>
                        )}
                      </div>

                      <div className="text-base font-bold text-slate-900">
                        {reg.moeda_hashsell} {Number(reg.saldo_hashsell).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200">
                        {reg.comprovante_hashsell_url ? (
                          <button
                            type="button"
                            onClick={() =>
                              setActivePrintModal({
                                url: reg.comprovante_hashsell_url!,
                                titulo: 'Print Comprovante Hashsell',
                                operador: reg.nome,
                                valor: `${reg.moeda_hashsell} ${Number(reg.saldo_hashsell).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                                registroId: reg.id,
                                tipo: 'hashsell',
                                validado: reg.validado_hashsell,
                              })
                            }
                            className="flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 px-2 py-1 rounded-lg border border-purple-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Print</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Sem anexo</span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleValidacaoItem(reg.id, 'hashsell', reg.validado_hashsell)
                          }
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                            reg.validado_hashsell
                              ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          }`}
                        >
                          {reg.validado_hashsell ? 'Desfazer' : 'Dar OK'}
                        </button>
                      </div>
                    </div>

                    {/* Ações Globais do Operador */}
                    <div className="flex flex-col gap-2 min-w-[130px] justify-center">
                      <button
                        type="button"
                        onClick={() => handleValidarTudo(reg.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1"
                        title="Validar ambos os saldos e dar OK completo"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Validar Tudo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMarcarDivergente(reg.id)}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-[11px] font-medium transition-colors"
                        title="Marcar que o print não confere"
                      >
                        Divergência
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL DE ZOOM E VALIDAÇÃO DO PRINT                               */}
      {/* ================================================================ */}
      {activePrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {activePrintModal.titulo}
                </h3>
                <p className="text-xs text-slate-500">
                  Operador: <strong className="text-slate-700">{activePrintModal.operador}</strong> • Valor Informado:{' '}
                  <strong className="text-emerald-700 font-bold">{activePrintModal.valor}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActivePrintModal(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Imagem em Zoom */}
            <div className="flex-1 overflow-auto p-4 bg-slate-950 flex items-center justify-center">
              <img
                src={activePrintModal.url}
                alt={activePrintModal.titulo}
                className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            {/* Footer do Modal com Botão de Validação Rápida */}
            <div className="p-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Conferência: certifique-se de que o número do print coincide com <strong>{activePrintModal.valor}</strong>.
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={activePrintModal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Original</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    handleToggleValidacaoItem(
                      activePrintModal.registroId,
                      activePrintModal.tipo,
                      activePrintModal.validado
                    );
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                    activePrintModal.validado
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>{activePrintModal.validado ? 'Desfazer Validação' : 'Dar OK e Inserir na Somatória'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2: DEMANDAS & PAUTAS                                         */}
      {/* ================================================================ */}
      {activeTab === 'moderacao' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">
              Demandas Ativas da Comitiva (Exclusivo Administração)
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

      {/* ================================================================ */}
      {/* TAB 3: PUBLICAR RESPOSTA RENTALHASH                              */}
      {/* ================================================================ */}
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

      {/* ================================================================ */}
      {/* TAB 4: COMUNICADOS DA COMITIVA                                   */}
      {/* ================================================================ */}
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

      {/* ================================================================ */}
      {/* TAB 5: GESTÃO DE ADMINISTRADORES                                 */}
      {/* ================================================================ */}
      {activeTab === 'administradores' && (
        <div className="space-y-8 max-w-4xl">
          {/* Card com Link Secreto para Convites */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-900/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> Página Secreta de Cadastro Ativa
                </span>
                <h4 className="text-base font-bold text-white">
                  Envie este link para outros membros se cadastrarem:
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Membros cadastrados aparecem nesta lista para você promover a Administrador.
                </p>
                <div className="mt-2 text-xs font-mono bg-black/40 px-3 py-1.5 rounded-lg border border-white/10 inline-block text-emerald-300">
                  /cadastro-comitiva <span className="text-slate-400 font-sans ml-2">(Código confidencial: SPREADHUNTER2026)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/cadastro-comitiva`;
                    navigator.clipboard.writeText(url);
                    setActionSuccess('Link copiado para a área de transferência!');
                    setTimeout(() => setActionSuccess(null), 3000);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Link Secreto</span>
                </button>
              </div>
            </div>
          </div>

          {/* Formulário para Adicionar Administrador */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Adicionar Novo Administrador da Comitiva
              </h3>
            </div>

            <form onSubmit={handleCadastrarAdmin} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo / Identificação
                  </label>
                  <input
                    type="text"
                    required
                    value={newAdminNome}
                    onChange={(e) => setNewAdminNome(e.target.value)}
                    placeholder="Ex: Carlos - Coordenador SP"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email do Administrador
                  </label>
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Papel / Permissão
                  </label>
                  <select
                    value={newAdminPapel}
                    onChange={(e) => setNewAdminPapel(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="admin">Administrador Pleno (Acesso total)</option>
                    <option value="moderador">Moderador (Triagem e respostas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Senha de Acesso Inicial (Opcional)
                  </label>
                  <input
                    type="password"
                    value={newAdminSenha}
                    onChange={(e) => setNewAdminSenha(e.target.value)}
                    placeholder="Deixe em branco se a conta já existir"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingAdmin}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                {submittingAdmin ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>Salvar Administrador</span>
              </button>
            </form>
          </div>

          {/* Lista de Administradores Cadastrados */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <span>Membros com Acesso Administrativo</span>
              </h3>
              {loadingAdmins && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Atualizando...
                </span>
              )}
            </div>

            {administradores.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-xl">
                Nenhum administrador retornado da tabela.
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold text-left">
                    <tr>
                      <th className="py-3 px-4">Nome</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Papel</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {administradores.map((admin) => (
                      <tr key={admin.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">{admin.nome}</td>
                        <td className="py-3 px-4 text-slate-600">{admin.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                            admin.papel === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {admin.papel}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {admin.ativo ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400">
                              <XCircle className="w-3.5 h-3.5" /> Inativo
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {admin.papel === 'moderador' ? (
                              <button
                                type="button"
                                onClick={() => handleAlterarPapelAdmin(admin.id, 'admin')}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors"
                                title="Promover usuário a Administrador Pleno"
                              >
                                ⭐ Promover a Admin
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAlterarPapelAdmin(admin.id, 'moderador')}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                                title="Mudar papel para moderador"
                              >
                                Rebaixar a Moderador
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleToggleAtivoAdmin(admin.id, admin.ativo)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                                admin.ativo
                                  ? 'text-amber-700 hover:bg-amber-50 border border-amber-200'
                                  : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                              }`}
                            >
                              {admin.ativo ? 'Desativar' : 'Reativar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
