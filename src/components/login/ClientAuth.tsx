import React, { useState } from 'react';
import { useFirebase } from '../../context/FirebaseContext';
import { maskBrazilianPhone } from '../../utils/phoneMask';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Check, 
  Clock, 
  CalendarDays, 
  Search,
  CheckCircle2, 
  Sparkles,
  Ticket,
  ChevronRight,
  Plus,
  Trash2,
  X,
  UserCheck,
  MapPin
} from 'lucide-react';

interface ClientAuthProps {
  onSetFeedback: (msg: { type: 'success' | 'error', text: string } | null) => void;
}

export default function ClientAuth({ onSetFeedback }: ClientAuthProps) {
  const { 
    appointments, 
    services, 
    customers, 
    addCustomer,
    createAppointment, 
    updateAppointmentStatus,
    profile,
    sessionClient,
    setSessionClient,
    fetchCustomerAndSync,
    fetchAppointmentsAndSync
  } = useFirebase();

  // Authentication toggles
  const [formType, setFormType] = useState<'login' | 'register'>('login');

  // Input states
  const [clientPhone, setClientPhone] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientState, setClientState] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Booking Stepper inside Client Hub
  const [bookingStep, setBookingStep] = useState<'idle' | 'service' | 'datetime' | 'confirm'>('idle');
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState('2026-06-16');
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [notes, setNotes] = useState('');

  // Handle Client Login Lookup using direct Firestore retrieval
  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    onSetFeedback(null);
    if (!clientPhone) {
      onSetFeedback({ type: 'error', text: 'Por favor, insira o número de telefone de cadastro.' });
      return;
    }

    setIsSubmitting(true);
    const cleanedInput = clientPhone.replace(/\D/g, '');

    try {
      // 1. Core synchronization: Retrieve directly from Firestore if online
      let matchedCustomer = await fetchCustomerAndSync(clientPhone);
      
      if (matchedCustomer) {
        // Logged-in customer exists: sync their appointments as well
        await fetchAppointmentsAndSync(clientPhone);
      } else {
        // 2. Legacy fallback to local database
        matchedCustomer = customers.find(c => c.phone.replace(/\D/g, '') === cleanedInput) ||
                          customers.find(c => c.name.toLowerCase() === clientPhone.toLowerCase()) ||
                          appointments.find(a => a.customerPhone.replace(/\D/g, '') === cleanedInput)?.customerName;
      }

      setIsSubmitting(false);

      if (matchedCustomer) {
        const name = typeof matchedCustomer === 'string' ? matchedCustomer : matchedCustomer.name;
        const email = typeof matchedCustomer === 'string' ? '' : (matchedCustomer.email || '');
        const state = typeof matchedCustomer === 'string' ? '' : (matchedCustomer.state || '');
        const city = typeof matchedCustomer === 'string' ? '' : (matchedCustomer.city || '');
        const id = typeof matchedCustomer === 'string' ? `cust_${cleanedInput}` : matchedCustomer.id;

        setSessionClient({
          id,
          name: name,
          phone: clientPhone,
          email: email,
          state: state,
          city: city,
          totalAppointments: typeof matchedCustomer === 'string' ? 0 : matchedCustomer.totalAppointments,
          lastAppointmentDate: typeof matchedCustomer === 'string' ? '' : matchedCustomer.lastAppointmentDate
        });
        onSetFeedback({ type: 'success', text: `Bem-vindo de volta, ${name}! Seu Portal de Agendamentos foi carregado com seus dados públicos.` });
      } else {
        // Redireciona para cadastro se não encontrado
        setFormType('register');
        onSetFeedback({ 
          type: 'error', 
          text: 'Seu telefone não possui cadastro em nossa base. Por favor, realize o cadastro simples de cliente abaixo.' 
        });
      }
    } catch (err) {
      setIsSubmitting(false);
      console.error("Client login action failed:", err);
      onSetFeedback({ type: 'error', text: 'Erro ao carregar dados do cliente do Firebase. Verifique sua conexão.' });
    }
  };

  // Handle Client Registration
  const handleClientRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    onSetFeedback(null);
    if (!clientName || !clientPhone || !clientEmail || !clientState || !clientCity) {
      onSetFeedback({ type: 'error', text: 'Preencha todos os campos, incluindo o e-mail obrigatório para receber futuras promoções.' });
      return;
    }

    if (!clientEmail.includes('@') || !clientEmail.includes('.')) {
      onSetFeedback({ type: 'error', text: 'Por favor, insira um endereço de e-mail válido.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await addCustomer({
        name: clientName,
        phone: clientPhone,
        email: clientEmail,
        state: clientState,
        city: clientCity
      });
      
      onSetFeedback({ 
        type: 'success', 
        text: `Cadastro de cliente '${clientName}' efetuado com sucesso!` 
      });

      // Redirect to Login page right away as requested by the user!
      setTimeout(() => {
        setFormType('login');
        // Pre-fill telephone in login form
        setClientPhone(clientPhone);
        onSetFeedback({
          type: 'success',
          text: 'Cadastro concluído com sucesso! Agora insira seu telefone para acessar o Portal.'
        });
      }, 1500);

    } catch (error) {
      console.error(error);
      onSetFeedback({ type: 'error', text: 'Houve um erro ao cadastrar o cliente na base de dados.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Client books appointments on behalf of themselves
  const handleStartBooking = () => {
    setBookingStep('service');
  };

  const handleSelectService = (srv: any) => {
    setSelectedService(srv);
    setBookingStep('datetime');
  };

  const handleCompleteBooking = async () => {
    if (!selectedService || !sessionClient) return;

    try {
      await createAppointment({
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        duration: selectedService.duration,
        customerName: sessionClient.name,
        customerPhone: sessionClient.phone,
        customerEmail: sessionClient.email || '',
        date: selectedDate,
        time: selectedTime,
        status: 'pending',
        notes: notes || 'Agendado diretamente pelo Portal Schedulify do Cliente',
      });

      setBookingStep('idle');
      setSelectedService(null);
      setNotes('');
      onSetFeedback({ type: 'success', text: 'Seu agendamento foi efetuado e já está visível para a empresa no painel!' });
    } catch (err) {
      onSetFeedback({ type: 'error', text: 'Não foi possível concluir o agendamento.' });
    }
  };

  // Filter appointments that belong to active logged customer
  const clientAppointments = appointments.filter(appt => {
    if (!sessionClient) return false;
    const clientPhoneClean = sessionClient.phone.replace(/\D/g, '');
    const apptPhoneClean = appt.customerPhone.replace(/\D/g, '');
    return clientPhoneClean === apptPhoneClean || appt.customerName.toLowerCase() === sessionClient.name.toLowerCase();
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
      <div className="absolute right-0 top-0 w-60 h-60 bg-indigo-500/5 blur-3xl pointer-events-none" />

      {/* PORTAL DO CLIENTE - LOGGED STATE */}
      {sessionClient ? (
        <div className="space-y-6 animate-fade-in">
          {/* User Welcome profile top bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-950 border border-slate-850 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">{sessionClient.name}</h3>
                <p className="text-[10px] text-slate-550 text-slate-400 font-mono font-medium">{sessionClient.phone} {sessionClient.email ? `• ${sessionClient.email}` : ''}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleStartBooking}
                className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Agendamento
              </button>
              <button
                type="button"
                onClick={() => {
                  setSessionClient(null);
                  setBookingStep('idle');
                  onSetFeedback(null);
                }}
                className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
              >
                Sair do Portal
              </button>
            </div>
          </div>

          {/* ACTIVE STEPPER IF BOOKING IN PROGRESS */}
          {bookingStep !== 'idle' && (
            <div className="p-5 bg-indigo-950/20 border border-indigo-500/25 rounded-xl space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  Passo {bookingStep === 'service' ? '1: Escolher Serviço' : bookingStep === 'datetime' ? '2: Data e Horário' : '3: Revisar'}
                </span>
                <button 
                  onClick={() => setBookingStep('idle')} 
                  className="p-1 hover:bg-slate-850 rounded text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* STEP 1: SERVICE CHOICE */}
              {bookingStep === 'service' && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-300">Selecione o serviço ideal oferecido por {profile.name}:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {services.filter(s => s.active).map(s => (
                      <div 
                        key={s.id}
                        onClick={() => handleSelectService(s)}
                        className="p-3 bg-slate-950 border border-slate-850 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all flex justify-between items-center group"
                      >
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-indigo-400">{s.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{s.duration} min • {s.category}</p>
                        </div>
                        <span className="text-xs font-black text-indigo-450 text-indigo-400 font-mono">
                          R$ {s.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: DATETIME */}
              {bookingStep === 'datetime' && selectedService && (
                <div className="space-y-4">
                  <div className="p-2 bg-slate-950 border border-slate-850 rounded-lg text-xs flex justify-between">
                    <div>
                      <span className="text-slate-500">Serviço:</span> <span className="font-bold text-white">{selectedService.name}</span>
                    </div>
                    <span className="font-mono text-indigo-400 font-bold">R$ {selectedService.price}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Escolha a data</label>
                      <input 
                        type="date"
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 text-white text-xs rounded-lg outline-none"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Horário</label>
                      <select
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 text-white text-xs rounded-lg outline-none"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                      >
                        {['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Observações (Opcional)</label>
                    <input 
                      type="text"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-855 bg-slate-950 border-slate-800 text-white text-xs rounded-lg outline-none"
                      placeholder="Ex: Quero com o profissional X"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setBookingStep('service')}
                      className="px-4 py-2 border border-slate-800 text-slate-400 text-xs font-bold rounded-xl hover:text-white"
                    >
                      Voltar
                    </button>
                    <button 
                      type="button" 
                      onClick={handleCompleteBooking}
                      className="flex-1 py-1 px-4 bg-indigo-600 hover:bg-indigo-505 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow cursor-pointer"
                    >
                      Confirmar e Agendar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ACTIVE APPOINTMENTS HISTORY */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-indigo-400" />
              Seus Agendamentos Disponíveis ({clientAppointments.length})
            </h4>

            {clientAppointments.length === 0 ? (
              <div className="p-6 bg-slate-950/40 border border-slate-850 border-dashed rounded-xl text-center text-xs text-slate-500 leading-normal">
                Nenhum agendamento ativo encontrado para o telefone informado.<br/>
                Para simular, clique em <span className="text-indigo-455 text-indigo-400 font-bold">Novo Agendamento</span> acima e complete uma reserva!
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {clientAppointments.map((appt) => (
                  <div 
                    key={appt.id}
                    className="p-4 bg-slate-950 border border-slate-850 rounded-xl hover:border-slate-800 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-white">{appt.serviceName}</span>
                        {/* Status chip */}
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                          appt.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-405 text-emerald-400 border border-emerald-500/20' :
                          appt.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-550/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {appt.status === 'confirmed' ? 'Confirmado' : appt.status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-[10px] text-slate-450 text-slate-400 font-mono">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-500" /> {appt.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-500" /> {appt.time}</span>
                      </div>
                      {appt.notes && <p className="text-[10px] text-slate-500 leading-normal mt-1 italic">Obs: {appt.notes}</p>}
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                      <div className="text-xs text-slate-300 font-black font-mono">R$ {appt.price}</div>
                      {appt.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => {
                            updateAppointmentStatus(appt.id, 'cancelled');
                            onSetFeedback({ type: 'success', text: `O seu agendamento do serviço '${appt.serviceName}' foi cancelado no sistema.` });
                          }}
                          className="p-1.5 hover:bg-red-500/10 border border-slate-850 hover:border-red-500/30 text-slate-500 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                          title="Cancelar Agendamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* DISCONNECTED / OUT OF SESSION: RENDER CLEAN CLIENT ACCESS */
        <div className="space-y-6 animate-fade-in">
          <div className="text-center space-y-1">
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 max-w-[170px] mx-auto mb-3">
              <button
                type="button"
                onClick={() => setFormType('login')}
                className={`flex-1 py-1 text-[10px] font-bold rounded cursor-pointer ${formType === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-450 text-slate-400'}`}
              >
                Acessar Portal
              </button>
              <button
                type="button"
                onClick={() => setFormType('register')}
                className={`flex-1 py-1 text-[10px] font-bold rounded cursor-pointer ${formType === 'register' ? 'bg-indigo-600 text-white' : 'text-slate-450 text-slate-400'}`}
              >
                Novo Cadastro
              </button>
            </div>

            <h1 className="text-xl font-bold text-white tracking-tight font-display">Portal do Cliente</h1>
            <p className="text-xs text-slate-400">
              {formType === 'login' ? 'Consulte seus agendamentos e faça reservas' : 'Cadastre seu perfil de agendamentos'}
            </p>
          </div>

          <form onSubmit={formType === 'login' ? handleClientLogin : handleClientRegister} className="space-y-4">
            {formType === 'register' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text"
                    required
                    placeholder="Ex: João da Silva"
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-550 text-white text-xs rounded-xl outline-none"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1 font-sans">
              <label className="text-[10px] font-bold text-slate-400 uppercase block">Telefone de Contato *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  required
                  placeholder="(88) 9 9761-4430"
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-550 text-white text-xs rounded-xl outline-none"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(maskBrazilianPhone(e.target.value))}
                />
              </div>
            </div>

            {formType === 'register' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Endereço de E-mail * (Obrigatório para Promoções)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="email"
                    required
                    placeholder="joao@gmail.com"
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-550 text-white text-xs rounded-xl outline-none"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
              </div>
            )}

            {formType === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Estado (UF)</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      required
                      placeholder="Ex: SP"
                      maxLength={2}
                      className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-550 text-white text-xs rounded-xl outline-none uppercase"
                      value={clientState}
                      onChange={(e) => setClientState(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Cidade</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      required
                      placeholder="Ex: São Paulo"
                      className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-550 text-white text-xs rounded-xl outline-none"
                      value={clientCity}
                      onChange={(e) => setClientCity(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-indigo-650 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4 shrink-0" />
                  {formType === 'login' ? 'Entrar no Hub' : 'Criar Conta de Cliente'}
                </>
              )}
            </button>
          </form>

          {/* Quick instructions */}
          <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-[10px]/normal text-slate-450 text-slate-400 font-medium">
            💡 <span className="font-bold text-white">Dica Comercial:</span> Clientes cadastrados se integram automaticamente com o banco de dados principal. Digite seu telefone ou crie um cadastro para ver o fluxo em ação.
          </div>
        </div>
      )}
    </div>
  );
}
