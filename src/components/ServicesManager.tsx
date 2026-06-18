import React, { useState } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { Service } from '../types';
import { Plus, Edit, Trash2, X, Sparkles, Tag, DollarSign, Clock, HelpCircle } from 'lucide-react';

export default function ServicesManager() {
  const { services, addService, updateService, deleteService } = useFirebase();

  // Selected for edit/creation
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(100);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Consultoria');
  const [active, setActive] = useState(true);

  const openAddDrawer = () => {
    setEditingService(null);
    setName('');
    setDuration(30);
    setPrice(100);
    setDescription('');
    setCategory('Estética');
    setActive(true);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (srv: Service) => {
    setEditingService(srv);
    setName(srv.name);
    setDuration(srv.duration);
    setPrice(srv.price);
    setDescription(srv.description);
    setCategory(srv.category);
    setActive(srv.active);
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const servicePayload = {
      name,
      duration,
      price,
      description,
      category,
      active
    };

    if (editingService) {
      updateService(editingService.id, servicePayload);
    } else {
      addService(servicePayload);
    }
    setIsDrawerOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza de que deseja remover este serviço permanentemente?')) {
      deleteService(id);
    }
  };  return (
    <div className="space-y-6 animate-fade-in">
      {/* Services List Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-4 border border-slate-800 rounded-2xl">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Configuração de Serviços</h3>
          <p className="text-xs text-slate-400">Cadastre e atualize seu catálogo de serviços, precificações, durações e disponibilidades publicadas.</p>
        </div>
        <button 
          onClick={openAddDrawer}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all outline-none cursor-pointer shadow-sm select-none"
        >
          <Plus className="w-4 h-4" />
          Novo Serviço
        </button>
      </div>

      {/* Grid displays */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Statistics Inventory Widget */}
        <div className="md:col-span-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Catálogo Ativo</span>
            <h4 className="text-4xl font-extrabold text-indigo-400 mt-2 font-display">{services.length}</h4>
            <p className="text-xs text-slate-400 mt-2">Diferentes ofertas catalogadas e habilitadas para livre escolha dos clientes no link público.</p>
          </div>
          
          <div className="mt-6 p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-white">Optimize Pricing</span>
            </div>
            <p className="text-[11px] text-slate-400">Ofereça valores diferenciados ou cupons de desconto para alavancar horários.</p>
          </div>
        </div>

        {/* Dynamic Service Listing Table */}
        <div className="md:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Nome do Serviço</th>
                  <th className="px-6 py-4">Duração</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {services.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-slate-500 italic text-center bg-slate-900">
                      Nenhum serviço cadastrado ainda. Clique em "Novo Serviço" para começar!
                    </td>
                  </tr>
                ) : (
                  services.map((srv) => (
                    <tr key={srv.id} className="hover:bg-slate-950/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-white">{srv.name}</p>
                          <p className="text-xs text-slate-500 truncate max-w-xs">{srv.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-medium">
                        {srv.duration} min
                      </td>
                      <td className="px-6 py-4 text-indigo-400 font-bold">
                        R$ {srv.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        {srv.active ? (
                          <span className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Ativo</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-slate-950 text-slate-500 border border-slate-800 text-[10px] font-bold uppercase tracking-wider">Inativo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openEditDrawer(srv)}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(srv.id)}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Centered Modal Dialog wrapper (Displays ONLY when isDrawerOpen is true) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-fade-in">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div>
                <h4 className="text-base font-bold text-white font-display">
                  {editingService ? 'Editar Serviço' : 'Cadastrar Serviço'}
                </h4>
                <p className="text-xs text-slate-500">Configure as opções de atendimento oferecido.</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields Scrollable Area */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 text-slate-200 overflow-y-auto max-h-[70vh]">
              {/* Service Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 block">Nome do Serviço</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Fisioterapia Esportiva"
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 text-white text-sm outline-none transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 block">Categoria do Serviço</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Cabelo, Fisioterapia, Estética, Consultoria..."
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 text-white text-sm outline-none transition-all"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              {/* Value and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">Valor Cobrado (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-semibold">R$</span>
                    <input 
                      type="number" 
                      required
                      min={0}
                      className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 text-white text-sm outline-none transition-all"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">Duração (Minutos)</label>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-semibold font-mono">min</span>
                    <input 
                      type="number" 
                      required
                      min={5}
                      max={480}
                      className="w-full pl-4 pr-10 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 text-white text-sm outline-none transition-all"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 block">Descrição para Cliente</label>
                <textarea 
                  rows={3}
                  maxLength={1000}
                  placeholder="Descreva detalhes do serviço, diferenciais e recomendações para o cliente..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 text-white text-sm outline-none resize-none transition-all"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Active switch */}
              <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-850 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-white">Publicar no catálogo</p>
                  <p className="text-[10px] text-slate-500">Habilitado para agendamento online imediato.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${active ? 'bg-indigo-600' : 'bg-slate-800'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </form>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-slate-800 bg-slate-950 flex gap-3">
              <button 
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 py-2.5 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleSubmit}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-all outline-none cursor-pointer"
              >
                {editingService ? 'Salvar Alterações' : 'Cadastrar Serviço'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
