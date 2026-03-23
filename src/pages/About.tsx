import { Shield, Target, BookOpen, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--ci-surface)] font-sans pb-12">
      {/* Hero Header */}
      <div className="bg-[#0F0E0C] pt-16 pb-24 px-6 relative overflow-hidden">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 p-2 bg-white/5 rounded-xl text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F4720B]/10 border border-[#F4720B]/20 rounded-full text-[#F4720B] text-[10px] font-black uppercase tracking-widest mb-6">
            Notre Mission
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            Démocratiser la réussite aux <span className="text-[#F4720B]">Concours CI</span>
          </h1>
          <p className="mt-6 text-slate-400 text-lg font-medium leading-relaxed max-w-2xl mx-auto">
            IvoireKwizz est la première plateforme intelligente conçue spécifiquement pour les candidats aux concours de la fonction publique ivoirienne.
          </p>
        </div>

        {/* CI Stripes Detail */}
        <div className="absolute bottom-0 left-0 w-full h-1 flex">
          <div className="flex-1 bg-[#F4720B]"></div>
          <div className="flex-1 bg-white"></div>
          <div className="flex-1 bg-[#009A3C]"></div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto px-6 -mt-12 space-y-6">
        
        {/* Core Values Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="ci-card p-6 flex items-start gap-4">
            <div className="p-3 bg-[#F4720B]/10 rounded-xl text-[#F4720B]">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg">Contenu Certifié</h3>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                Des milliers de questions alignées sur les programmes officiels de l'ENA, CAFOP, et autres.
              </p>
            </div>
          </div>

          <div className="ci-card p-6 flex items-start gap-4">
            <div className="p-3 bg-[#009A3C]/10 rounded-xl text-[#009A3C]">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg">Précision Chirurgicale</h3>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                Apprenez de vos erreurs avec des explications détaillées pour chaque réponse.
              </p>
            </div>
          </div>
        </div>

        {/* Mission Detail Card */}
        <div className="ci-card p-8 sm:p-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col sm:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4 text-center sm:text-left">
              <h2 className="text-2xl font-black tracking-tight">Pourquoi nous existons ?</h2>
              <p className="text-slate-600 leading-relaxed font-medium text-lg">
                Nous croyons que chaque Ivoirien, peu importe son origine ou son lieu de résidence, mérite d'avoir accès aux meilleurs outils de préparation pour servir son pays.
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#009A3C]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fiabilité</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#009A3C]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Communauté</span>
                </div>
              </div>
            </div>
            <div className="w-40 h-40 bg-[var(--ci-surface)] rounded-full flex items-center justify-center border-4 border-white shadow-inner shrink-0 overflow-hidden relative">
               <div className="absolute inset-0 opacity-10 flex items-center justify-center font-black text-8xl text-[#F4720B]">🇨🇮</div>
               <span className="text-4xl font-black italic text-[#0F0E0C] z-10">IK</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center pt-8">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Propulsé par la Technologie Ivoirienne</p>
        </div>
      </div>
    </div>
  );
}
