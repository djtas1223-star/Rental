'use client';

import React from 'react';
import { 
  FileQuestion, 
  Clock, 
  Send, 
  CheckCircle2, 
  ThumbsUp 
} from 'lucide-react';

interface StatsProps {
  stats: {
    totalDemandas: number;
    emAnalise: number;
    encaminhadas: number;
    respondidas: number;
    totalApoios: number;
  };
}

export default function StatsOverview({ stats }: StatsProps) {
  const items = [
    {
      label: 'Demandas Registradas',
      value: stats.totalDemandas,
      icon: FileQuestion,
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-200/60',
    },
    {
      label: 'Em Análise / Triagem',
      value: stats.emAnalise,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200/60',
    },
    {
      label: 'Com a RentalHash',
      value: stats.encaminhadas,
      icon: Send,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-200/60',
    },
    {
      label: 'Respondidas / Resolvidas',
      value: stats.respondidas,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200/60',
    },
    {
      label: 'Apoios de Operadores',
      value: stats.totalApoios,
      icon: ThumbsUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50 border-purple-200/60',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 my-8">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${item.bg} bg-white shadow-sm flex flex-col justify-between transition-transform hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 line-clamp-1">
                {item.label}
              </span>
              <Icon className={`w-4 h-4 ${item.color} flex-shrink-0`} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl sm:text-3xl font-extrabold ${item.color}`}>
                {item.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
