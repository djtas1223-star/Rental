'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  PlusCircle, 
  Bell, 
  AlertCircle, 
  ThumbsUp, 
  Building2, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';
import { Categoria, Questionamento, ComunicadoComitiva } from '@/types/database';
import { 
  fetchCategorias, 
  fetchQuestionamentos, 
  fetchComunicados, 
  fetchStats 
} from '@/lib/supabase/api';
import StatsOverview from '@/components/StatsOverview';
import QuestionCard from '@/components/QuestionCard';
import QuestionModal from '@/components/QuestionModal';
import NewQuestionForm from '@/components/NewQuestionForm';
import { getVotedQuestionIds } from '@/lib/voter-id';

export default function HomePage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [demandas, setDemandas] = useState<Questionamento[]>([]);
  const [comunicados, setComunicados] = useState<ComunicadoComitiva[]>([]);
  const [stats, setStats] = useState({
    totalDemandas: 0,
    emAnalise: 0,
    encaminhadas: 0,
    respondidas: 0,
    totalApoios: 0,
  });

  const [loading, setLoading] = useState(true);
  const [selectedCategoria, setSelectedCategoria] = useState('todas');
  const [selectedStatus, setSelectedStatus] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [selectedDemanda, setSelectedDemanda] = useState<Questionamento | null>(null);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, dems, coms, st] = await Promise.all([
        fetchCategorias(),
        fetchQuestionamentos({
          categoriaId: selectedCategoria !== 'todas' ? selectedCategoria : undefined,
          status: selectedStatus !== 'todos' ? selectedStatus : undefined,
          search: searchTerm,
        }),
        fetchComunicados(),
        fetchStats(),
      ]);

      setCategorias(cats);
      setDemandas(dems);
      setComunicados(coms);
      setStats(st);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategoria, selectedStatus, searchTerm]);

  useEffect(() => {
    loadData();
    setVotedIds(getVotedQuestionIds());
  }, [loadData]);

  const handleVoteChange = (id: string, newTotal: number, voted: boolean) => {
    setDemandas((prev) =>
      prev.map((d) => (d.id === id ? { ...d, apoios_count: newTotal } : d))
    );
    setVotedIds((prev) => {
      const next = new Set(prev);
      if (voted) next.add(id);
      else next.delete(id);
      return next;
    });
    setStats((prev) => ({
      ...prev,
      totalApoios: voted ? prev.totalApoios + 1 : Math.max(0, prev.totalApoios - 1),
    }));
  };

  const handleSelectSimilar = (id: string) => {
    const found = demandas.find((d) => d.id === id);
    if (found) {
      setSelectedDemanda(found);
    } else {
      // scroll to list
      const el = document.getElementById('demandas');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
            Consolidamos dúvidas sobre repasses, contratos e hashrate em pautas unificadas.
            Apoie demandas de outros operadores ou cadastre a sua para levarmos às reuniões formais com a diretoria.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#registrar"
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Registrar Dúvida</span>
            </a>

            <a
              href="#demandas"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-3 rounded-xl backdrop-blur-sm border border-white/10 transition-all"
            >
              <span>Ver Demandas em Pauta</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* STATS OVERVIEW */}
      <StatsOverview stats={stats} />

      {/* COMUNICADOS RECENTES (BANNER DESTAQUE) */}
      {comunicados.length > 0 && (
        <section className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm sm:text-base">
              <Bell className="w-5 h-5 text-emerald-600" />
              <span>Último Comunicado da Comitiva</span>
            </div>
            <Link
              href="/comunicados"
              className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>Ver todos os comunicados</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mb-1">
              <span className="font-semibold text-slate-900">{comunicados[0].titulo}</span>
              <span>{new Date(comunicados[0].data_publicacao).toLocaleDateString('pt-BR')}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{comunicados[0].resumo}</p>
          </div>
        </section>
      )}

      {/* SEÇÃO PRINCIPAL DE DEMANDAS */}
      <section id="demandas" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Demandas e Questionamentos Ativos
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Demandas abertas por operadores. Apoie as mais urgentes para aumentar a prioridade com a RentalHash.
            </p>
          </div>

          {/* Busca */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por palavra-chave ou termo..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white shadow-sm"
            />
          </div>
        </div>

        {/* FILTROS: CATEGORIAS E STATUS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Categorias Pills */}
          <button
            onClick={() => setSelectedCategoria('todas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategoria === 'todas'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Todas as Categorias
          </button>

          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoria(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategoria === cat.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.nome}
            </button>
          ))}

          {/* Status Filter */}
          <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-medium outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Status: Todos em Andamento</option>
              <option value="em_analise">Em Análise / Triagem</option>
              <option value="encaminhado">Encaminhado à RentalHash</option>
              <option value="respondido">Respondido Oficialmente</option>
              <option value="concluido">Pautas Concluídas</option>
            </select>
          </div>
        </div>

        {/* LISTAGEM DOS CARDS */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : demandas.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Nenhum questionamento encontrado</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchTerm || selectedCategoria !== 'todas' || selectedStatus !== 'todos'
                ? 'Tente ajustar os filtros de busca para encontrar as demandas desejadas.'
                : 'Seja o primeiro a registrar uma dúvida ou questionamento para a comitiva.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demandas.map((demanda) => (
              <QuestionCard
                key={demanda.id}
                questionamento={demanda}
                isVotedInitial={votedIds.has(demanda.id)}
                onOpenDetails={(q) => setSelectedDemanda(q)}
                onVoteChange={handleVoteChange}
              />
            ))}
          </div>
        )}
      </section>

      {/* FORMULÁRIO DE REGISTRO COM IDENTIFICAÇÃO DE SEMELHANTES */}
      <NewQuestionForm
        categorias={categorias}
        onCreated={loadData}
        onSelectSimilar={handleSelectSimilar}
      />

      {/* MODAL DE DETALHES */}
      <QuestionModal
        questionamento={selectedDemanda}
        onClose={() => setSelectedDemanda(null)}
        isVotedInitial={selectedDemanda ? votedIds.has(selectedDemanda.id) : false}
        onVoteChange={handleVoteChange}
      />
    </div>
  );
}
