import React, { useState } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { Appointment } from '../types';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Bell, 
  Plus,
  Compass,
  ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const { 
    appointments, 
    customers, 
    notifications, 
    services,
    updateAppointmentStatus, 
    createAppointment,
    markNotificationRead 
  } = useFirebase();

  // Filters & Searches states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  
  // Quick booking modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [bookingDate, setBookingDate] = useState('2026-06-16');
  const [bookingTime, setBookingTime] = useState('09:00');
  const [bookingNotes, setBookingNotes] = useState('');
  const [modalError, setModalError] = useState('');

  // Calculate Metrics in real time
  const todayString = '2026-06-16'; // Mocked central date matching context seed
  const todayAppointments = appointments.filter(app => app.date === todayString && app.status !== 'cancelled');
  const pendingAppointments = appointments.filter(app => app.status === 'pending');
  const totalClients = customers.length;
  const estimatedRevenue = appointments
    .filter(app => app.status !== 'cancelled')
    .reduce((sum, app) => sum + app.price, 0);

  // Filtered Listing
  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.serviceName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleQuickBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    const targetService = services.find(s => s.id === selectedServiceId);
    if (!targetService) {
      setModalError('Por favor, selecione um serviço.');
      return;
    }

    const res = await createAppointment({
      serviceId: targetService.id,
      serviceName: targetService.name,
      price: targetService.price,
      duration: targetService.duration,
      customerName: clientName,
      customerPhone: clientPhone,
      customerEmail: clientEmail,
      date: bookingDate,
      time: bookingTime,
      status: 'confirmed', // Admin walk-in creations are auto-confirmed
      notes: bookingNotes
    });

    if (res === "CONFLITO_HORARIO") {
      setModalError("Conflito: Já existe um agendamento confirmado neste horário neste dia.");
    } else {
      // Clear forms
      setIsModalOpen(false);
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setBookingNotes('');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm flex items-center justify-between hover:border-slate-700/80 transition-all">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Agendamentos de Hoje</span>
            <span className="text-3xl font-extrabold text-white mt-1 block font-display">{todayAppointments.length}</span>
            <span className="text-[10px] text-indigo-400 font-semibold block mt-1">Dia: 16 de Junho</span>
          </div>
          <div className="w-11 h-11 bg-indigo-600/10 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-600/20">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm flex items-center justify-between hover:border-slate-700/80 transition-all">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Aguardando Confirmação</span>
            <span className="text-3xl font-extrabold text-amber-500 mt-1 block font-display">{pendingAppointments.length}</span>
            <span className="text-[10px] text-slate-500 block mt-1">Ações pendentes na fila</span>
          </div>
          <div className="w-11 h-11 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm flex items-center justify-between hover:border-slate-700/80 transition-all">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Total de Clientes</span>
            <span className="text-3xl font-extrabold text-white mt-1 block font-display">{totalClients}</span>
            <span className="text-[10px] text-slate-500 block mt-1">Sincronizados via Firestore</span>
          </div>
          <div className="w-11 h-11 bg-slate-850 hover:bg-slate-800 text-slate-350 text-indigo-400 rounded-xl flex items-center justify-center border border-slate-800">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 (Featured Bento Box!) */}
        <div className="bg-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg border border-indigo-500/30 flex flex-col justify-between min-h-[140px]">
          <div className="relative z-10">
            <p className="text-indigo-150 text-indigo-100 text-xs font-medium uppercase tracking-wider mb-1">Faturamento Estimado</p>
            <h3 className="text-3xl font-extrabold mb-3 font-display">R$ {estimatedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <div className="flex items-center gap-1.5 text-[10px] bg-indigo-500/50 w-fit px-2 py-1 rounded border border-indigo-400/20">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Soma de agendas confirmadas</span>
            </div>
          </div>
          {/* Decorative element matching original Bento Design */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Main Grid Content displays */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left component: Appointments Ledger (8 cols) */}
        <div className="lg:col-span-8 space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Hoje <span className="text-slate-500 text-sm font-normal">— Terça, 16 de Junho de 2026</span></h3>
              <p className="text-xs text-slate-400">Gerencie todos os horários agendados por clientes e inclua atendimento manual.</p>
            </div>
            <button 
              onClick={() => {
                if(services.length === 0) {
                  alert("Por favor, adicione pelo menos um Serviço primeiro na aba 'Serviços'!");
                  return;
                }
                setSelectedServiceId(services[0].id);
                setIsModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 self-start sm:self-center transition-all cursor-pointer outline-none select-none shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Novo Agendamento
            </button>
          </div>

          {/* Quick search and filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text"
                placeholder="Pesquisar cliente ou serviço..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 pl-9 pr-4 text-xs text-white outline-none focus:border-indigo-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filtrar:
              </span>
              <select
                className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer font-medium"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">Todos Status</option>
                <option value="pending">Pendente</option>
                <option value="confirmed">Confirmados</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
          </div>

          {/* Appointments list */}
          <div className="flex-1 space-y-4">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12 bg-slate-950 border border-slate-800 rounded-xl">
                <p className="text-sm text-slate-500 italic">Nenhum agendamento encontrado para os filtros selecionados.</p>
              </div>
            ) : (
              filteredAppointments.map((app) => (
                <div key={app.id} className="flex gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:bg-slate-800/50 transition-all items-center">
                  <div className="text-center min-w-[55px]">
                    <p className="text-base font-bold text-white font-mono">{app.time}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{app.duration} min</p>
                  </div>
                  <div className={`w-1 self-stretch rounded-full shrink-0 ${
                    app.status === 'confirmed' ? 'bg-indigo-500' :
                    app.status === 'pending' ? 'bg-amber-500' : 'bg-slate-600'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{app.customerName}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{app.serviceName}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden sm:block">
                      {app.status === 'confirmed' && (
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] rounded border border-emerald-500/20 uppercase font-bold">Confirmado</span>
                      )}
                      {app.status === 'pending' && (
                        <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-[10px] rounded border border-amber-500/20 uppercase font-bold">Pendente</span>
                      )}
                      {app.status === 'cancelled' && (
                        <span className="px-2 py-1 bg-slate-700 text-slate-400 text-[10px] rounded uppercase font-bold">Cancelado</span>
                      )}
                    </div>

                    {app.status !== 'cancelled' && (
                      <div className="flex items-center gap-2">
                        {app.status === 'pending' && (
                          <button 
                            onClick={() => updateAppointmentStatus(app.id, 'confirmed')}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-colors outline-none cursor-pointer"
                          >
                            Confirmar
                          </button>
                        )}
                        <button 
                          onClick={() => updateAppointmentStatus(app.id, 'cancelled')}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-red-400 text-slate-400 font-bold rounded-lg text-xs transition-colors outline-none cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right component: Feed de Alertas & Notificações (4 cols) - Bento Style */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Notificações</h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
            {notifications.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-500 italic">Nenhuma notificação recente.</p>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => markNotificationRead(notif.id)}
                  className={`flex gap-3 cursor-pointer p-1 rounded-lg transition-all ${notif.read ? 'opacity-40 hover:opacity-75' : 'hover:bg-slate-800/30'}`}
                >
                  <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center ${
                    notif.type === 'confirm' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
                  }`}>
                    {notif.type === 'confirm' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold font-mono">i</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-300 leading-tight">{notif.title}</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">{notif.message}</p>
                    <p className="text-[9px] text-slate-550 text-slate-500 mt-1 font-mono">
                      {new Date(notif.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Walk-in custom modal creation */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-fade-in text-slate-200">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h4 className="text-md font-bold text-white font-display">Agendamento Manual Walk-in</h4>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-850 text-slate-400 rounded-full cursor-pointer transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickBookingSubmit} className="p-5 space-y-4">
              {modalError && (
                <p className="p-3 bg-red-950 border border-red-900 text-xs text-red-450 text-red-400 rounded-xl font-medium">
                  {modalError}
                </p>
              )}

              <div className="space-y-1">
                <label className="text-xs text-slate-400 block font-semibold">Nome do Cliente</label>
                <input 
                  type="text" required
                  className="w-full px-3 py-2 bg-slate-950 text-sm text-white rounded-xl border border-slate-800 outline-none focus:border-indigo-500 transition-all"
                  value={clientName} onChange={(e) => setClientName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-semibold">Telefone</label>
                  <input 
                    type="text" required
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 bg-slate-950 text-sm text-white rounded-xl border border-slate-800 outline-none focus:border-indigo-500 transition-all"
                    value={clientPhone} onChange={(e) => setClientPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-semibold">Email (Opcional)</label>
                  <input 
                    type="email"
                    placeholder="email@cliente.com"
                    className="w-full px-3 py-2 bg-slate-950 text-sm text-white rounded-xl border border-slate-800 outline-none focus:border-indigo-500 transition-all"
                    value={clientEmail} onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 block font-semibold">Escolha o Serviço</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-950 text-sm text-white rounded-xl border border-slate-800 outline-none cursor-pointer focus:border-indigo-500 transition-all"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                >
                  {services.map(srv => (
                    <option key={srv.id} value={srv.id} className="bg-slate-900 text-white">{srv.name} - R$ {srv.price} ({srv.duration} min)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-semibold">Data</label>
                  <input 
                    type="date" required
                    className="w-full px-3 py-2 bg-slate-950 text-sm text-white rounded-xl border border-slate-800 outline-none focus:border-indigo-500 transition-all"
                    value={bookingDate} onChange={(e) => setBookingDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-semibold">Horário</label>
                  <input 
                    type="time" required
                    className="w-full px-3 py-2 bg-slate-950 text-sm text-white rounded-xl border border-slate-800 outline-none focus:border-indigo-500 transition-all"
                    value={bookingTime} onChange={(e) => setBookingTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 block font-semibold">Anotações Internas (Opcional)</label>
                <textarea 
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 text-sm text-white rounded-xl border border-slate-800 outline-none focus:border-indigo-500 transition-all resize-none"
                  value={bookingNotes} onChange={(e) => setBookingNotes(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-800">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-850 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-all outline-none cursor-pointer"
                >
                  Gravar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
