import React, { useState } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { User, Phone, MapPin, Globe, Save } from 'lucide-react';

export default function ProfileSettings() {
  const { profile, updateProfile } = useFirebase();

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [description, setDescription] = useState(profile.description);
  const [address, setAddress] = useState(profile.address || '');
  const [publicSlug, setPublicSlug] = useState(profile.publicSlug);
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      phone,
      description,
      address,
      publicSlug: publicSlug.toLowerCase().replace(/[^a-z0-9\-]/g, ''),
      photoUrl
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div id="settings-profile" className="max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 shadow-xl">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Perfil do Workspace</h3>
        <p className="text-sm text-neutral-400">Configure as informações que seu cliente irá visualizar ao acessar seu link público de agendamentos.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Profile Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-neutral-800">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary bg-neutral-800 flex items-center justify-center">
            {photoUrl ? (
              <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-neutral-600" />
            )}
          </div>
          <div className="flex-1 w-full space-y-2">
            <label className="text-sm font-medium text-neutral-300 block">Link da Foto de Perfil</label>
            <input 
              type="url" 
              className="w-full px-4 py-2 border border-neutral-800 rounded-xl bg-neutral-950 focus:border-primary focus:ring-1 focus:ring-primary text-white outline-none text-sm"
              placeholder="https://exemplo.com/sua-foto.jpg"
              value={photoUrl} 
              onChange={(e) => setPhotoUrl(e.target.value)} 
            />
            <p className="text-xs text-neutral-500">Cole uma URL de imagem válida para o logotipo ou foto profissional.</p>
          </div>
        </div>

        {/* Name and Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300 block">Nome do Workspace / Profissional</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                <User className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                required
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-800 rounded-xl bg-neutral-950 focus:border-primary focus:ring-1 focus:ring-primary text-white outline-none text-sm"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300 block">Telefone de Contato</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                <Phone className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                required
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-800 rounded-xl bg-neutral-950 focus:border-primary focus:ring-1 focus:ring-primary text-white outline-none text-sm"
                placeholder="(11) 99999-9999"
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}  
              />
            </div>
          </div>
        </div>

        {/* Customizable slug */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-300 block">Link Público Personalizado</label>
          <div className="flex rounded-xl overflow-hidden border border-neutral-800 shadow-sm">
            <span className="bg-neutral-950 px-4 py-2.5 text-xs text-neutral-500 flex items-center select-none border-r border-neutral-800">
              <Globe className="w-4 h-4 mr-2" />
              agenda.facil/
            </span>
            <input 
              type="text" 
              required
              className="flex-1 px-4 py-2.5 bg-neutral-950 focus:border-primary focus:ring-0 text-white outline-none text-sm font-mono placeholder-neutral-700"
              placeholder="meu-negocio"
              value={publicSlug} 
              onChange={(e) => setPublicSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9\-]/g, ''))} 
            />
          </div>
          <p className="text-xs text-neutral-500">Apenas letras minúsculas, números e traços (-) são aceitos.</p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-300 block">Descrição dos Serviços / Biografia</label>
          <textarea 
            rows={4}
            className="w-full px-4 py-2.5 border border-neutral-800 rounded-xl bg-neutral-950 focus:border-primary focus:ring-1 focus:ring-primary text-white outline-none text-sm resize-none"
            placeholder="Apresente brevemente seu workspace..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Optional Physical address */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-300 block">Endereço Comercial (Opcional)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <MapPin className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-2.5 border border-neutral-800 rounded-xl bg-neutral-950 focus:border-primary focus:ring-1 focus:ring-primary text-white outline-none text-sm"
              placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
            />
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between pt-6 border-t border-neutral-800">
          <div className="text-sm text-neutral-500">
            Email: <span className="text-white font-mono">{profile.email}</span>
          </div>
          <div className="flex items-center gap-4">
            {isSaved && (
              <span className="text-xs font-semibold text-emerald-400 animate-fade-in">
                Salvo com sucesso!
              </span>
            )}
            <button 
              type="submit"
              className="bg-primary hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 active:scale-95 transition-all outline-none"
            >
              <Save className="w-4 h-4" />
              Gravar Alterações
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
