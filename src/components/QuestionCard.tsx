'use client';

import React, { useState } from 'react';
import { 
  ThumbsUp, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Send, 
  AlertCircle, 
  Tag, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { Questionamento, StatusDemanda } from '@/types/database';
import { toggleApoioQuestionamento } from '@/lib/supabase/api';
import { getVoterIdentifier, saveVotedQuestionId } from '@/lib/voter-id';

interface QuestionCardProps {
  questionamento: Questionamento;
  isVotedInitial?: boolean;
  onOpenDetails: (q: Questionamento) => void;
  onVoteChange?: (id: string, newTotal: number, voted: boolean) => void;
}

export function StatusBadge({ status }: { status: StatusDemanda }) {
  switch (status) {
    case 'pendente':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3" /> Triagem Pendente
        </span>
      );
    case 'em_analise':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3 h-3" /> Em Análise pela Comitiva
        </span>
      );
    case 'encaminhado':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Send className="w-3 h-3" /> Com a RentalHash
        </span>
      );
    case 'respondido':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> Respondido Oficialmente
        </span>
      );
    case 'concluido':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          <CheckCircle2 className="w-3 h-3" /> Pauta Concluída
        </span>
      );
    case 'rejeitado':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <AlertCircle className="w-3 h-3" /> Rejeitado / Incompatível
        </span>
      );
    default:
      return null;
  }
}

export function ImpactBadge({ impact }: { impact: string }) {
  let color = 'bg-slate-100 text-slate-700 border-slate-200';
  if (impact === 'Crítico') color = 'bg-rose-50 text-rose-700 border-rose-200';
  if (impact === 'Alto') color = 'bg-orange-50 text-orange-700 border-orange-200';
  if (impact === 'Médio') color = 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${color}`}>
      Impacto: {impact}
    </span>
  );
}

export default function QuestionCard({
  questionamento,
  isVotedInitial = false,
  onOpenDetails,
  onVoteChange,
}: QuestionCardProps) {
  const [voted, setVoted] = useState(isVotedInitial);
  const [apoiosCount, setApoiosCount] = useState(questionamento.apoios_count);
  const [voting, setVoting] = useState(false);

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (voting) return;

    setVoting(true);
    const identifier = getVoterIdentifier();
    
    // Otimista
    const nextVoted = !voted;
    const nextTotal = nextVoted ? apoiosCount + 1 : Math.max(0, apoiosCount - 1);
    setVoted(nextVoted);
    setApoiosCount(nextTotal);
    saveVotedQuestionId(questionamento.id, nextVoted);

    try {
      const res = await toggleApoioQuestionamento(questionamento.id, identifier);
      if (res.success) {
        if (res.novoTotal !== undefined && res.novoTotal !== nextTotal) {
          setApoiosCount(res.novoTotal);
        }
        if (onVoteChange) {
          onVoteChange(questionamento.id, res.novoTotal ?? nextTotal, nextVoted);
        }
      }
    } catch (err) {
      console.error('Erro ao apoiar:', err);
    } finally {
      setVoting(false);
    }
  };

  const temResposta = 
    questionamento.status === 'respondido' || 
    (questionamento.respostas_rentalhash && questionamento.respostas_rentalhash.length > 0);

  return (
    <div 
      onClick={() => onOpenDetails(questionamento)}
      className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-md transition-all p-5 sm:p-6 cursor-pointer flex flex-col justify-between group"
    >
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={questionamento.status} />
            <ImpactBadge impact={questionamento.impacto} />
          </div>

          {questionamento.categoria && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              <Tag className="w-3 h-3 text-slate-400" />
              {questionamento.categoria.nome}
            </span>
          )}
        </div>

        {/* Título & Descrição */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 mb-2">
          {questionamento.titulo}
        </h3>
        
        <p className="text-sm text-slate-600 line-clamp-3 mb-4 leading-relaxed">
          {questionamento.descricao}
        </p>

        {/* Resumo da Resposta Oficial se houver */}
        {temResposta && (
          <div className="mb-4 p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/70 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-900 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Resposta Oficial RentalHash Disponível</span>
            </div>
            <p className="text-emerald-800 line-clamp-2">
              {questionamento.resposta_resumo || 'Posicionamento formal registrado pela comitiva.'}
            </p>
          </div>
        )}
      </div>

      {/* Footer do Card */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="text-xs text-slate-400">
          Por: <span className="font-medium text-slate-600">{questionamento.autor_nome}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de Apoiar */}
          <button
            type="button"
            onClick={handleVote}
            disabled={voting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              voted
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200 hover:border-emerald-200'
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${voted ? 'fill-current' : ''}`} />
            <span>{voted ? 'Apoiado' : 'Apoiar'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              voted ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {apoiosCount}
            </span>
          </button>

          {/* Botão Ver Detalhes */}
          <button 
            type="button"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
