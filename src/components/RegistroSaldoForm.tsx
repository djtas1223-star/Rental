'use client';

import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileText, 
  Building2, 
  DollarSign, 
  User, 
  Mail, 
  Phone,
  Image as ImageIcon
} from 'lucide-react';
import { submitRegistroSaldo } from '@/lib/supabase/api';
import { uploadComprovante } from '@/lib/image-upload';

interface RegistroSaldoFormProps {
  onSuccess?: () => void;
}

export default function RegistroSaldoForm({ onSuccess }: RegistroSaldoFormProps) {
  // Dados do operador
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // RentalHash
  const [saldoRental, setSaldoRental] = useState('');
  const [moedaRental, setMoedaRental] = useState('USDT');
  const [printRentalFile, setPrintRentalFile] = useState<File | null>(null);
  const [printRentalPreview, setPrintRentalPreview] = useState<string | null>(null);

  // Hashsell
  const [saldoHashsell, setSaldoHashsell] = useState('');
  const [moedaHashsell, setMoedaHashsell] = useState('USDT');
  const [printHashsellFile, setPrintHashsellFile] = useState<File | null>(null);
  const [printHashsellPreview, setPrintHashsellPreview] = useState<string | null>(null);

  // Observações
  const [observacoes, setObservacoes] = useState('');

  // Status de envio
  const [loading, setLoading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const rentalInputRef = useRef<HTMLInputElement>(null);
  const hashsellInputRef = useRef<HTMLInputElement>(null);

  // Handlers de arquivo RentalHash
  const handleRentalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPrintRentalFile(file);
      setPrintRentalPreview(URL.createObjectURL(file));
    }
  };

  const removeRentalFile = () => {
    setPrintRentalFile(null);
    setPrintRentalPreview(null);
    if (rentalInputRef.current) rentalInputRef.current.value = '';
  };

  // Handlers de arquivo Hashsell
  const handleHashsellFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPrintHashsellFile(file);
      setPrintHashsellPreview(URL.createObjectURL(file));
    }
  };

  const removeHashsellFile = () => {
    setPrintHashsellFile(null);
    setPrintHashsellPreview(null);
    if (hashsellInputRef.current) hashsellInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nome.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }

    const valorRentalNum = parseFloat(saldoRental.replace(',', '.')) || 0;
    const valorHashsellNum = parseFloat(saldoHashsell.replace(',', '.')) || 0;

    if (valorRentalNum <= 0 && valorHashsellNum <= 0) {
      setErrorMessage('Informe o saldo pendente em pelo menos uma das plataformas (RentalHash ou Hashsell).');
      return;
    }

    setLoading(true);

    try {
      let printRentalUrl = '';
      let printHashsellUrl = '';

      // Upload do comprovante RentalHash se houver
      if (printRentalFile) {
        setUploadStep('Enviando print da RentalHash...');
        printRentalUrl = await uploadComprovante(printRentalFile, 'rentalhash');
      }

      // Upload do comprovante Hashsell se houver
      if (printHashsellFile) {
        setUploadStep('Enviando print da Hashsell...');
        printHashsellUrl = await uploadComprovante(printHashsellFile, 'hashsell');
      }

      setUploadStep('Gravando dados na comitiva...');

      const res = await submitRegistroSaldo({
        nome,
        email: email || undefined,
        whatsapp: whatsapp || undefined,
        saldo_rentalhash: valorRentalNum,
        moeda_rentalhash: moedaRental,
        comprovante_rentalhash_url: printRentalUrl || undefined,
        saldo_hashsell: valorHashsellNum,
        moeda_hashsell: moedaHashsell,
        comprovante_hashsell_url: printHashsellUrl || undefined,
        observacoes: observacoes || undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Erro ao registrar saldo.');
      } else {
        setSuccess(true);
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na conexão com Supabase';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
      setUploadStep(null);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-8 sm:p-12 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
            Saldos e Comprovantes Registrados!
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Olá <strong>{nome}</strong>, seus saldos pendentes foram protocolados pela Comitiva dos Operadores SpreadHunter para conferência e validação administrativa.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-sm mx-auto text-left text-xs space-y-1.5 text-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-500">RentalHash:</span>
            <span className="font-bold">{moedaRental} {parseFloat(saldoRental || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Hashsell:</span>
            <span className="font-bold">{moedaHashsell} {parseFloat(saldoHashsell || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              setSuccess(false);
              setNome('');
              setEmail('');
              setWhatsapp('');
              setSaldoRental('');
              setSaldoHashsell('');
              setObservacoes('');
              removeRentalFile();
              removeHashsellFile();
            }}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
          >
            Registrar Outro Operador
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
          <DollarSign className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Cadastro de Saldos Pendentes & Comprovantes
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Insira os valores retidos e anexe os prints dos painéis para validação pela comitiva.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Atenção ao registrar</h4>
            <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SEÇÃO 1: DADOS PESSOAIS DO OPERADOR */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <User className="w-4 h-4 text-emerald-600" />
            <span>Identificação do Operador</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo ou razão social"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email de Contato <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu-email@exemplo.com (opcional)"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp / Telefone para Contato <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(DDD) 99999-9999 (opcional)"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: SALDO E PRINT RENTALHASH */}
        <div className="pt-2 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              1. Plataforma RentalHash
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Valor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Saldo Pendente RentalHash
              </label>
              <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                <select
                  value={moedaRental}
                  onChange={(e) => setMoedaRental(e.target.value)}
                  className="bg-slate-50 border-r border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="USDT">USDT</option>
                  <option value="BRL">R$ (BRL)</option>
                  <option value="BTC">BTC</option>
                </select>
                <input
                  type="text"
                  value={saldoRental}
                  onChange={(e) => setSaldoRental(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3.5 py-2.5 text-sm outline-none font-semibold text-slate-900"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Valor total retido aguardando repasse/saque.
              </p>
            </div>

            {/* Print Anexo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Print do Painel RentalHash (Até 1 imagem)
              </label>

              {printRentalPreview ? (
                <div className="relative border border-slate-200 rounded-xl p-2 bg-slate-50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img
                      src={printRentalPreview}
                      alt="Print RentalHash"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                    />
                    <span className="text-xs text-slate-700 font-medium truncate max-w-[160px]">
                      {printRentalFile?.name || 'Comprovante RentalHash'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeRentalFile}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remover print"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => rentalInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20"
                >
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs font-semibold text-emerald-700">
                    Clique para anexar o print
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    PNG, JPG ou JPEG do extrato da RentalHash
                  </p>
                  <input
                    ref={rentalInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleRentalFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: SALDO E PRINT HASHSELL */}
        <div className="pt-2 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">
              2. Plataforma Hashsell
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Valor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Saldo Pendente Hashsell
              </label>
              <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
                <select
                  value={moedaHashsell}
                  onChange={(e) => setMoedaHashsell(e.target.value)}
                  className="bg-slate-50 border-r border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="USDT">USDT</option>
                  <option value="BRL">R$ (BRL)</option>
                  <option value="BTC">BTC</option>
                </select>
                <input
                  type="text"
                  value={saldoHashsell}
                  onChange={(e) => setSaldoHashsell(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3.5 py-2.5 text-sm outline-none font-semibold text-slate-900"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Valor total retido na plataforma Hashsell.
              </p>
            </div>

            {/* Print Anexo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Print do Painel Hashsell (Até 1 imagem)
              </label>

              {printHashsellPreview ? (
                <div className="relative border border-slate-200 rounded-xl p-2 bg-slate-50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img
                      src={printHashsellPreview}
                      alt="Print Hashsell"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                    />
                    <span className="text-xs text-slate-700 font-medium truncate max-w-[160px]">
                      {printHashsellFile?.name || 'Comprovante Hashsell'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeHashsellFile}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remover print"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => hashsellInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20"
                >
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs font-semibold text-emerald-700">
                    Clique para anexar o print
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    PNG, JPG ou JPEG do extrato da Hashsell
                  </p>
                  <input
                    ref={hashsellInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleHashsellFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SEÇÃO 4: OBSERVAÇÕES OPCIONAIS */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Observações Adicionais (Opcional)
          </label>
          <textarea
            rows={3}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Informações complementares, IDs de usuários nas plataformas, carteiras de recebimento ou detalhes sobre tickets anteriores."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
          />
        </div>

        {/* DECLARAÇÃO DE PRIVACIDADE & CONFORMIDADE LGPD */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs text-slate-600 space-y-2.5">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Privacidade & Proteção de Dados (LGPD - Lei nº 13.709/2018)</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            • <strong>Finalidade Exclusiva:</strong> Seus dados de identificação, valores retidos e capturas de tela anexadas são coletados estritamente para apuração coletiva, consolidação estatística e representação perante a RentalHash e Hashsell.
          </p>
          <p className="text-[11px] leading-relaxed text-slate-600">
            • <strong>Sigilo Absoluto:</strong> Seus comprovantes e contatos jamais serão vendidos, divulgados publicamente ou compartilhados com terceiros. No portal público, são exibidos exclusivamente os somatórios estatísticos anônimos e consolidados.
          </p>
          <p className="text-[11px] leading-relaxed text-slate-600">
            • <strong>Segurança:</strong> O tráfego de dados e arquivos é protegido por criptografia de ponta a ponta (SSL/TLS) e controle estrito de privilégios de acesso (Row Level Security).
          </p>
        </div>

        {/* BOTÃO DE SUBMISSÃO */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Seus comprovantes são confidenciais e auditados apenas pela comitiva.</span>
          </span>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-8 py-3 rounded-xl shadow-sm hover:shadow transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{uploadStep || 'Processando envio...'}</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Enviar Saldos e Comprovantes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
