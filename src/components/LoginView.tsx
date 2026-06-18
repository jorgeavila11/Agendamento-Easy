import React, { useState } from 'react';
import BusinessAuth from './login/BusinessAuth';
import ClientAuth from './login/ClientAuth';
import { 
  Building2, 
  Users, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';

export default function LoginView() {
  // Main Stakeholder Switcher
  // 'company' = Area da Empresa/Profissional
  // 'client' = Portal do Cliente & Consumidor
  const [stakeholderType, setStakeholderType] = useState<'company' | 'client'>('company');
  
  // Feedback Messages
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  return (
    <div id="unified-auth-canvas" className="space-y-6 animate-fade-in w-full max-w-4xl mx-auto px-1">
      
      {/* SECTION STAKEHOLDER SWITCHER TABS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <h2 className="text-sm font-extrabold text-white tracking-tight uppercase font-display">
              Acesso ao AgendaFácil
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Selecione de forma clara o perfil correspondente para acessar o painel de atendimento ou agendar serviços.
          </p>
        </div>

        {/* Stakeholder tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0">
          <button
            type="button"
            onClick={() => { setStakeholderType('company'); setFeedbackMsg(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer outline-none ${
              stakeholderType === 'company' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            Empresas & Profissionais
          </button>
          <button
            type="button"
            onClick={() => { setStakeholderType('client'); setFeedbackMsg(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer outline-none ${
              stakeholderType === 'client' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            Clientes & Consumidores
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl text-xs flex items-start gap-2.5 border transition-all ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold">{feedbackMsg.type === 'success' ? 'Operação Concluída' : 'Aviso do Sistema'}</p>
            <p className="mt-0.5 opacity-90 leading-relaxed font-semibold">{feedbackMsg.text}</p>
          </div>
        </div>
      )}

      {/* RENDER VIEW DEPENDING ON PORTAL SELECTION */}
      <div className="transition-all duration-300">
        {stakeholderType === 'company' ? (
          <BusinessAuth 
            onSetFeedback={setFeedbackMsg} 
          />
        ) : (
          <ClientAuth onSetFeedback={setFeedbackMsg} />
        )}
      </div>

    </div>
  );
}
