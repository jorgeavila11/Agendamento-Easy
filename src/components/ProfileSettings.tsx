import React, { useState } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { User, Phone, MapPin, Globe, Save, MessageSquare, Image as ImageIcon, Sparkles, RefreshCw, Check } from 'lucide-react';

const DEFAULT_BANNER_PRESET = "https://lh3.googleusercontent.com/aida-public/AB6AXuDaKtwsm7_GInilEPbn0Q8kO8vGPTPmD_l53662ZzXTdMA_Tn8p9JlG-vMu62oyZ4C1f4Uojl-UAh3AebF7e41h9LlrnSGn0P5du0NxtBr5Cyiy2hbNoBdZGFxS7IDQuODZElyYBADDo2WV_XJZ2UXqH5z1cYxKArF2ki2mZJFeo1HQvngVwsbakFGJI0eWZ4rCW53WgPBdhfyzJiTP3DDNQRCmScMbSrCzanfewfbjdspg3K-ep3pf-mvTgtL1MuK5pnpppBX4Ww";

const BANNER_PRESETS = [
  {
    id: 'essence_default',
    title: 'Studio Essence (Padrão)',
    category: 'Estética / Spa',
    url: DEFAULT_BANNER_PRESET,
  },
  {
    id: 'beauty_salon',
    title: 'Salão de Beleza & Cabelo',
    category: 'Cabelo & Cor',
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'barbershop',
    title: 'Barbearia Vintage & Modern',
    category: 'Barbearia',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'spa_wellness',
    title: 'Spa & Massagem Relaxante',
    category: 'Bem-Estar',
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'medical_clinic',
    title: 'Consultório & Estética Avançada',
    category: 'Saúde',
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'tattoo_studio',
    title: 'Estúdio de Tattoo & Piercing',
    category: 'Arte & Corpo',
    url: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'luxury_minimal',
    title: 'Minimalista & Luxo Dourado',
    category: 'Premium',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'modern_tech',
    title: 'Moderno & Escritório Corporativo',
    category: 'Negócios',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
  }
];

export default function ProfileSettings() {
  const { profile, updateProfile } = useFirebase();

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [description, setDescription] = useState(profile.description);
  const [address, setAddress] = useState(profile.address || '');
  const [publicSlug, setPublicSlug] = useState(profile.publicSlug);
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl || '');
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl || DEFAULT_BANNER_PRESET);
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState(profile.whatsappPhoneNumberId || '');
  const [whatsappToken, setWhatsappToken] = useState(profile.whatsappToken || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      phone,
      description,
      address,
      publicSlug: publicSlug.toLowerCase().replace(/[^a-z0-9\-]/g, ''),
      photoUrl,
      bannerUrl,
      whatsappPhoneNumberId,
      whatsappToken
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Banner Customizado do Link / Cabeçalho do Negócio */}
        <div className="space-y-4 pb-6 border-b border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                Banner Customizado do Link Público
              </h4>
              <p className="text-xs text-neutral-400 mt-1">
                Personalize a imagem de topo do seu link para deixar a página com a cara e o ambiente do seu negócio.
              </p>
            </div>
            {bannerUrl !== DEFAULT_BANNER_PRESET && (
              <button
                type="button"
                onClick={() => setBannerUrl(DEFAULT_BANNER_PRESET)}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-lg border border-neutral-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restaurar Padrão
              </button>
            )}
          </div>

          {/* Live Preview Card */}
          <div className="relative h-44 sm:h-52 rounded-2xl overflow-hidden border border-neutral-700 shadow-xl bg-neutral-950 group">
            <img 
              src={bannerUrl || DEFAULT_BANNER_PRESET} 
              alt="Pré-visualização do Banner" 
              className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
              onError={() => setBannerUrl(DEFAULT_BANNER_PRESET)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
            
            {/* Live Overlay Badge */}
            <div className="absolute top-3 right-3 bg-neutral-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-neutral-700 text-[11px] font-semibold text-primary flex items-center gap-1.5 shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Pré-visualização ao vivo
            </div>

            {/* Profile Avatar & Name overlay preview */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary bg-neutral-800 shrink-0 shadow-lg">
                {photoUrl ? (
                  <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <User className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h5 className="text-white font-bold text-sm sm:text-base truncate drop-shadow-md">
                  {name || 'Seu Negócio'}
                </h5>
                <p className="text-xs text-neutral-300/90 font-mono truncate">
                  agenda.facil/{publicSlug || 'seu-link'}
                </p>
              </div>
            </div>
          </div>

          {/* Banner URL Input */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-neutral-300 block">URL Customizada da Imagem do Banner</label>
            <input 
              type="url" 
              className="w-full px-4 py-2.5 border border-neutral-800 rounded-xl bg-neutral-950 focus:border-primary focus:ring-1 focus:ring-primary text-white outline-none text-sm font-mono"
              placeholder="https://exemplo.com/seu-banner.jpg"
              value={bannerUrl} 
              onChange={(e) => setBannerUrl(e.target.value)} 
            />
            <p className="text-[11px] text-neutral-500">
              Cole o link de uma imagem de alta resolução (ex: Unsplash, Imgur ou seu próprio site).
            </p>
          </div>

          {/* Banner Presets Gallery */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-neutral-300 block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Ou escolha uma capa na Galeria de Temas
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {BANNER_PRESETS.map((preset) => {
                const isSelected = bannerUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setBannerUrl(preset.url)}
                    className={`relative rounded-xl overflow-hidden border-2 text-left h-20 transition-all group ${
                      isSelected 
                        ? 'border-primary ring-2 ring-primary/40 scale-[1.02]' 
                        : 'border-neutral-800 hover:border-neutral-600 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={preset.url} 
                      alt={preset.title} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/40 to-transparent" />
                    
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 bg-primary text-white rounded-full p-0.5 shadow-md">
                        <Check className="w-3 h-3" />
                      </div>
                    )}

                    <div className="absolute bottom-1.5 left-2 right-2">
                      <p className="text-[10px] font-bold text-white truncate leading-tight">
                        {preset.title}
                      </p>
                      <span className="text-[8px] text-neutral-300/80 block truncate">
                        {preset.category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Avatar Profile Section */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-neutral-800">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary bg-neutral-800 flex items-center justify-center shrink-0 shadow-md">
            {photoUrl ? (
              <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-neutral-600" />
            )}
          </div>
          <div className="flex-1 w-full space-y-2">
            <label className="text-sm font-medium text-neutral-300 block">Foto de Perfil / Logotipo</label>
            <input 
              type="url" 
              className="w-full px-4 py-2 border border-neutral-800 rounded-xl bg-neutral-950 focus:border-primary focus:ring-1 focus:ring-primary text-white outline-none text-sm"
              placeholder="https://exemplo.com/sua-foto.jpg"
              value={photoUrl} 
              onChange={(e) => setPhotoUrl(e.target.value)} 
            />
            <p className="text-xs text-neutral-500">Cole uma URL de imagem para o seu logotipo ou foto de perfil.</p>
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

        {/* WhatsApp Business API Configuration */}
        <div className="pt-6 border-t border-neutral-800 space-y-4">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
              Notificações de WhatsApp (Meta Business API)
            </h4>
            <p className="text-xs text-neutral-400 mt-1">
              Configure as credenciais oficiais da sua conta no Facebook Developer para enviar mensagens reais quando os agendamentos forem confirmados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 block">ID do Número de Telefone (Phone Number ID)</label>
              <input 
                type="text" 
                className="w-full px-4 py-2.5 border border-neutral-800 rounded-xl bg-neutral-950 focus:border-primary focus:ring-1 focus:ring-primary text-white outline-none text-sm font-mono"
                placeholder="Ex: 911523022053417"
                value={whatsappPhoneNumberId} 
                onChange={(e) => setWhatsappPhoneNumberId(e.target.value.trim())} 
              />
              <p className="text-[10px] text-neutral-500">Deixe em branco ou use "911523022053417" para o número de teste oficial.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 block">Token de Acesso Permanente (Access Token)</label>
              <input 
                type="password" 
                className="w-full px-4 py-2.5 border border-neutral-800 rounded-xl bg-neutral-950 focus:border-primary focus:ring-1 focus:ring-primary text-white outline-none text-sm font-mono"
                placeholder="EAAG..."
                value={whatsappToken} 
                onChange={(e) => setWhatsappToken(e.target.value.trim())} 
              />
              <p className="text-[10px] text-neutral-500">Insira seu Token de Acesso Permanente gerado no portal Meta Business Suite.</p>
            </div>
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
