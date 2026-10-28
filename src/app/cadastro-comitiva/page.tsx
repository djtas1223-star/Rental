'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  KeyRound, 
  User, 
  Mail, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import { autoCadastroMembro } from '@/lib/supabase/api';

export default function CadastroComitivaPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [codigoSecreto, setCodigoSecreto] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Rate Limiting / Proteção contra Brute Force
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  React.useEffect(() => {
    try {
      const stored = sessionStorage.getItem('comitiva_reg_lockout');
      if (stored) {
        const remaining = Math.ceil((parseInt(stored, 10) - Date.now()) / 1000);
        if (remaining > 0) setLockoutTimer(remaining);
        else sessionStorage.removeItem('comitiva_reg_lockout');
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          sessionStorage.removeItem('comitiva_reg_lockout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (lockoutTimer > 0) {
      setErrorMessage(`Muitas tentativas inválidas. Aguarde ${lockoutTimer}s.`);
      return;
    }

    if (senha !== confirmaSenha) {
      setErrorMessage('A confirmação de senha não coincide com a senha informada.');
      return;
    }

    if (senha.length < 6) {
      setErrorMessage('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await autoCadastroMembro({
        nome,
        email,
        senha,
        codigoSecreto,
      });

      if (!res.success) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (nextAttempts >= 5) {
          const lockUntil = Date.now() + 60 * 1000;
          sessionStorage.setItem('comitiva_reg_lockout', lockUntil.toString());
          setLockoutTimer(60);
          setErrorMessage('Múltiplas tentativas com código incorreto. Cadastro bloqueado temporariamente por 60 segundos.');
        } else {
          setErrorMessage(`${res.error || 'Erro ao realizar cadastro.'} (${5 - nextAttempts} tentativas restantes)`);
        }
      } else {
        setSuccess(true);
        sessionStorage.removeItem('comitiva_reg_lockout');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Falha na conexão com Supabase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-8 sm:py-12">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voltar ao Portal Principal</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8">
        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-md">
            <KeyRound className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
            Acesso Restrito
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            Cadastro de Novo Membro
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre-se para obter acesso ao painel interno. O administrador geral poderá promover sua conta a Administrador.
          </p>
        </div>

        {success ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Cadastro Concluído com Sucesso!
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Sua conta com o email <strong>{email}</strong> foi registrada no sistema. O administrador principal agora pode localizá-la no painel e promover seu acesso para <strong>Administrador Pleno</strong>.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                <span>Acessar Painel da Comitiva (/admin)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo / Como deseja ser identificado
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu Nome Completo"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email de Acesso
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu-email@exemplo.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Senha (mín. 6 dígitos)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmaSenha}
                    onChange={(e) => setConfirmaSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código Confidencial de Convite da Comitiva
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={codigoSecreto}
                  onChange={(e) => setCodigoSecreto(e.target.value)}
                  placeholder="Código fornecido pela administração"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>O código de acesso é restrito e deve ser solicitado diretamente ao administrador da comitiva.</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Criando conta de acesso...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Cadastrar Membro da Comitiva</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
