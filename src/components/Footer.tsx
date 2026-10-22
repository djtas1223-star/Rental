import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Info } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-base">
                Comitiva dos Operadores SpreadHunter
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Iniciativa organizada de operadores com foco em representação legítima, centralização de questionamentos e diálogo transparente com a RentalHash.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Links Rápidos</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/comunicados" className="hover:text-emerald-400 transition-colors">
                  Mural de Comunicados e Atas
                </Link>
              </li>
              <li>
                <Link href="/nova-demanda" className="hover:text-emerald-400 transition-colors">
                  Registrar Nova Demanda
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-emerald-400 transition-colors">
                  Painel de Moderação Comitiva
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-400" />
              <span>Transparência e Governança</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Todas as demandas submetidas passam por triagem da comitiva para evitar duplicidades e direcionar pautas coletivas com maior impacto.
            </p>
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 text-[11px] text-slate-400">
              🛡️ Os dados são salvos com segurança via Supabase com controle rigoroso de Row Level Security (RLS).
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} Comitiva dos Operadores SpreadHunter. Todos os direitos reservados.</p>
          <p>Conexão com RentalHash • Monitoramento de Hashrate & Repasses</p>
        </div>
      </div>
    </footer>
  );
}
