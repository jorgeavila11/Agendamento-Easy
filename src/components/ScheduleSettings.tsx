import React, { useState } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { Clock, CalendarOff, Plus, Trash2, Calendar, CheckSquare, Square, Save } from 'lucide-react';
import { WorkingSettings, WorkingDay, BlockedDate } from '../types';

const WEEKDAYS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

export default function ScheduleSettings() {
  const { profile, updateWorkingSettings } = useFirebase();

  const [intervalMinutes, setIntervalMinutes] = useState(profile.workingSettings.intervalMinutes);
  const [workingDays, setWorkingDays] = useState<WorkingDay[]>(profile.workingSettings.workingDays);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(profile.workingSettings.blockedDates);

  // Form for new blocked date
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleDayToggle = (dayOfWeek: number) => {
    setWorkingDays(prev => prev.map(d => 
      d.dayOfWeek === dayOfWeek ? { ...d, enabled: !d.enabled } : d
    ));
  };

  const handleTimeChange = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setWorkingDays(prev => prev.map(d => 
      d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d
    ));
  };

  const handleAddBlockedDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;

    const block: BlockedDate = {
      id: `bl_${Date.now()}`,
      date: newDate,
      reason: newReason || 'Bloqueio de Agenda'
    };

    setBlockedDates(prev => [...prev, block]);
    setNewDate('');
    setNewReason('');
  };

  const handleRemoveBlockedDate = (id: string) => {
    setBlockedDates(prev => prev.filter(b => b.id !== id));
  };

  const handleSave = () => {
    updateWorkingSettings({
      intervalMinutes,
      workingDays,
      blockedDates
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Configuration Form */}
      <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-8 h-fit">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Configurações da Agenda</h3>
          <p className="text-sm text-neutral-400">Gerencie seus dias úteis de trabalho, janelas de atendimento, intervalos e horários padrão.</p>
        </div>

        {/* Interval Selector */}
        <div className="space-y-3 pb-6 border-b border-neutral-800">
          <label className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Intervalo entre Atendimentos
          </label>
          <select 
            className="w-full md:w-64 px-4 py-2.5 border border-neutral-800 rounded-xl bg-neutral-950 focus:border-primary focus:ring-1 focus:ring-primary text-white outline-none text-sm cursor-pointer"
            value={intervalMinutes}
            onChange={(e) => setIntervalMinutes(Number(e.target.value))}
          >
            <option value={15}>15 minutos</option>
            <option value={30}>30 minutos</option>
            <option value={45}>45 minutos</option>
            <option value={60}>60 minutos (1 hora)</option>
          </select>
          <p className="text-xs text-neutral-500">Define o deslocamento mínimo para a criação de slots de agendamento disponíveis.</p>
        </div>

        {/* Working Days */}
        <div className="space-y-4 pb-6 border-b border-neutral-800">
          <label className="text-sm font-semibold text-neutral-300 block">Dias e Horas de Trabalho</label>
          <div className="space-y-3">
            {WEEKDAYS.map((dayName, idx) => {
              const daySetting = workingDays.find(d => d.dayOfWeek === idx) || {
                dayOfWeek: idx,
                enabled: false,
                startTime: '09:00',
                endTime: '18:00'
              };

              return (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800/50 gap-4">
                  <button 
                    type="button"
                    onClick={() => handleDayToggle(idx)}
                    className="flex items-center gap-3 text-left focus:outline-none"
                  >
                    {daySetting.enabled ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5 text-neutral-600" />
                    )}
                    <span className={`text-sm font-medium ${daySetting.enabled ? 'text-white font-semibold' : 'text-neutral-500'}`}>
                      {dayName}
                    </span>
                  </button>

                  {daySetting.enabled && (
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <input 
                        type="time" 
                        className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white outline-none focus:border-primary"
                        value={daySetting.startTime}
                        onChange={(e) => handleTimeChange(idx, 'startTime', e.target.value)}
                      />
                      <span className="text-neutral-500 text-xs">às</span>
                      <input 
                        type="time" 
                        className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white outline-none focus:border-primary"
                        value={daySetting.endTime}
                        onChange={(e) => handleTimeChange(idx, 'endTime', e.target.value)}
                      />
                    </div>
                  )}
                  {!daySetting.enabled && (
                    <span className="text-xs text-neutral-600 italic self-end sm:self-center">Fechado / Recesso</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Save Trigger */}
        <div className="flex items-center justify-end gap-4 pt-4">
          {isSaved && (
            <span className="text-xs font-semibold text-emerald-400">
              Configurações salvas!
            </span>
          )}
          <button 
            type="button"
            onClick={handleSave}
            className="bg-primary hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 active:scale-95 transition-all outline-none"
          >
            <Save className="w-4 h-4" />
            Salvar Agenda
          </button>
        </div>
      </div>

      {/* Blocked Dates (Right component sidebar) */}
      <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col h-fit gap-6">
        <div>
          <h4 className="text-md font-bold text-white mb-1 flex items-center gap-2">
            <CalendarOff className="w-5 h-5 text-red-500" />
            Bloqueio de Datas Específicas
          </h4>
          <p className="text-xs text-neutral-400">Evite que clientes façam agendamentos em dias específicos (férias, cursos, feriados).</p>
        </div>

        {/* Add date form */}
        <form onSubmit={handleAddBlockedDate} className="space-y-4 p-4 rounded-xl bg-neutral-950 border border-neutral-800">
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-400 block">Data do Bloqueio</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                <Calendar className="w-4 h-4" />
              </span>
              <input 
                type="date" 
                required
                className="w-full pl-10 pr-4 py-2 border border-neutral-800 rounded-lg bg-neutral-900 focus:border-primary text-white text-xs outline-none"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-400 block">Motivo / Título</label>
            <input 
              type="text" 
              placeholder="Ex: Treinamento, Recesso natalino..."
              className="w-full px-3 py-2 border border-neutral-800 rounded-lg bg-neutral-900 focus:border-primary text-white text-xs outline-none"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors outline-none"
          >
            <Plus className="w-4 h-4" />
            Bloquear Data
          </button>
        </form>

        {/* Blocks listings */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest block">Datas Bloqueadas Atual</span>
          
          {blockedDates.length === 0 ? (
            <p className="text-xs text-neutral-500 italic text-center py-4 bg-neutral-950 border border-neutral-850 rounded-xl">
              Nenhuma data bloqueada cadastrada.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {blockedDates.map((block) => (
                <div key={block.id} className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                  <div>
                    <p className="text-xs text-white font-semibold font-mono">
                      {(block.date || "").split('-').reverse().join('/') || 'Sem data'}
                    </p>
                    <p className="text-[10px] text-neutral-500">{block.reason}</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleRemoveBlockedDate(block.id)}
                    className="p-1.5 hover:bg-neutral-900 text-neutral-500 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
