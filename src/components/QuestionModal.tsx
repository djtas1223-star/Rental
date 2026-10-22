'use client';

import React, { useState } from 'react';
import { 
  X, 
  ThumbsUp, 
  Calendar, 
  User, 
  Building2, 
  Clock, 
  FileCheck, 
  ExternalLink,
  History,
  Send
} from 'lucide-react';
import { Questionamento } from '@/types/database';
import { StatusBadge, ImpactBadge } from './QuestionCard';
import { toggleApoioQuestionamento } from '@/lib/supabase/api';
import { getVoterIdentifier, saveVotedQuestionId } from '@/lib/voter-id';

interface QuestionModalProps {
  questionamento: Questionamento | null;
  onClose: () => void;
  isVotedInitial?: boolean;
  onVoteChange?: (id: string, newTotal: number, voted: boolean) => void;
}

export default function QuestionModal({
  questionamento,
  onClose,
  isVotedInitial = false,
  onVoteChange
}: QuestionModalProps) {
  if (!questionamento) return null;

  const [voted, setVoted] = useState(isVotedInitial);
  const [apoiosCount, setApoiosCount] = useState(questionamento.apoios_count);
  const [voting, setVoting] = useState(false);

  const handleVote = async () => {
    if (voting) return;
    setVoting(true);

    const identifier = getVoterIdentifier();
    const nextVoted = !voted;
    const nextTotal = nextVoted ? apoiosCount + 1 : Math.max(0, apoiosCount - 1);
    
    setVoted(nextVoted);
    setApoiosCount(nextTotal);
    saveVotedQuestionId(questionamento.id, nextVoted);

    try {
      const res = await toggleApoioQuestionamento(questionamento.id, identifier);
      if (res.success && res.novoTotal !== undefined) {
        setApoiosCount(res.novoTotal);
      }
      if (onVoteChange) {
        onVoteChange(questionamento.id, res.novoTotal ?? nextTotal, nextVoted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVoting(false);
    }
  };

  const respostas = questionamento.respostas_rentalhash || [];
  const historico = questionamento.historico_atualizacoes || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Modal */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 p-6 flex items-start justify-between gap-4 z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <StatusBadge status={questionamento.status} />
              <ImpactBadge impact={questionamento.impacto} />
              {questionamento.categoria && (
                <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {questionamento.categoria.nome}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {questionamento.titulo}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* Metadados */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Autor: <strong className="text-slate-700">{questionamento.autor_nome}</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Criado em: {new Date(questionamento.created_at).toLocaleDateString('pt-BR')}</span>
            </span>
            <span className="flex items-center gap-1.5 ml-auto">
              <button
                onClick={handleVote}
                disabled={voting}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                  voted
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-300'
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${voted ? 'fill-current' : ''}`} />
                <span>{voted ? 'Você apoiou' : 'Apoiar esta demanda'}</span>
                <span className="ml-1 font-bold">({apoiosCount})</span>
              </button>
            </span>
          </div>

          {/* Descrição Completa */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
              Descrição da Demanda
            </h3>
            <div className="text-sm text-slate-700 leading-relaxed bg-white border border-slate-200 p-4 rounded-xl whitespace-pre-wrap">
              {questionamento.descricao}
            </div>
          </div>

          {/* RESPOSTA OFICIAL RENTALHASH */}
          {respostas.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2 uppercase tracking-wide">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Posicionamento Oficial da RentalHash</span>
              </h3>

              {respostas.map((resp) => (
                <div 
                  key={resp.id} 
                  className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white flex items-center gap-1">
                        <FileCheck className="w-3 h-3" /> Resposta Validada
                      </span>
                      <span className="text-xs font-semibold text-emerald-950">
                        {resp.autor_representante}
                      </span>
                    </div>
                    <span className="text-xs text-emerald-700">
                      Data: {new Date(resp.data_resposta).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">{resp.titulo}</h4>
                  
                  <div className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {resp.conteudo}
                  </div>

                  {resp.documento_anexo_url && (
                    <div className="pt-2">
                      <a
                        href={resp.documento_anexo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Visualizar anexo oficial ou comprovante</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* LINHA DO TEMPO / HISTÓRICO DE ATUALIZAÇÕES */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
              <History className="w-4 h-4 text-slate-500" />
              <span>Histórico de Atualizações da Comitiva</span>
            </h3>

            {historico.length === 0 ? (
              <div className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-100">
                Nenhuma atualização registrada até o momento. A comitiva informará aqui os próximos passos.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {historico.map((hist) => (
                  <div key={hist.id} className="relative">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-semibold text-slate-800">{hist.autor_nome}</span>
                        <span>{new Date(hist.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="text-slate-700 font-medium leading-relaxed">{hist.descricao}</p>
                      {hist.novo_status && (
                        <div className="text-[11px] text-slate-500">
                          Status alterado para:{' '}
                          <span className="font-semibold capitalize text-slate-800">
                            {hist.novo_status.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer do Modal */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-4 px-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
