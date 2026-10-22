'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  PlusCircle, 
  Bell, 
  Calendar,
  User,
  ChevronRight,
  Pin
} from 'lucide-react';
import { ComunicadoComitiva } from '@/types/database';
import { fetchComunicados } from '@/lib/supabase/api';

export default function HomePage() {
  const [comunicados, setComunicados] = useState<ComunicadoComitiva[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComunicados()
      .then((data) => setComunicados(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-12">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-8 sm:p-12 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>Portal Oficial dos Operadores SpreadHunter</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Transparência, Força Coletiva & Respostas da RentalHash.
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Canal oficial da comitiva para representação de operadores, acompanhamento de comunicados e envio de demandas e sugestões perante a diretoria da RentalHash.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/nova-demanda"
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Nova Demanda</span>
            </Link>

            <Link
              href="/comunicados"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-3 rounded-xl backdrop-blur-sm border border-white/10 transition-all"
            >
              <Bell className="w-4 h-4 text-emerald-400" />
              <span>Ver Comunicados</span>
            </Link>
          </div>
        </div>

        {/* Elemento visual decorativo */}
        <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* MURAL DE COMUNICADOS OFICIAIS */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-emerald-600" />
              <span>Mural de Comunicados da Comitiva</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Informes oficiais, atas de reuniões e comunicados formais direcionados aos operadores.
            </p>
          </div>

          <Link
            href="/nova-demanda"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-colors w-fit"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Enviar Nova Demanda</span>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4 py-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-36 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : comunicados.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-sm text-xs text-slate-400">
            Nenhum comunicado publicado no momento.
          </div>
        ) : (
          <div className="space-y-4">
            {comunicados.map((com) => (
              <article
                key={com.id}
                className={`bg-white rounded-2xl border p-6 shadow-sm transition-all ${
                  com.destaque
                    ? 'border-emerald-300 ring-1 ring-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {com.destaque && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white">
                        <Pin className="w-3 h-3" /> Comunicado Prioritário
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

                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  {com.titulo}
                </h3>

                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {com.resumo}
                </p>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {com.conteudo}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
