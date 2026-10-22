'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlusCircle, 
  AlertTriangle, 
  ThumbsUp, 
  ExternalLink, 
  CheckCircle2, 
  HelpCircle,
  Loader2 
} from 'lucide-react';
import { Categoria, SimilarQuestionResult } from '@/types/database';
import { searchSimilarQuestionamentos, submitQuestionamento } from '@/lib/supabase/api';

interface NewQuestionFormProps {
  categorias: Categoria[];
  onCreated?: () => void;
  onSelectSimilar?: (id: string) => void;
}

export default function NewQuestionForm({ 
  categorias, 
  onCreated,
  onSelectSimilar 
}: NewQuestionFormProps) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [impacto, setImpacto] = useState<'Baixo' | 'Médio' | 'Alto' | 'Crítico'>('Médio');
  const [autorNome, setAutorNome] = useState('');
  const [autorEmail, setAutorEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Similar questions search state
  const [similarQuestions, setSimilarQuestions] = useState<SimilarQuestionResult[]>([]);
  const [searchingSimilar, setSearchingSimilar] = useState(false);

  // Debounced search for similar doubts
  useEffect(() => {
    if (!titulo || titulo.trim().length < 4) {
      setSimilarQuestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingSimilar(true);
      try {
        const results = await searchSimilarQuestionamentos(titulo);
        setSimilarQuestions(results);
      } catch (err) {
        console.warn('Erro buscando semelhantes:', err);
      } finally {
        setSearchingSimilar(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [titulo]);

  // Set default category
  useEffect(() => {
    if (categorias.length > 0 && !categoriaId) {
      setCategoriaId(categorias[0].id);
    }
  }, [categorias, categoriaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !descricao.trim()) {
      setErrorMessage('Por favor, preencha o título e a descrição da sua dúvida.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await submitQuestionamento({
        titulo,
        descricao,
        categoria_id: categoriaId,
        impacto,
        autor_nome: autorNome || 'Operador SpreadHunter',
        autor_email: autorEmail || undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Erro ao registrar questionamento no Supabase.');
      } else {
        setSuccess(true);
        setTitulo('');
        setDescricao('');
        setAutorNome('');
        setAutorEmail('');
        setSimilarQuestions([]);
        if (onCreated) onCreated();

        setTimeout(() => {
          setSuccess(false);
        }, 6000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na conexão com Supabase';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="registrar" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
          <PlusCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Registrar Novo Questionamento ou Dúvida
          </h2>
          <p className="text-sm text-slate-500">
            Sua demanda será analisada pela comitiva e levada às reuniões oficiais com a RentalHash.
          </p>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Questionamento registrado com sucesso!</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              Sua dúvida foi gravada no Supabase e encaminhada para a triagem da comitiva. Você já pode visualizá-la ou apoiá-la.
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Atenção ao registrar</h4>
            <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Título da Dúvida */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-sm font-semibold text-slate-800">
              Título Objetivo da Dúvida <span className="text-red-500">*</span>
            </label>
            {searchingSimilar && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Verificando semelhantes...
              </span>
            )}
          </div>
          <input
            type="text"
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Atraso no fechamento do repasse semanal de hashrate"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
          />
        </div>

        {/* ALERTA DE QUESTIONAMENTOS SEMELHANTES */}
        {similarQuestions.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200/80 transition-all">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Atenção: Encontramos dúvidas semelhantes já cadastradas!</span>
            </div>
            <p className="text-xs text-amber-800 mb-3">
              Para dar mais peso à comitiva, é melhor **apoiar uma demanda já aberta** em vez de criar outra duplicada. Verifique se seu caso é um dos seguintes:
            </p>

            <div className="space-y-2">
              {similarQuestions.map((sim) => (
                <div
                  key={sim.id}
                  className="bg-white p-3 rounded-lg border border-amber-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1">
                    <span className="font-semibold text-slate-800">{sim.titulo}</span>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-medium capitalize">
                        {sim.status.replace('_', ' ')}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <ThumbsUp className="w-3 h-3" /> {sim.apoios_count} apoios
                      </span>
                    </div>
                  </div>
                  {onSelectSimilar && (
                    <button
                      type="button"
                      onClick={() => onSelectSimilar(sim.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-medium border border-emerald-200 transition-colors"
                    >
                      <span>Ver & Apoiar</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categoria e Impacto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Categoria <span className="text-red-500">*</span>
            </label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
            >
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Impacto no Operador <span className="text-red-500">*</span>
            </label>
            <select
              value={impacto}
              onChange={(e) => setImpacto(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
            >
              <option value="Baixo">Baixo (Dúvida informativa)</option>
              <option value="Médio">Médio (Inconsistência operacional pontual)</option>
              <option value="Alto">Alto (Impacta rendimento ou hashrate contínuo)</option>
              <option value="Crítico">Crítico (Paralisação, retenção ou quebra contratual)</option>
            </select>
          </div>
        </div>

        {/* Descrição Detalhada */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            Descrição Detalhada dos Fatos <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva claramente o que ocorreu, datas, números de tickets abertos na RentalHash se houver, máquinas afetadas e o que você solicita de resposta oficial."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all resize-y"
          />
        </div>

        {/* Autor e Email (opcionais) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Seu Nome ou Apelido Operador (Opcional)
            </label>
            <input
              type="text"
              value={autorNome}
              onChange={(e) => setAutorNome(e.target.value)}
              placeholder="Ex: Operador SP #14 ou anônimo"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Email para Notificação de Respostas (Opcional)
            </label>
            <input
              type="email"
              value={autorEmail}
              onChange={(e) => setAutorEmail(e.target.value)}
              placeholder="seu-email@operador.com"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Botão de Envio */}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Dúvidas não expõem seus dados de login.
          </span>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-sm hover:shadow transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gravando no Supabase...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Registrar Demanda</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
