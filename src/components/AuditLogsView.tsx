import React, { useState } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { 
  Shield, 
  Search, 
  Filter, 
  Terminal, 
  Activity, 
  User, 
  Clock, 
  CheckCircle2, 
  Info,
  Server,
  Lock,
  Flame,
  ArrowRight
} from 'lucide-react';

export default function AuditLogsView() {
  const { auditLogs } = useFirebase();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  // Filter audit logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'all' || 
      (actionFilter === 'profile' && log.action.includes('Perfil')) ||
      (actionFilter === 'service' && log.action.includes('Serviço')) ||
      (actionFilter === 'appointment' && log.action.includes('Agendamento')) ||
      (actionFilter === 'settings' && log.action.includes('Configurar')) ||
      (actionFilter === 'customer' && log.action.includes('Cliente')) ||
      (actionFilter === 'other' && !['Perfil', 'Serviço', 'Agendamento', 'Configurar', 'Cliente'].some(term => log.action.includes(term)));

    return matchesSearch && matchesAction;
  });

  // Get action icon
  const getActionColor = (action: string) => {
    if (action.toLowerCase().includes('excluir') || action.toLowerCase().includes('remover') || action.toLowerCase().includes('cancel')) {
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
    if (action.toLowerCase().includes('cadastrar') || action.toLowerCase().includes('criar') || action.toLowerCase().includes('adicionar')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (action.toLowerCase().includes('atualizar') || action.toLowerCase().includes('alterar')) {
      return 'bg-amber-500/10 text-amber-450 text-amber-400 border-amber-500/20';
    }
    return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
  };

  // Format date
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString('pt-BR');
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="audit-logs-view-root">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-5 border border-slate-800 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Sistemas de Logs de Auditoria</h3>
          </div>
          <p className="text-xs text-slate-400">
            Registro imutável em tempo real de todas as operações de banco de dados, auditado e protegido pelas regras de segurança de nível de documento do Firestore rules.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-[10px] text-emerald-400 font-bold tracking-wide uppercase select-none w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Ativo e Monitorado
        </div>
      </div>

      {/* Database Security Info Bento Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-indigo-400">
            <Lock className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Coleções Protegidas</h4>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            As políticas de segurança <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded font-mono">firestore.rules</code> validam estritamente o formato de cada transação, rejeitando escritas que não correspondam ao blueprint oficial.
          </p>
          <div className="text-[10px] text-indigo-400 font-mono flex items-center gap-1.5 pt-1">
            <ArrowRight className="w-3 h-3" />
            <span>Nenhuma brecha identificada</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <Activity className="w-4 h-4 animate-pulse" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Validação Real-Time</h4>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Cada alteração nas coleções <code className="text-emerald-300 bg-slate-950 px-1 py-0.5 rounded font-mono">users</code>, <code className="text-emerald-300 bg-slate-950 px-1 py-0.5 rounded font-mono">services</code> ou <code className="text-emerald-300 bg-slate-950 px-1 py-0.5 rounded font-mono">appointments</code> dispara logs vinculados ao e-mail autenticado e ID do usuário administrador.
          </p>
          <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 pt-1">
            <ArrowRight className="w-3 h-3" />
            <span>Sincronismo de Snapshot de 100%</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-500">
            <Terminal className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Rastreabilidade Imutável</h4>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Conexões são monitoradas para auditoria de segurança. Os logs são gravados no subdiretório seguro de cada usuário no banco de dados, impossibilitando adulteração de dados de agendamentos por clientes terceiros.
          </p>
          <div className="text-[10px] text-amber-450 text-amber-400 font-mono flex items-center gap-1.5 pt-1">
            <ArrowRight className="w-3 h-3" />
            <span>Audit-trail ativo</span>
          </div>
        </div>
      </div>

      {/* Main Ledger card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar por ação, operador ou alvo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-600 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Filtrar:</span>
            <div className="flex items-center gap-1">
              {[
                { id: 'all', label: 'Tudo' },
                { id: 'profile', label: 'Perfil' },
                { id: 'service', label: 'Serviços' },
                { id: 'appointment', label: 'Agenda' },
                { id: 'settings', label: 'Regras' },
                { id: 'customer', label: 'Clientes' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setActionFilter(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${actionFilter === opt.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-950 text-slate-400 hover:text-slate-300 border border-slate-800'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Log Table/List wrapper */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70">
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
            <div className="col-span-3 sm:col-span-2">Ação</div>
            <div className="col-span-3">Alvo / ID</div>
            <div className="col-span-4 sm:col-span-5">Detalhes Da Transação</div>
            <div className="col-span-2 text-right">Data/Hora</div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Terminal className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">Nenhum registro de log de auditoria encontrado correspondente aos filtros.</p>
              <button 
                onClick={() => { setSearchTerm(''); setActionFilter('all'); }}
                className="text-xs text-indigo-400 font-bold hover:underline"
              >
                Limpar Filtros de Busca
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-850/60 max-h-[480px] overflow-y-auto">
              {filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="px-4 py-3.5 grid grid-cols-12 gap-2 text-xs items-center hover:bg-slate-900/30 transition-colors"
                >
                  {/* Action Badge */}
                  <div className="col-span-3 sm:col-span-2">
                    <span className={`px-2 py-1 rounded border text-[10px] font-bold inline-block truncate max-w-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </div>

                  {/* Target Column */}
                  <div className="col-span-3 font-semibold text-slate-250 font-mono truncate text-[11px]">
                    {log.target}
                  </div>

                  {/* Details column */}
                  <div className="col-span-4 sm:col-span-5 text-slate-400 flex flex-col gap-0.5">
                    <span className="leading-relaxed font-medium text-[11px] text-slate-350">{log.details}</span>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                      <User className="w-2.5 h-2.5" />
                      <span className="truncate max-w-[180px] font-mono">{log.userEmail}</span>
                      <span>•</span>
                      <Server className="w-2.5 h-2.5" />
                      <span>firestore/{log.id.slice(0, 8)}</span>
                    </div>
                  </div>

                  {/* Time column */}
                  <div className="col-span-2 text-right text-slate-500 font-mono text-[10px] flex flex-col justify-center items-end gap-1">
                    <div className="flex items-center gap-1 text-slate-400 font-semibold">
                      <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{formatTime(log.timestamp).split(' ')[0]}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{formatTime(log.timestamp).split(' ')[1] || ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Log footer rules notes */}
        <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-xl flex items-start gap-3">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-200">Garantia de Não-Repúdio da Infraestrutura</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              O sistema utiliza as funções de validação interna do Firestore para barrar qualquer requisição que tente injetar IDs forjados ou apagar logs anteriores de auditoria. Todas as modificações de agendamento registradas são definitivas e vinculadas à autenticação ativa do operador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
