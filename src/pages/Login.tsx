import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, MessageCircle, RefreshCw, ChevronLeft, ShieldCheck } from 'lucide-react';

const IS_DEV = import.meta.env.VITE_DEV_MODE === 'true';

export default function Login() {
  const { user, sendOtp, verifyOtp, verifyAttempts, generateSupportLink, signInAsGuest, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const maskEmail = (str: string) => {
    const [name, domain] = str.split('@');
    if (!name || !domain) return str;
    const masked = name.length > 2 ? name.substring(0, 2) + '***' : name + '***';
    return `${masked}@${domain}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      setLoading(true);
      await sendOtp(email);
      setStep('otp');
      setCooldown(60);
    } catch (error: any) {
      if (error.message?.includes('rate limit')) {
        alert("Trop de tentatives ! Veuillez patienter quelques minutes avant de demander un nouveau code (Sécurité Supabase).");
      } else {
        alert(`Erreur : ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6 || loading) return;
    try {
      setLoading(true);
      console.log(`Bouton cliqué: Vérification de ${otp} pour ${email}`);
      const data = await verifyOtp(email, otp);
      if (data?.user) {
        console.log("Utilisateur récupéré après vérification:", data.user);
      }
    } catch (error: any) {
      console.error('Erreur dans handleVerifyOtp:', error);
      alert(error.message || "Code invalide. Réessayez.");
      setOtp(''); // Clear if failed
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    await handleSendOtp({ preventDefault: () => {} } as any);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ci-surface)]">
        <RefreshCw className="animate-spin w-8 h-8 text-[var(--ci-orange)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--ci-surface)] font-sans">
      {/* Top Band (40% height) */}
      <div className="h-[40vh] bg-[#0F0E0C] relative flex flex-col items-center justify-center px-4">
        <div className="animate-fade-in-up text-center mb-6">
          <div className="flex items-center justify-center gap-1 text-4xl font-black italic mb-2 tracking-tighter">
            <span className="text-white">Ivoire</span>
            <span className="text-[#F4720B]">Kwizz</span>
          </div>
          <p className="text-slate-400 text-sm font-medium tracking-wide">Réussissez vos concours ivoiriens 🇨🇮</p>
        </div>

        {/* CI Flag Detail */}
        <div className="flex w-24 h-[3px] rounded-full overflow-hidden absolute bottom-12">
          <div className="flex-1 bg-[#F4720B]"></div>
          <div className="flex-1 bg-white"></div>
          <div className="flex-1 bg-[#009A3C]"></div>
        </div>
      </div>

      {/* Login Card (Overlapping) */}
      <div className="flex-1 -mt-8 bg-white rounded-t-[2rem] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-[var(--ci-border)] px-6 pt-10 pb-8 animate-fade-in-up">
        <div className="max-w-md mx-auto w-full">
          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                  Identifiant Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[var(--ci-orange)] transition-colors" />
                  <input
                    type="email"
                    placeholder="votre.email@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-12"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : "Recevoir mon code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-sm font-medium text-slate-500">
                  Code envoyé à <span className="text-[var(--ci-dark)] font-bold">{maskEmail(email)}</span>
                </p>
                <button 
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-[11px] font-bold text-[var(--ci-orange)] hover:underline mt-1 flex items-center justify-center gap-1 mx-auto"
                >
                  <ChevronLeft className="w-3 h-3" /> Modifier l'adresse
                </button>
              </div>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="0 0 0 0 0 0"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full h-16 text-center text-3xl font-black bg-[var(--ci-surface)] border-[1.5px] border-[var(--ci-border)] rounded-xl tracking-[0.5em] focus:border-[var(--ci-orange)] focus:outline-none transition-all"
                required
                autoFocus
              />

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || otp.length < 6 || verifyAttempts >= 5}
                  className="btn-primary"
                >
                  {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : "Confirmer le code"}
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="w-full py-2 text-xs font-bold text-slate-400 hover:text-[var(--ci-orange)] disabled:text-slate-200 transition-colors"
                >
                  {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : "Renvoyer le code par mail"}
                </button>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6">
                <a
                  href={generateSupportLink(email)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  Assistance WhatsApp
                </a>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="mt-12 flex flex-col items-center gap-6">
            <div className="flex items-center gap-2 opacity-30">
              <ShieldCheck className="w-3 h-3 text-[var(--ci-green)]" />
              <span className="text-[9px] font-bold text-[var(--ci-dark)] uppercase tracking-[0.3em]">Protection des données CI</span>
            </div>

            {IS_DEV && (
              <button
                onClick={signInAsGuest}
                className="text-[10px] font-bold text-slate-300 hover:text-[var(--ci-orange)]"
              >
                [ Accès Développeur ]
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
