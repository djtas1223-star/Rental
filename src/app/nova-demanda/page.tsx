'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  PlusCircle, 
  ShieldCheck, 
  Clock, 
  HelpCircle,
  FileCheck2,
  Users
} from 'lucide-react';
import { Categoria, Questionamento } from '@/types/database';
import { fetchCategorias, fetchQuestionamentoById } from '@/lib/supabase/api';
import NewQuestionForm from '@/components/NewQuestionForm';
import QuestionModal from '@/components/QuestionModal';
import { getVotedQuestionIds } from '@/lib/voter-id';

export default function NovaDemandaPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDemanda, setSelectedDemanda] = useState<Questionamento | null>(null);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCategorias()
      .then((data) => setCategorias(data))
      .finally(() => setLoading(false));
    setVotedIds(getVotedQuestionIds());
  }, []);

  const handleSelectSimilar = async (id: string) => {
    const q = await fetchQuestionamentoById(id);
    if (q) {
      setSelectedDemanda(q);
    }
  };

  const handleVoteChange = (id: string, newTotal: number, voted: boolean) => {
    setVotedIds((prev) => {
      const next = new Set(prev);
      if (voted) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Navegação de Retorno */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voltar ao Portal Principal</span>
        </Link>
      </div>

      {/* Orientações para Envio de Demanda */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-md border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Processo Oficial de Coleta de Demandas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Registrar Nova Demanda ou Dúvida
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Sua dúvida será analisada pela comitiva e consolidada em pautas de reunião formal com a diretoria da RentalHash. Outros operadores poderão apoiar seu questionamento para aumentar o peso da reivindicação.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Triagem em até 48h</span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Apoio coletivo aberto</span>
          </div>
        </div>
      </div>

      {/* Formulário com Verificação Inteligente de Semelhantes */}
      <NewQuestionForm
        categorias={categorias}
        onSelectSimilar={handleSelectSimilar}
      />

      {/* Modal para Visualizar e Apoiar Demanda Semelhante */}
      <QuestionModal
        questionamento={selectedDemanda}
        onClose={() => setSelectedDemanda(null)}
        isVotedInitial={selectedDemanda ? votedIds.has(selectedDemanda.id) : false}
        onVoteChange={handleVoteChange}
      />
    </div>
  );
}
