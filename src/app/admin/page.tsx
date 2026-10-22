'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import AdminPanel from '@/components/AdminPanel';

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voltar ao Portal Público</span>
        </Link>
      </div>

      <AdminPanel />
    </div>
  );
}
