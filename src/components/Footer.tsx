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
                Comitiva SpreadHunter
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Iniciativa unificada de operadores com foco em apuração, auditoria e consolidação coletiva de saldos retidos perante a RentalHash e Hashsell.
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
                  Registrar Saldo Pendente
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-emerald-400 transition-colors">
                  Painel Administrativo da Comitiva
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Privacidade & LGPD</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Tratamento de dados em estrita conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Os comprovantes e dados dos operadores são mantidos em sigilo e usados exclusivamente para a consolidação coletiva.
            </p>
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 text-[11px] text-slate-400">
              🛡️ Criptografia SSL/TLS • Políticas RLS no banco de dados • Anonimização pública.
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} Comitiva dos Operadores SpreadHunter. Todos os direitos reservados.</p>
          <p>Conformidade LGPD • Auditoria de Saldos Retidos • RentalHash & Hashsell</p>
        </div>
      </div>
    </footer>
  );
}
