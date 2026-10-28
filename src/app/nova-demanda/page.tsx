'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ShieldCheck, DollarSign } from 'lucide-react';
import RegistroSaldoForm from '@/components/RegistroSaldoForm';

export default function NovaDemandaPage() {
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

      {/* Orientações para Registro de Saldo */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-md border border-slate-700/60">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Censo Coletivo de Saldos Retidos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Registrar Saldo Pendente (RentalHash & Hashsell)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Informe seus dados e anexe os prints dos painéis comprovando os valores retidos. Seus dados serão conferidos e validados pela comitiva para inclusão no somatório oficial e na pauta de cobrança formal perante as empresas.
          </p>
        </div>
      </div>

      {/* Formulário com Upload de Comprovantes */}
      <RegistroSaldoForm />
    </div>
  );
}
