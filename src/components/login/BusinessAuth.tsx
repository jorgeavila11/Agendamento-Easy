import React, { useState } from 'react';
import { useFirebase } from '../../context/FirebaseContext';
import { maskBrazilianPhone } from '../../utils/phoneMask';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Briefcase, 
  Phone
} from 'lucide-react';

interface BusinessAuthProps {
  onSetFeedback: (msg: { type: 'success' | 'error', text: string } | null) => void;
}

export default function BusinessAuth({ onSetFeedback }: BusinessAuthProps) {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, updateProfile, setIsDemoLoggedIn } = useFirebase();
  const [formType, setFormType] = useState<'signin' | 'signup'>('signin');
  
  // Auth Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Beleza e Bem-Estar');
  const [phone, setPhone] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSetFeedback(null);
    setIsSubmitting(true);

    try {
      if (formType === 'signup') {
        await signUpWithEmail(
          email,
          password,
          businessName || 'Juliana Costa',
          phone || '(11) 98765-4321',
          category
        );

        onSetFeedback({
          type: 'success',
          text: `Empresa registrada com sucesso! Cadastro de '${businessName}' foi sincronizado no Firebase.`
        });
      } else {
        await signInWithEmail(email, password);

        onSetFeedback({
          type: 'success',
          text: `Acesso comercial liberado para ${email}.`
        });
      }
    } catch (error: any) {
      console.error(error);
      let errorMsg = "Ocorreu um erro ao processar. Certifique-se de que o provedor de e-mail/senha está ativo no Firebase.";
      if (error?.code === "auth/email-already-in-use") {
        errorMsg = "Este endereço de e-mail já está em uso por outro profissional.";
      } else if (error?.code === "auth/invalid-credential" || error?.code === "auth/wrong-password" || error?.code === "auth/user-not-found") {
        errorMsg = "E-mail ou senha incorretos, ou usuário não cadastrado.";
      } else if (error?.code === "auth/weak-password") {
        errorMsg = "A senha de segurança deve conter pelo menos 6 caracteres.";
      } else if (error?.code === "auth/invalid-email") {
        errorMsg = "O formato de endereço de e-mail inserido é inválido.";
      } else if (error?.message) {
        errorMsg = error.message;
      }
      onSetFeedback({
        type: 'error',
        text: errorMsg
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative py-10 px-4 sm:px-6 flex flex-col justify-between min-h-[500px]">
      
      {/* Brand Header */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm">
            A
          </div>
          <span className="font-bold text-white text-base font-display tracking-tight">AgendaFácil</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">
          Painel Profissional
        </span>
      </div>

      <div className="max-w-md w-full mx-auto my-6">
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative backdrop-blur-sm">
          
          <div className="text-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-display">
              {formType === 'signin' ? 'Seja bem-vindo' : 'Crie sua Conta Profissional'}
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {formType === 'signin' ? 'Gerencie seus serviços, horários e clientes' : 'Configure o seu negócio em segundos'}
            </p>
          </div>

          {/* Social login integration buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={signInWithGoogle}
              className="py-2.5 px-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer outline-none"
            >
              <svg className="w-3.5 h-3.5 fill-current text-white shrink-0" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.25.61 4.5 1.64l2.484-2.484C17.34 1.69 14.97 1 12.24 1 6.58 1 2 5.58 2 11.24s4.58 10.24 10.24 10.24c5.79 0 10.24-4.06 10.24-10.24 0-.69-.06-1.35-.18-1.95H12.24z" />
              </svg>
              Google
            </button>

            <button
              type="button"
              onClick={() => onSetFeedback({ type: 'success', text: 'Autenticação rápida com Apple ID simulada.' })}
              className="py-2.5 px-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer outline-none"
            >
              <svg className="w-3.5 h-3.5 fill-current text-white shrink-0" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z" />
              </svg>
              Apple
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-850"></div>
            <span className="flex-shrink mx-4 text-[8px] text-slate-500 font-bold uppercase tracking-widest">OU E-MAIL</span>
            <div className="flex-grow border-t border-slate-850"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formType === 'signup' && (
              <>
                {/* Business Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nome da Empresa / Profissional</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Espaço Harmonia Studio"
                      className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl outline-none"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Business Category select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Ramo de Atuação</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl outline-none"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Beleza e Bem-Estar">Beleza e Bem-Estar (Salão, Barbearia)</option>
                    <option value="Saúde & Clínicas">Saúde, Medicina & Terapias</option>
                    <option value="Aulas e Consultorias">Educação, Aulas & Mentorias</option>
                    <option value="Petshops & Veterinários">Veterinário & Petshop</option>
                    <option value="Outros Serviços">Outros Serviços Autônomos</option>
                  </select>
                </div>

                {/* Business Phone */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Telefone de Contato</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      required
                      placeholder="Ex: (88) 9 9761-4430"
                      className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl outline-none"
                      value={phone}
                      onChange={(e) => setPhone(maskBrazilianPhone(e.target.value))}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Endereço de E-mail</label>
              <input 
                type="email"
                required
                placeholder="nome@empresa.com"
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Senha de Segurança</label>
                {formType === 'signin' && (
                  <button 
                    type="button"
                    onClick={() => onSetFeedback({ type: 'success', text: 'Instruções para redefinir sua senha foram enviadas ao seu e-mail.' })}
                    className="text-[10px] text-indigo-400 font-bold hover:underline"
                  >
                    Esqueceu?
                  </button>
                )}
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                id="remember-b-center"
                className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-650 cursor-pointer"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember-b-center" className="text-[10px] text-slate-400 select-none cursor-pointer font-semibold">
                Lembrar deste dispositivo por 30 dias
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow hover:shadow-indigo-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                formType === 'signin' ? 'Acessar o Painel' : 'Registrar Empresa Grátis'
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <span className="text-[11px] text-slate-505 text-slate-550 font-medium">
              {formType === 'signin' ? 'Ainda não tem conta comercial? ' : 'Já tem uma conta comercial? '}
            </span>
            <button 
              type="button"
              onClick={() => {
                setFormType(prev => prev === 'signin' ? 'signup' : 'signin');
                onSetFeedback(null);
              }}
              className="text-[11px] text-indigo-400 font-bold hover:underline cursor-pointer outline-none"
            >
              {formType === 'signin' ? 'Cadastre-se' : 'Acesse sua Conta'}
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-md mx-auto w-full pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] text-slate-500 font-mono">
        <div>&copy; 2026 AgendaFácil Inc. Todos os direitos reservados.</div>
        <div className="flex items-center gap-4">
          <span className="cursor-pointer hover:text-slate-350">Privacidade</span>
          <span className="cursor-pointer hover:text-slate-350">Termos</span>
        </div>
      </div>

    </section>
  );
}
