'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ShieldCheck
} from 'lucide-react';
import { Categoria } from '@/types/database';
import { fetchCategorias } from '@/lib/supabase/api';
import NewQuestionForm from '@/components/NewQuestionForm';

export default function NovaDemandaPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategorias()
      .then((data) => setCategorias(data))
      .finally(() => setLoading(false));
  }, []);

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
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-md border border-slate-700/60">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Processo Oficial de Coleta de Demandas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Registrar Nova Demanda ou Sugestão
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Sua Sujestão será analisada pela comitiva e consolidada em pautas de reunião formal com a diretoria da RentalHash.
          </p>
        </div>
      </div>

      {/* Formulário Simplificado */}
      <NewQuestionForm
        categorias={categorias}
      />
    </div>
  );
}
