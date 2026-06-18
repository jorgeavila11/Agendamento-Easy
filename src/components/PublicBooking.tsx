import React, { useState, useEffect } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { Service, Appointment } from '../types';
import { 
  Calendar, 
  Clock, 
  Scissors, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  AlertTriangle, 
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Heart,
  User,
  ExternalLink,
  Mail,
  Search,
  Lock
} from 'lucide-react';

const WEEKDAYS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado'
];

export default function PublicBooking() {
  const { 
    profile, 
    services, 
    appointments, 
    customers,
    createAppointment, 
    addCustomer,
    fetchCustomerAndSync,
    sessionClient, 
    setSessionClient 
  } = useFirebase();

  // Booking Flow Steps
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-16'); // default matching mockup
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Registration Dialog
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successBooking, setSuccessBooking] = useState<Appointment | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Pre-populate if client session is authenticated
  useEffect(() => {
    if (sessionClient) {
      setCustomerName(sessionClient.name);
      setCustomerPhone(sessionClient.phone);
      setCustomerEmail(sessionClient.email || '');
      setCustomerState(sessionClient.state || '');
      setCustomerCity(sessionClient.city || '');
    }
  }, [sessionClient]);

  // Auto select first active service if none is selected
  useEffect(() => {
    const activeOnes = services.filter(s => s.active);
    if (activeOnes.length > 0 && !selectedService) {
      setSelectedService(activeOnes[0]);
    }
  }, [services, selectedService]);

  // Generate simple 14-day booking calendar range (starting today June 16, 2026)
  const [calendarDays, setCalendarDays] = useState<{ date: string; dayLabel: string; isBlocked: boolean; dayOfWeek: number }[]>([]);
  
  useEffect(() => {
    const days = [];
    const baseDate = new Date('2026-06-16T12:00:00'); // stable UTC/Local mock starting June 16th, 2026
    
    for (let i = 0; i < 14; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = d.toISOString().substring(0, 10); // "YYYY-MM-DD"
      const dayOfWeek = d.getDay();
      
      // Determine if date setting enabled
      const daySetting = profile.workingSettings.workingDays.find(w => w.dayOfWeek === dayOfWeek);
      const isDayOff = !daySetting || !daySetting.enabled;
      
      // Check custom blocklist
      const isCustomBlock = profile.workingSettings.blockedDates.some(b => b.date === dateStr);
      
      days.push({
        date: dateStr,
        dayLabel: d.getDate().toString(),
        dayOfWeek,
        isBlocked: isDayOff || isCustomBlock
      });
    }
    setCalendarDays(days);
  }, [profile]);

  // Generate available hourly slots based on the selectedDate setting and interval
  const [availableSlots, setAvailableSlots] = useState<{ time: string; isTaken: boolean }[]>([]);

  useEffect(() => {
    if (!selectedDate) return;
    
    const d = new Date(`${selectedDate}T12:00:00`);
    const dayOfWeek = d.getDay();
    const daySetting = profile.workingSettings.workingDays.find(w => w.dayOfWeek === dayOfWeek);
    
    if (!daySetting || !daySetting.enabled) {
      setAvailableSlots([]);
      return;
    }

    // Check if custom blocked
    const isCustomBlock = profile.workingSettings.blockedDates.some(b => b.date === selectedDate);
    if (isCustomBlock) {
      setAvailableSlots([]);
      return;
    }

    // Generate times range start -> end
    const slots = [];
    let [startH, startM] = daySetting.startTime.split(':').map(Number);
    const [endH, endM] = daySetting.endTime.split(':').map(Number);
    const interval = profile.workingSettings.intervalMinutes;

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes < endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      
      // Check if time is already taken by a confirmed booking on that specific date
      const isTaken = appointments.some(app => 
        app.date === selectedDate && 
        app.time === timeStr && 
        app.status !== 'cancelled'
      );

      slots.push({
        time: timeStr,
        isTaken
      });

      currentMinutes += interval;
    }

    setAvailableSlots(slots);
    // Reset selected slot if not exists in new slots
    setSelectedTime('');
  }, [selectedDate, profile, appointments]);

  const handleBookingConfirmClick = () => {
    if (!selectedService) {
      alert("Por favor, selecione um serviço.");
      return;
    }
    if (!selectedDate || !selectedTime) {
      alert("Por favor, escolha uma data e horário disponíveis.");
      return;
    }
    setErrorMessage('');
    setIsSubmitModalOpen(true);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsAuthenticating(true);

    if (!selectedService) {
      setIsAuthenticating(false);
      return;
    }

    try {
      let activeCustomer = sessionClient;

      // If there is no active logged-in client, login or register first!
      if (!activeCustomer) {
        if (authTab === 'login') {
          if (!customerPhone) {
            setErrorMessage("Por favor, informe seu telefone celular cadastrado.");
            setIsAuthenticating(false);
            return;
          }
          const cleanedPhone = customerPhone.replace(/\D/g, "");
          let found = await fetchCustomerAndSync(cleanedPhone);
          if (!found && customers) {
            // lookup offline fallback
            found = customers.find(c => c.phone.replace(/\D/g, "") === cleanedPhone) || null;
          }

          if (found) {
            setSessionClient(found);
            activeCustomer = found;
          } else {
            setErrorMessage("Nenhum cadastro encontrado com este telefone. Por favor, acesse a aba 'Criar Cadastro' abaixo.");
            setIsAuthenticating(false);
            return;
          }
        } else {
          // Register form
          if (!customerName || !customerPhone || !customerEmail || !customerState || !customerCity) {
            setErrorMessage("Por favor, preencha todos os campos obrigatórios. O e-mail é obrigatório para receber futuras promoções.");
            setIsAuthenticating(false);
            return;
          }

          if (!customerEmail.includes('@') || !customerEmail.includes('.')) {
            setErrorMessage("Por favor, insira um endereço de e-mail válido.");
            setIsAuthenticating(false);
            return;
          }

          const phoneDigits = customerPhone.replace(/\D/g, "");
          const customerId = `cust_${phoneDigits}`;
          const newCust = {
            id: customerId,
            name: customerName,
            phone: customerPhone,
            email: customerEmail,
            state: customerState,
            city: customerCity,
            totalAppointments: 0,
            lastAppointmentDate: ""
          };

          await addCustomer(newCust);
          setSessionClient(newCust);
          activeCustomer = newCust;
        }
      }

      // Safeguard
      if (!activeCustomer) {
        setErrorMessage("Não foi possível identificar seu cadastro.");
        setIsAuthenticating(false);
        return;
      }

      const result = await createAppointment({
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        duration: selectedService.duration,
        customerName: activeCustomer.name,
        customerPhone: activeCustomer.phone,
        customerEmail: activeCustomer.email,
        date: selectedDate,
        time: selectedTime,
        status: 'pending', // Public bookings start as pending
        notes
      });

      if (result === "CONFLITO_HORARIO") {
        setErrorMessage("Esse horário acabou de ser reservado por outro cliente. Por favor, selecione outro slot.");
      } else if (typeof result === 'object') {
        setSuccessBooking(result);
        setIsSuccess(true);
        setIsSubmitModalOpen(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Erro durante o processamento do agendamento.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const resetFlow = () => {
    setIsSuccess(false);
    setSuccessBooking(null);
    setNotes('');
    setSelectedTime('');
    if (!sessionClient) {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerState('');
      setCustomerCity('');
    }
  };

  if (isSuccess && successBooking) {
    return (
      <div className="max-w-xl mx-auto bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-950 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        
        <div>
          <h3 className="text-2xl font-bold text-white">Agendamento Solicitado!</h3>
          <p className="text-sm text-neutral-400 mt-2">Seu agendamento foi encaminhado com sucesso e está pendente de confirmação pelo profissional.</p>
        </div>

        <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-850 text-left space-y-3 font-mono text-xs text-neutral-300">
          <div><span className="text-neutral-500">Workspace:</span> {profile.name}</div>
          <div><span className="text-neutral-500">Serviço:</span> {successBooking.serviceName}</div>
          <div><span className="text-neutral-500">Data/Hora:</span> {successBooking.date.split('-').reverse().join('/')} às {successBooking.time}</div>
          <div><span className="text-neutral-500">Duração:</span> {successBooking.duration} minutos</div>
          <div><span className="text-neutral-500">Total:</span> R$ {successBooking.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="p-4 bg-neutral-950 text-neutral-400 rounded-xl border border-neutral-850 italic text-xs text-left">
          Enviamos uma notificação sobre o agendamento. Você receberá um lembrete do profissional via email ou telefone antes do atendimento.
        </div>

        <button 
          onClick={resetFlow}
          className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 outline-none active:scale-95 transition-all"
        >
          Novo Agendamento
        </button>
      </div>
    );
  }

  if (!sessionClient) {
    return (
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl animate-fade-in text-left">
        {/* Banner Column */}
        <div className="md:col-span-5 relative min-h-[250px] md:min-h-full flex flex-col justify-end p-8 bg-neutral-950">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaKtwsm7_GInilEPbn0Q8kO8vGPTPmD_l53662ZzXTdMA_Tn8p9JlG-vMu62oyZ4C1f4Uojl-UAh3AebF7e41h9LlrnSGn0P5du0NxtBr5Cyiy2hbNoBdZGFxS7IDQuODZElyYBADDo2WV_XJZ2UXqH5z1cYxKArF2ki2mZJFeo1HQvngVwsbakFGJI0eWZ4rCW53WgPBdhfyzJiTP3DDNQRCmScMbSrCzanfewfbjdspg3K-ep3pf-mvTgtL1MuK5pnpppBX4Ww"
            alt="Agendamento"
            className="absolute inset-0 w-full h-full object-cover opacity-30 select-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent" />
          <div className="relative z-10 space-y-3">
            <span className="text-[10px] font-extrabold uppercase bg-primary/20 text-primary px-2.5 py-1 rounded-full border border-primary/20 tracking-wider inline-block">
              Área de Agendamento
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight">{profile.name}</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Para escolher seu serviço e reservar seu horário personalizado em nosso calendário, faça login ou crie uma conta rápida de cliente.
            </p>
          </div>
        </div>

        {/* Authentication Form Column */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6 bg-neutral-900">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Identificação do Cliente
            </h1>
            <p className="text-xs text-neutral-400">
              {authTab === 'login' 
                ? 'Conecte-se para reativar seu perfil e ter acesso à tela de agendamentos.' 
                : 'Crie seu cadastro de cliente para acessar e agendar.'
              }
            </p>
          </div>

          <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-850">
            <button
              type="button"
              onClick={() => { setAuthTab('login'); setErrorMessage(''); }}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${authTab === 'login' ? 'bg-primary text-white shadow-md' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              Acessar Conta (Entrar)
            </button>
            <button
              type="button"
              onClick={() => { setAuthTab('register'); setErrorMessage(''); }}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${authTab === 'register' ? 'bg-primary text-white shadow-md' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              Criar Conta (Cadastro)
            </button>
          </div>

          {errorMessage && (
            <p className="p-3 bg-red-950 border border-red-900 text-xs text-red-400 rounded-xl font-medium leading-relaxed">
              ⚠️ {errorMessage}
            </p>
          )}

          <form onSubmit={async (e) => {
            e.preventDefault();
            setErrorMessage('');
            setIsAuthenticating(true);
            try {
              if (authTab === 'login') {
                if (!customerPhone) {
                  setErrorMessage('Por favor, informe seu telefone celular cadastrado.');
                  setIsAuthenticating(false);
                  return;
                }
                const cleanedPhone = customerPhone.replace(/\D/g, "");
                let found = await fetchCustomerAndSync(cleanedPhone);
                if (!found && customers) {
                  found = customers.find(c => c.phone.replace(/\D/g, "") === cleanedPhone) || null;
                }

                if (found) {
                  setSessionClient(found);
                } else {
                  setAuthTab('register');
                  setErrorMessage("Seu telefone não possui cadastro em nossa base. Por favor, realize o cadastro simples de cliente abaixo.");
                }
              } else {
                // Register
                if (!customerName || !customerPhone || !customerEmail || !customerState || !customerCity) {
                  setErrorMessage("Por favor, preencha todos os campos obrigatórios.");
                  setIsAuthenticating(false);
                  return;
                }

                if (!customerEmail.includes('@') || !customerEmail.includes('.')) {
                  setErrorMessage("Por favor, insira um endereço de e-mail válido.");
                  setIsAuthenticating(false);
                  return;
                }

                const cleanedPhone = customerPhone.replace(/\D/g, "");
                // Check if already exists before creating
                let foundExisting = await fetchCustomerAndSync(cleanedPhone);
                if (!foundExisting && customers) {
                  foundExisting = customers.find(c => c.phone.replace(/\D/g, "") === cleanedPhone) || null;
                }
                if (foundExisting) {
                  setErrorMessage("Este número de telefone já possui uma conta criada. Por favor, acesse a aba 'Acessar Conta'.");
                  setIsAuthenticating(false);
                  return;
                }

                const newCust = {
                  id: `cust_${cleanedPhone}`,
                  name: customerName,
                  phone: customerPhone,
                  email: customerEmail,
                  state: customerState,
                  city: customerCity,
                  totalAppointments: 0,
                  lastAppointmentDate: ""
                };

                await addCustomer(newCust);
                setSessionClient(newCust);
                setNotes('');
              }
            } catch (err: any) {
              console.error(err);
              setErrorMessage("Ocorreu um erro ao processar sua identificação.");
            } finally {
              setIsAuthenticating(false);
            }
          }} className="space-y-4">
            {authTab === 'login' ? (
              <div className="space-y-1">
                <label className="text-xs text-neutral-400 block font-bold">Telefone Celular Cadastrado</label>
                <input 
                  type="text" required
                  placeholder="Ex: (11) 99999-9999"
                  className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-xl outline-none focus:border-primary placeholder-neutral-700 font-medium"
                  value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 block font-bold">Nome Completo *</label>
                    <input 
                      type="text" required
                      placeholder="Ex: Ana Souza"
                      className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-xl outline-none focus:border-primary placeholder-neutral-700 font-medium"
                      value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 block font-bold">Telefone Celular *</label>
                    <input 
                      type="text" required
                      placeholder="Ex: (11) 99999-9999"
                      className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-xl outline-none focus:border-primary placeholder-neutral-700 font-medium"
                      value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1 font-sans">
                  <label className="text-xs text-neutral-400 block font-bold">E-mail * (Obrigatório para Promoções)</label>
                  <input 
                    type="email" required
                    placeholder="nome@servidor.com"
                    className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-xl outline-none focus:border-primary placeholder-neutral-700 font-medium"
                    value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 font-sans">
                  <div className="space-y-1 col-span-1">
                    <label className="text-xs text-neutral-400 block font-bold">Estado (UF) *</label>
                    <input 
                      type="text" required
                      placeholder="Ex: SP"
                      maxLength={2}
                      className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-xl outline-none focus:border-primary placeholder-neutral-700 uppercase font-medium"
                      value={customerState} onChange={(e) => setCustomerState(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs text-neutral-400 block font-bold">Cidade *</label>
                    <input 
                      type="text" required
                      placeholder="Ex: Campinas"
                      className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-xl outline-none focus:border-primary placeholder-neutral-700 font-medium font-sans"
                      value={customerCity} onChange={(e) => setCustomerCity(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-2.5 bg-primary hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs active:scale-95 transition-all outline-none disabled:opacity-50 flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {isAuthenticating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Processando...</span>
                </>
              ) : authTab === 'login' ? (
                <span className="flex items-center gap-1.5"><Search className="w-4 h-4" /> Entrar e Ver Horários</span>
              ) : (
                <span className="flex items-center gap-1.5 font-sans">Criar Conta e Ver Horários &rarr;</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 font-sans">
      {/* Client Logged In Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-emerald-950/20 border border-emerald-500/15 rounded-2xl gap-3 animate-fade-in shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </div>
          <p className="text-xs text-slate-300 font-medium">
            Logado como <strong className="text-white font-extrabold">{sessionClient.name}</strong> ({sessionClient.email}).
          </p>
        </div>
        <button 
          onClick={() => setSessionClient(null)}
          className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest cursor-pointer bg-red-950/30 px-3 py-1.5 rounded-lg border border-red-900/40"
        >
          Desconectar / Trocar de Conta
        </button>
      </div>

      {/* Visual Portal Banner Section */}
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-xl border border-neutral-800">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaKtwsm7_GInilEPbn0Q8kO8vGPTPmD_l53662ZzXTdMA_Tn8p9JlG-vMu62oyZ4C1f4Uojl-UAh3AebF7e41h9LlrnSGn0P5du0NxtBr5Cyiy2hbNoBdZGFxS7IDQuODZElyYBADDo2WV_XJZ2UXqH5z1cYxKArF2ki2mZJFeo1HQvngVwsbakFGJI0eWZ4rCW53WgPBdhfyzJiTP3DDNQRCmScMbSrCzanfewfbjdspg3K-ep3pf-mvTgtL1MuK5pnpppBX4Ww" 
          alt="Boutique beauty salon interior with minimalist luxury Emerald chairs" 
          className="w-full h-full object-cover select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
        
        {/* Profile Card Overlay */}
        <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row items-start md:items-end md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary bg-neutral-800 shrink-0 shadow-lg">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-center flex items-center justify-center h-full">SE</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">{profile.name}</h3>
                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-extrabold select-none">OFICIAL</span>
              </div>
              <p className="text-xs text-neutral-300 mt-1 max-w-xl leading-relaxed truncate md:whitespace-normal">{profile.description}</p>
            </div>
          </div>

          <div className="hidden sm:flex flex-col text-right text-xs text-neutral-400 gap-1 font-semibold">
            <span className="flex items-center justify-end gap-1"><MapPin className="w-3.5 h-3.5 text-primary" /> {profile.address}</span>
            <span className="flex items-center justify-end gap-1"><Phone className="w-3.5 h-3.5 text-primary" /> {profile.phone}</span>
          </div>
        </div>
      </div>

      {/* Booking Form Interface Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Step 1: Select Service (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-2 select-none">
              <span className="bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
              Selecione o Serviço
            </h4>
            <span className="text-xs text-neutral-500 font-medium">PASSOS COMBINADOS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.filter(s => s.active).map((srv) => (
              <button 
                key={srv.id}
                onClick={() => setSelectedService(srv)}
                className={`text-left p-5 rounded-2xl bg-neutral-900 border transition-all flex flex-col justify-between hover:border-primary cursor-pointer h-40 ${selectedService?.id === srv.id ? 'border-primary ring-2 ring-primary/20 bg-neutral-900' : 'border-neutral-800'}`}
              >
                <div>
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest block">{srv.category}</span>
                  <h5 className="text-sm font-bold text-white mt-1">{srv.name}</h5>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-snug line-clamp-2">{srv.description}</p>
                </div>

                <div className="flex items-center justify-between w-full pt-4 border-t border-neutral-800/10 mt-auto">
                  <span className="text-xs font-semibold text-neutral-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {srv.duration} min
                  </span>
                  <span className="text-xs font-extrabold text-primary">
                    R$ {srv.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 & 3: Calendar & Slots picker (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Step 2: Datepicker list */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-2 select-none">
              <span className="bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
              Escolha a Data Disponível
            </h4>

            {/* Micro horizontal horizontal scrolling day card pickers */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {calendarDays.map((day) => {
                const isSelected = selectedDate === day.date;
                return (
                  <button
                    key={day.date}
                    disabled={day.isBlocked}
                    onClick={() => {
                      setSelectedDate(day.date);
                      setSelectedTime('');
                    }}
                    className={`flex flex-col items-center justify-center px-4 py-2.5 rounded-xl border shrink-0 w-14 transition-all ${day.isBlocked ? 'opacity-30 cursor-not-allowed border-transparent bg-transparent' : isSelected ? 'border-primary bg-primary text-white shadow-lg' : 'border-neutral-850 hover:border-neutral-600 bg-neutral-950 text-neutral-350'}`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider">
                      {WEEKDAYS[day.dayOfWeek].slice(0, 3)}
                    </span>
                    <span className="text-sm font-extrabold mt-1">
                      {day.dayLabel}
                    </span>
                  </button>
                );
              })}
            </div>
            
            <p className="text-[10px] text-neutral-500 font-semibold font-mono text-center">
              Período de agendamento selecionado: Junho 2026
            </p>
          </div>

          {/* Step 3: Slots picker list */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-2 select-none">
              <span className="bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span>
              Escolha o Horário
            </h4>

            {availableSlots.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-6 italic bg-neutral-950 rounded-xl border border-neutral-850 leading-relaxed">
                Nenhum horário de agendamento disponível para este dia. Selecione outra data.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map((slot) => {
                  const isSelected = selectedTime === slot.time;
                  
                  return (
                    <button
                      key={slot.time}
                      disabled={slot.isTaken}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`py-2 text-xs font-mono font-bold rounded-lg border transition-all ${slot.isTaken ? 'opacity-30 bg-neutral-950 border-transparent text-neutral-600 cursor-not-allowed line-through' : isSelected ? 'bg-primary text-white border-primary shadow-md' : 'bg-neutral-950 hover:bg-neutral-900 text-neutral-300 border-neutral-850 hover:border-neutral-700'}`}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Bottom Floating Action Bar */}
      {selectedService && selectedDate && selectedTime && (
        <div className="fixed bottom-6 left-6 right-6 lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-3xl bg-neutral-900/90 backdrop-blur border border-primary/30 p-4 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 z-40 animate-bounce-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 text-primary border border-primary/20 rounded-xl flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {selectedDate.split('-').reverse().join('/')} às {selectedTime}
              </p>
              <p className="text-[10px] text-neutral-400 font-semibold">{selectedService.name} • R$ {selectedService.price}</p>
            </div>
          </div>

          <button
            onClick={handleBookingConfirmClick}
            className="w-full md:w-auto bg-primary hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl text-xs font-semibold active:scale-95 transition-all outline-none"
          >
            Confirmar Reserva
          </button>
        </div>
      )}

      {/* Registration details slide modal */}
      {isSubmitModalOpen && selectedService && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-fade-in text-left">
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
              <div>
                <h4 className="text-sm font-extrabold text-white">
                  {sessionClient ? 'Confirmar Agendamento' : 'Identificação Necessária'}
                </h4>
                <p className="text-[10px] text-neutral-500">
                  {sessionClient 
                    ? 'Revise os dados antes de solicitar a reserva.' 
                    : 'Para agendar, faça login ou cadastre-se com e-mail obrigatório.'
                  }
                </p>
              </div>
              <button 
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1.5 hover:bg-neutral-800 text-neutral-400 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFinalSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {errorMessage && (
                <p className="p-3 bg-red-950 border border-red-900 text-xs text-red-400 rounded-xl font-medium">
                  {errorMessage}
                </p>
              )}

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850 space-y-1 text-xs">
                <div><span className="text-neutral-500 font-mono">Serviço:</span> <span className="text-white font-semibold">{selectedService.name}</span></div>
                <div><span className="text-neutral-500 font-mono">Horário:</span> <span className="text-white font-semibold">{selectedDate.split('-').reverse().join('/')} às {selectedTime}</span></div>
                <div><span className="text-neutral-500 font-mono">Valor Total:</span> <span className="text-primary font-bold">R$ {selectedService.price}</span></div>
              </div>

              {sessionClient ? (
                // LOGGED IN CLIENT VIEW
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-xl space-y-2">
                    <p className="text-[10px] uppercase font-bold text-primary tracking-wider">Cliente Identificado</p>
                    <div className="text-xs space-y-1">
                      <p className="text-white font-bold">{sessionClient.name}</p>
                      <p className="text-neutral-400 font-medium">Telefone: {sessionClient.phone}</p>
                      <p className="text-neutral-400 font-medium">E-mail: {sessionClient.email}</p>
                      {(sessionClient.city || sessionClient.state) && (
                        <p className="text-neutral-400 font-medium">Cidade/Estado: {sessionClient.city} / {sessionClient.state}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSessionClient(null)}
                      className="text-[10px] text-red-400 hover:text-red-350 font-bold hover:underline mt-2 block"
                    >
                      Alterar Conta / Sair &rarr;
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 block font-medium">Observações Especiais (Opcional)</label>
                    <textarea 
                      rows={2}
                      placeholder="Algum detalhe ou pedido especial para o profissional?"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg outline-none focus:border-primary resize-none placeholder-neutral-700"
                      value={notes} onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                // NO SESSION - FORCE LOGIN / REGISTER SWITCHER
                <div className="space-y-4">
                  <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-850">
                    <button
                      type="button"
                      onClick={() => { setAuthTab('login'); setErrorMessage(''); }}
                      className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all ${authTab === 'login' ? 'bg-primary text-white shadow-md' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      Acessar Conta
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthTab('register'); setErrorMessage(''); }}
                      className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all ${authTab === 'register' ? 'bg-primary text-white shadow-md' : 'text-neutral-400 hover:text-neutral-200'}`}
                    >
                      Criar Cadastro
                    </button>
                  </div>

                  {authTab === 'login' ? (
                    <div className="space-y-3">
                      <div className="text-xs text-neutral-400 mb-2 leading-relaxed">
                        Insira o número de telefone de cadastro para carregar sua conta de cliente de forma rápida.
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-neutral-400 block font-medium">Seu Telefone de Cadastro</label>
                        <input 
                          type="text" required
                          placeholder="Ex: (11) 99999-9999"
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg outline-none focus:border-primary placeholder-neutral-700"
                          value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-xs text-indigo-300 font-medium mb-1 leading-relaxed bg-indigo-950/30 border border-indigo-900/30 p-2.5 rounded-xl">
                        O e-mail é obrigatório para que você possa receber novidades, lembretes de agendamento e promoções exclusivas.
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-neutral-400 block font-medium">Nome Completo *</label>
                        <input 
                          type="text" required
                          placeholder="Ex: João da Silva"
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg outline-none focus:border-primary placeholder-neutral-700"
                          value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-neutral-400 block font-medium">Telefone de Contato *</label>
                        <input 
                          type="text" required
                          placeholder="Ex: (11) 99999-9999"
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg outline-none focus:border-primary placeholder-neutral-700"
                          value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-neutral-400 block font-medium">E-mail * (Obrigatório para Promoções)</label>
                        <input 
                          type="email" required
                          placeholder="nome@provedor.com"
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg outline-none focus:border-primary placeholder-neutral-700"
                          value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pb-1">
                        <div className="space-y-1">
                          <label className="text-xs text-neutral-400 block font-medium">Estado (UF) *</label>
                          <input 
                            type="text" required
                            placeholder="Ex: SP"
                            maxLength={2}
                            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg outline-none focus:border-primary placeholder-neutral-700 uppercase"
                            value={customerState} onChange={(e) => setCustomerState(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-neutral-400 block font-medium">Cidade *</label>
                          <input 
                            type="text" required
                            placeholder="Ex: São Paulo"
                            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg outline-none focus:border-primary placeholder-neutral-700 cursor-text"
                            value={customerCity} onChange={(e) => setCustomerCity(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1 font-sans">
                        <label className="text-xs text-neutral-400 block font-medium">Observações Especiais (Opcional)</label>
                        <textarea 
                          rows={1}
                          placeholder="Alguma restrição ou dúvida de atendimento?"
                          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 text-xs text-white rounded-lg outline-none focus:border-primary resize-none placeholder-neutral-700"
                          value={notes} onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 flex gap-3 border-t border-neutral-850">
                <button 
                  type="button"
                  disabled={isAuthenticating}
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="flex-1 py-2 border border-neutral-800 text-xs font-semibold rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isAuthenticating}
                  className="flex-1 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-xs font-semibold active:scale-95 transition-all outline-none disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isAuthenticating ? (
                    <span>Processando...</span>
                  ) : sessionClient ? (
                    <span>Confirmar Agendamento</span>
                  ) : authTab === 'login' ? (
                    <span>Entrar e Agendar</span>
                  ) : (
                    <span>Cadastrar e Agendar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
