'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, PlusCircle, Bell, Lock } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                  Comitiva SpreadHunter
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Canal Oficial
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Representação e transparência com a RentalHash
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link 
              href="/#demandas" 
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors hidden md:inline-block"
            >
              Demandas Ativas
            </Link>

            <Link 
              href="/comunicados" 
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-4 h-4 text-emerald-600" />
              <span>Comunicados</span>
            </Link>

            <Link
              href="/nova-demanda"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-3.5 py-2 rounded-lg shadow-sm hover:shadow transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Demanda</span>
              <span className="sm:hidden">Nova</span>
            </Link>

            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 px-2.5 py-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              title="Acesso Comitiva"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Acesso Comitiva</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
