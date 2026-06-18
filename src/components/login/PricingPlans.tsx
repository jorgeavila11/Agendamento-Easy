import React, { useState } from 'react';
import { Check, Sparkles, ArrowRight, X } from 'lucide-react';

interface PricingPlansProps {
  onChoosePlan: (planName: string) => void;
  onGoToLogin: () => void;
}

export default function PricingPlans({ onChoosePlan, onGoToLogin }: PricingPlansProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Iniciante',
      priceMonthly: 0,
      priceYearly: 0,
      periodLabel: '/mês',
      description: 'Ideal para profissionais autônomos que estão começando.',
      features: [
        { text: 'Até 50 agendamentos/mês', included: true },
        { text: '1 Calendário sincronizado', included: true },
        { text: 'Lembretes por e-mail', included: true },
        { text: 'Personalização de marca', included: false },
      ],
      cta: 'Começar Agora',
    },
    {
      name: 'Profissional',
      priceMonthly: 89,
      priceYearly: 71,
      periodLabel: '/mês',
      description: 'Para negócios em crescimento que buscam produtividade.',
      features: [
        { text: 'Agendamentos ilimitados', included: true },
        { text: 'Branding customizado', included: true },
        { text: 'Relatórios detalhados', included: true },
        { text: 'Lembretes via WhatsApp', included: true },
        { text: 'Integração com Zoom/Meet', included: true },
      ],
      cta: 'Escolher Plano',
      popular: true,
    },
    {
      name: 'Enterprise',
      priceCustom: 'Sob Consulta',
      description: 'Soluções sob medida para grandes equipes e infraestrutura.',
      features: [
        { text: 'Tudo no Profissional', included: true },
        { text: 'Acesso total à API', included: true },
        { text: 'Gerente de conta dedicado', included: true },
        { text: 'Segurança de nível corporativo', included: true },
      ],
      cta: 'Falar com Vendas',
    },
  ];

  return (
    <div id="pricing-layout-canvas" className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative p-6 sm:p-10 space-y-12">
      {/* Mini header within the simulated viewport */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">S</div>
          <span className="font-extrabold text-white text-md tracking-tight font-display">Schedulify</span>
        </div>
        <div className="flex items-center gap-6 text-xs font-semibold text-slate-400">
          <span className="cursor-pointer hover:text-slate-200">Recursos</span>
          <span className="cursor-pointer text-indigo-400 underline">Planos</span>
          <span className="cursor-pointer hover:text-slate-200">Suporte</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onGoToLogin}
            className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs font-bold hover:text-white transition-all cursor-pointer"
          >
            Fazer Login
          </button>
        </div>
      </div>

      {/* Headline Title copy */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-2.5xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug font-display">
          Planos que acompanham seu crescimento
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
          Escolha a melhor solução para gerenciar seus agendamentos, desde pequenos negócios até grandes corporações com necessidades complexas.
        </p>

        {/* Interactive Billing Swapper Toggle */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <span className={`text-xs font-semibold ${billingPeriod === 'monthly' ? 'text-white' : 'text-slate-500'}`}>Mensal</span>
          <button
            type="button"
            onClick={() => setBillingPeriod(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
            className="w-12 h-6.5 bg-slate-800 rounded-full p-1 relative flex items-center transition-colors cursor-pointer"
          >
            <div className={`w-4.5 h-4.5 bg-indigo-500 rounded-full transform transition-transform ${billingPeriod === 'yearly' ? 'translate-x-5.5' : 'translate-x-0'}`} />
          </button>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-semibold ${billingPeriod === 'yearly' ? 'text-white' : 'text-slate-500'}`}>Anual</span>
            <span className="bg-indigo-600/20 border border-indigo-500/35 text-[10px] font-bold text-indigo-400 px-2 py-0.5 rounded-full select-none">
              Economize 20%
            </span>
          </div>
        </div>
      </div>

      {/* Grid containing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 items-stretch">
        {plans.map((p, idx) => {
          const displayPrice = p.priceCustom 
            ? p.priceCustom 
            : `R$ ${billingPeriod === 'yearly' ? p.priceYearly : p.priceMonthly}`;

          return (
            <div 
              key={idx}
              className={`p-6 rounded-2xl flex flex-col justify-between transition-all border ${
                p.popular 
                  ? 'bg-slate-900 border-2 border-indigo-600 relative shadow-xl' 
                  : 'bg-slate-900/50 border-slate-850 hover:border-slate-700'
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 border border-indigo-500 text-[10px] font-extrabold text-white tracking-widest uppercase px-3 py-0.5 rounded-full shadow-md select-none">
                  Mais Popular
                </span>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white font-display">{p.name}</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">{p.description}</p>
                </div>

                <div className="py-2 flex items-baseline">
                  <span className={`${p.priceCustom ? 'text-xl' : 'text-3xl'} font-extrabold text-white`}>
                    {displayPrice}
                  </span>
                  {!p.priceCustom && (
                    <span className="text-[10px] text-slate-500 font-semibold font-mono ml-1.5">{p.periodLabel}</span>
                  )}
                </div>

                <ul className="space-y-2.5 pt-4 text-xs font-semibold border-t border-slate-850">
                  {p.features.map((f, fIdx) => (
                    <li 
                      key={fIdx} 
                      className={`flex items-center gap-2 ${f.included ? 'text-slate-200' : 'text-slate-600 line-through'}`}
                    >
                      <Check className={`w-4 h-4 shrink-0 ${f.included ? (p.popular ? 'text-indigo-400' : 'text-emerald-400') : 'text-slate-800'}`} />
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <button
                  type="button"
                  onClick={() => onChoosePlan(p.name)}
                  className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    p.popular 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-98' 
                      : 'bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white'
                  }`}
                >
                  {p.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confianca Footer */}
      <div className="space-y-4 pt-4 text-center">
        <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">EMPRESAS QUE CONFIAM NA SCHEDULIFY</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl mx-auto opacity-45 grayscale">
          {['LOGOTYPE A', 'CLIENT BRAND B', 'PARTNER C', 'CORP D'].map((brand, bIdx) => (
            <div key={bIdx} className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-center text-[10px] font-mono font-extrabold text-slate-400 select-none">
              {brand}
            </div>
          ))}
        </div>
      </div>

      {/* Corporate Call To Action Bottom panel */}
      <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-md">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-indigo-500/5 blur-xl pointer-events-none" />
        <div className="space-y-1 flex-1 text-center md:text-left">
          <h3 className="text-sm font-bold text-white font-display">Precisa de algo específico?</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
            Nós ajudamos a configurar o fluxo de trabalho ideal para sua clínica, estúdio ou escritório.
          </p>
        </div>
        <button
          onClick={() => onChoosePlan('Consultoria Personalizada de Implantação')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow flex items-center gap-1.5"
        >
          Consultar Especialistas
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
