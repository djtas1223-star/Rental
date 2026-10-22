'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  Calendar, 
  User, 
  ChevronLeft, 
  Pin, 
  Share2,
  FileText
} from 'lucide-react';
import { fetchComunicados } from '@/lib/supabase/api';
import { ComunicadoComitiva } from '@/types/database';

export default function ComunicadosPage() {
  const [comunicados, setComunicados] = useState<ComunicadoComitiva[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComunicados()
      .then((data) => setComunicados(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Mural de Comunicados da Comitiva
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Atas de reuniões, avisos urgentes e relatórios de negociação com a RentalHash.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 py-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : comunicados.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
          Nenhum comunicado publicado até o momento.
        </div>
      ) : (
        <div className="space-y-6">
          {comunicados.map((com) => (
            <article
              key={com.id}
              className={`bg-white rounded-2xl border p-6 sm:p-8 shadow-sm transition-all ${
                com.destaque
                  ? 'border-emerald-300 ring-1 ring-emerald-200 bg-emerald-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {com.destaque && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
                      <Pin className="w-3 h-3" /> Fixado / Prioritário
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(com.data_publicacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {com.autor_nome}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                {com.titulo}
              </h2>

              <p className="text-xs sm:text-sm font-medium text-slate-600 mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {com.resumo}
              </p>

              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {com.conteudo}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
