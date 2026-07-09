/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import Dashboard from './components/Dashboard';
import ServicesManager from './components/ServicesManager';
import ScheduleSettings from './components/ScheduleSettings';
import ProfileSettings from './components/ProfileSettings';
import PublicBooking from './components/PublicBooking';
import LoginView from './components/LoginView';
import AuditLogsView from './components/AuditLogsView';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { 
  CalendarDays, 
  Settings, 
  Flame, 
  Sparkles, 
  User, 
  HelpCircle, 
  Eye, 
  LayoutDashboard, 
  Scissors, 
  Compass, 
  Lock,
  Globe,
  Bell,
  RefreshCw,
  Info,
  LogOut,
  KeyRound,
  Shield,
  Sun,
  Moon,
  Monitor,
  ChevronDown
} from 'lucide-react';

function AppContent() {
  const { user, isDemoLoggedIn, profile, notifications, signInWithGoogle, signOutUser, isFirebaseConnected, sessionClient, setSessionClient } = useFirebase();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'schedule' | 'profile' | 'audit_logs'>('dashboard');
  const [viewMode, setViewMode] = useState<'admin' | 'public'>('admin');
  const [themeOpen, setThemeOpen] = useState(false);

  const isProfessionalLoggedIn = user !== null || isDemoLoggedIn;
  const isUserLoggedIn = isProfessionalLoggedIn || !!sessionClient;
  const unreadCount = notifications.filter(n => !n.read).length;

  React.useEffect(() => {
    const root = window.document.documentElement;
    const shouldApplyTheme = isProfessionalLoggedIn && viewMode === 'admin';

    if (!shouldApplyTheme) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      if (resolvedTheme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    }
  }, [isProfessionalLoggedIn, viewMode, resolvedTheme]);

  return (
    <div id="agenda-facil-root" className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col selection:bg-primary selection:text-white">
      {/* Top Professional Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-0 min-h-18 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          {/* Logo and Mobile controls Row */}
          <div className="flex items-center justify-between w-full md:w-auto md:flex-1">
            {/* Logo Brand Brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md shrink-0">
                AF
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white tracking-tight text-md">Agenda Fácil</span>
                  <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full">v2.4.0</span>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Sistema de Agendamentos</p>
              </div>
            </div>

            {/* Mobile Theme Selector to conserve header space */}
            <div className="flex md:hidden items-center gap-2">
              {isProfessionalLoggedIn && viewMode === 'admin' && (
                <div className="relative">
                  <button
                    onClick={() => setThemeOpen(!themeOpen)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all select-none outline-none focus:ring-1 focus:ring-indigo-500/50"
                  >
                    {theme === 'light' && <Sun className="w-3.5 h-3.5 text-indigo-400" />}
                    {theme === 'dark' && <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                    {theme === 'system' && <Monitor className="w-3.5 h-3.5 text-indigo-400" />}
                    {theme !== 'light' && theme !== 'dark' && theme !== 'system' && <Monitor className="w-3.5 h-3.5 text-indigo-400" />}
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </button>
                  
                  {themeOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setThemeOpen(false)} />
                      <div className="absolute right-0 mt-1.5 w-36 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1 z-50 flex flex-col gap-0.5 animate-fade-in text-slate-300">
                        <button
                          onClick={() => {
                            setTheme('light');
                            setThemeOpen(false);
                          }}
                          className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-medium cursor-pointer transition-colors outline-none ${theme === 'light' ? 'bg-indigo-600/15 text-indigo-400 font-bold' : 'hover:text-white hover:bg-slate-900'}`}
                        >
                          <Sun className="w-3.5 h-3.5" />
                          <span>Claro</span>
                        </button>
                        <button
                          onClick={() => {
                            setTheme('dark');
                            setThemeOpen(false);
                          }}
                          className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-medium cursor-pointer transition-colors outline-none ${theme === 'dark' ? 'bg-indigo-600/15 text-indigo-400 font-bold' : 'hover:text-white hover:bg-slate-900'}`}
                        >
                          <Moon className="w-3.5 h-3.5" />
                          <span>Escuro</span>
                        </button>
                        <button
                          onClick={() => {
                            setTheme('system');
                            setThemeOpen(false);
                          }}
                          className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-medium cursor-pointer transition-colors outline-none ${theme === 'system' ? 'bg-indigo-600/15 text-indigo-400 font-bold' : 'hover:text-white hover:bg-slate-900'}`}
                        >
                          <Monitor className="w-3.5 h-3.5" />
                          <span>Sistema</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Center Mode Switcher (Interactive Sandbox Experience) */}
          {isProfessionalLoggedIn && (
            <div className="shrink-0 p-1 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-1 w-full md:w-auto justify-center">
              <button
                onClick={() => setViewMode('admin')}
                className={`flex-1 md:flex-initial px-3 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 outline-none cursor-pointer ${viewMode === 'admin' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Settings className="w-3.5 h-3.5 shrink-0" />
                Painel Profissional
              </button>
              <button
                onClick={() => setViewMode('public')}
                className={`flex-1 md:flex-initial px-3 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 outline-none cursor-pointer ${viewMode === 'public' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Eye className="w-3.5 h-3.5 shrink-0" />
                Ver Link Público
              </button>
            </div>
          )}

          {/* Right Status indicators - Desktop version */}
          <div className="hidden md:flex flex-1 justify-end items-center gap-4">
            {/* Elegant Dropdown Theme Switcher Widget */}
            {isProfessionalLoggedIn && viewMode === 'admin' && (
              <div className="relative">
                <button
                  onClick={() => setThemeOpen(!themeOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all select-none outline-none focus:ring-1 focus:ring-indigo-500/50"
                >
                  {theme === 'light' && <><Sun className="w-3.5 h-3.5 text-indigo-400" /> <span className="hidden sm:inline">Modo Claro</span></>}
                  {theme === 'dark' && <><Moon className="w-3.5 h-3.5 text-indigo-400" /> <span className="hidden sm:inline">Modo Escuro</span></>}
                  {theme === 'system' && <><Monitor className="w-3.5 h-3.5 text-indigo-400" /> <span className="hidden sm:inline">Sistema</span></>}
                  {theme !== 'light' && theme !== 'dark' && theme !== 'system' && <><Monitor className="w-3.5 h-3.5 text-indigo-400" /> <span className="hidden sm:inline">Sistema</span></>}
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>
                
                {themeOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setThemeOpen(false)} />
                    <div className="absolute right-0 mt-1.5 w-36 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1 z-50 flex flex-col gap-0.5 animate-fade-in text-slate-300">
                      <button
                        onClick={() => {
                          setTheme('light');
                          setThemeOpen(false);
                        }}
                        className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-medium cursor-pointer transition-colors outline-none ${theme === 'light' ? 'bg-indigo-600/15 text-indigo-400 font-bold' : 'hover:text-white hover:bg-slate-900'}`}
                      >
                        <Sun className="w-3.5 h-3.5" />
                        <span>Claro</span>
                      </button>
                      <button
                        onClick={() => {
                          setTheme('dark');
                          setThemeOpen(false);
                        }}
                        className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-medium cursor-pointer transition-colors outline-none ${theme === 'dark' ? 'bg-indigo-600/15 text-indigo-400 font-bold' : 'hover:text-white hover:bg-slate-900'}`}
                      >
                        <Moon className="w-3.5 h-3.5" />
                        <span>Escuro</span>
                      </button>
                      <button
                        onClick={() => {
                          setTheme('system');
                          setThemeOpen(false);
                        }}
                        className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-medium cursor-pointer transition-colors outline-none ${theme === 'system' ? 'bg-indigo-600/15 text-indigo-400 font-bold' : 'hover:text-white hover:bg-slate-900'}`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>Sistema</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Quick guide helper */}
            <div className="text-slate-500 hover:text-slate-300 transition-colors">
              <HelpCircle className="w-5 h-5 pointer-events-none" />
            </div>
          </div>
        </div>
      </header>

      {/* Main SaaS Viewport */}
      {sessionClient ? (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {/* Public client view banner notice */}
          <div className="bg-indigo-600/10 border border-indigo-600/20 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-8 animate-fade-in animate-bounce-subtle">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-slate-300">
                Olá, <strong className="text-white">{sessionClient.name}</strong>! Você está conectado ao seu portal. Faça seus agendamentos rápidos abaixo sem a necessidade de preencher seus dados cadastrais repetidamente.
              </span>
            </div>
            <div className="flex items-center gap-3">
              {(sessionClient.city || sessionClient.state) && (
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                  {sessionClient.city} / {sessionClient.state}
                </span>
              )}
              <button 
                onClick={() => setSessionClient(null)}
                className="text-red-400 hover:text-red-300 font-bold shrink-0 text-xs hover:underline cursor-pointer"
              >
                Sair da Conta &rarr;
              </button>
            </div>
          </div>

          <PublicBooking />
        </main>
      ) : viewMode === 'public' ? (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {/* Public client view banner notice */}
          <div className="bg-indigo-600/10 border border-indigo-600/20 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-8">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="text-slate-300">
                Você está visualizando a página de agendamentos pública do cliente. Teste fazendo reservas para ver os reflexos imediatos no painel profissional.
              </span>
            </div>
            <button 
              onClick={() => setViewMode('admin')}
              className="text-indigo-400 font-bold hover:underline shrink-0 text-left"
            >
              Voltar ao Painel &rarr;
            </button>
          </div>

          <PublicBooking />
        </main>
      ) : (
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {!isProfessionalLoggedIn ? (
            <main className="max-w-5xl mx-auto w-full">
              <LoginView />
            </main>
          ) : (
            <div className="flex flex-col md:flex-row gap-8">
              {/* Minimalist Sidebar Layout inside Workspace */}
              <aside className="md:w-64 space-y-4 shrink-0">
                {/* Quick professional widget branding card with Google authentication */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col gap-3 shadow-md">
                  <div className="flex items-center gap-3">
                    {user ? (
                      <img 
                        src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`} 
                        alt="Foto de perfil" 
                        className="w-10 h-10 rounded-xl object-cover border border-indigo-500/35"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400 font-bold select-none text-xs shrink-0">
                        {profile.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="overflow-hidden flex-1">
                      <h4 className="text-xs font-bold text-white truncate">{profile.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        {user ? user.email : 'Sessão Demonstrativa'}
                      </p>
                    </div>
                  </div>

                  {user ? (
                    <button
                      onClick={signOutUser}
                      className="w-full py-1.5 px-3 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 hover:border-red-500/30 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3 h-3 text-red-400" />
                      Sair do Painel
                    </button>
                  ) : (
                    <button
                      onClick={signOutUser}
                      className="w-full py-1.5 px-3 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 hover:border-red-500/30 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3 h-3 text-red-500 text-red-400 font-bold" />
                      Sair da Sessão Demo
                    </button>
                  )}
                </div>

                {/* Navigation buttons */}
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all outline-none cursor-pointer border ${activeTab === 'dashboard' ? 'bg-indigo-600/10 text-indigo-400 border-indigo-600/20' : 'text-slate-500 hover:text-slate-300 border-transparent hover:bg-slate-900'}`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    DASHBOARD
                  </button>

                  <button
                    onClick={() => setActiveTab('services')}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all outline-none cursor-pointer border ${activeTab === 'services' ? 'bg-indigo-600/10 text-indigo-400 border-indigo-600/20' : 'text-slate-500 hover:text-slate-300 border-transparent hover:bg-slate-900'}`}
                  >
                    <Scissors className="w-4 h-4" />
                    SERVIÇOS
                  </button>

                  <button
                    onClick={() => setActiveTab('schedule')}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all outline-none cursor-pointer border ${activeTab === 'schedule' ? 'bg-indigo-600/10 text-indigo-400 border-indigo-600/20' : 'text-slate-500 hover:text-slate-300 border-transparent hover:bg-slate-900'}`}
                  >
                    <CalendarDays className="w-4 h-4" />
                    CONFIGURAÇÃO AGENDA
                  </button>

                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all outline-none cursor-pointer border ${activeTab === 'profile' ? 'bg-indigo-600/10 text-indigo-400 border-indigo-600/20' : 'text-slate-500 hover:text-slate-300 border-transparent hover:bg-slate-900'}`}
                  >
                    <User className="w-4 h-4" />
                    PERFIL DO LINK
                  </button>

                  <button
                    onClick={() => setActiveTab('audit_logs')}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all outline-none cursor-pointer border ${activeTab === 'audit_logs' ? 'bg-indigo-600/10 text-indigo-400 border-indigo-600/20' : 'text-slate-500 hover:text-slate-300 border-transparent hover:bg-slate-900'}`}
                  >
                    <Shield className="w-4 h-4" />
                    LOGS DE AUDITORIA
                  </button>
                </nav>

                {/* Public Link Quick Access Card */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    LINK DE AGENDAMENTOS
                  </div>
                  <p className="text-[11px] text-indigo-400 font-mono truncate select-all px-2 py-1 bg-slate-950 rounded border border-slate-800 underline">
                    agendafacil.io/{profile.publicSlug}
                  </p>
                  <button
                    onClick={() => setViewMode('public')}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-[10px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer outline-none"
                  >
                    Testar Link
                    <Eye className="w-3 h-3" />
                  </button>
                </div>
              </aside>

              {/* Active Workspace Viewport Panel */}
              <main className="flex-1 min-w-0">
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'services' && <ServicesManager />}
                {activeTab === 'schedule' && <ScheduleSettings />}
                {activeTab === 'profile' && <ProfileSettings />}
                {activeTab === 'audit_logs' && <AuditLogsView />}
              </main>
            </div>
          )}
        </div>
      )}

      {/* Corporate Professional Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/20 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-semibold font-mono">
          <div>
            &copy; 2026 Agenda Fácil Inc. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-2.5 text-slate-600">
            <span>Auth v2.0-secure</span>
            <span>•</span>
            <span>Firestore Core Serverless</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <FirebaseProvider>
        <AppContent />
      </FirebaseProvider>
    </ThemeProvider>
  );
}

