'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  Loader2 
} from 'lucide-react';
import { Categoria } from '@/types/database';
import { submitQuestionamento } from '@/lib/supabase/api';

interface NewQuestionFormProps {
  categorias: Categoria[];
  onCreated?: () => void;
}

export default function NewQuestionForm({ 
  categorias, 
  onCreated
}: NewQuestionFormProps) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoriaId, setCategoriaId] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        impacto: 'Médio', // Padrão
        autor_nome: 'Operador SpreadHunter',
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Erro ao registrar demanda.');
      } else {
        setSuccess(true);
        setTitulo('');
        setDescricao('');
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
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
          <PlusCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Registrar Nova Demanda ou Sugestão
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Preencha os campos abaixo para submeter sua pauta diretamente à comitiva.
          </p>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Demanda registrada com sucesso!</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              Sua solicitação foi enviada e será analisada diretamente pela comitiva.
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
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            Título Objetivo da Dúvida <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Atraso no fechamento do repasse semanal de hashrate"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
          />
        </div>

        {/* Categoria */}
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

        {/* Descrição Detalhada */}
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1.5">
            Descrição Detalhada dos Fatos <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={5}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva claramente o que ocorreu, datas, números de tickets abertos na RentalHash se houver, máquinas afetadas e o que você solicita de resposta oficial."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all resize-y"
          />
        </div>

        {/* Botão de Envio */}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Envio seguro para a equipe da comitiva.
          </span>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-sm hover:shadow transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando demanda...</span>
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
