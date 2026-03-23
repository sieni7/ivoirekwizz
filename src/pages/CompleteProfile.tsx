import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import { User, GraduationCap, Target, Calendar, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

export default function CompleteProfile() {
  const { user } = useAuth();
  const { profile, upsertProfile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    age: '',
    niveau: '',
    concours_cible: ''
  });
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (profile && profile.nom && profile.prenom && !profileLoading) {
      navigate('/');
    }
  }, [profile, profileLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setLocalLoading(true);
      await upsertProfile({
        id: user.id,
        nom: formData.nom,
        prenom: formData.prenom,
        age: parseInt(formData.age, 10),
        niveau: formData.niveau,
        concours_cible: formData.concours_cible
      });
      navigate('/');
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setLocalLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ci-surface)]">
        <Loader2 className="animate-spin w-8 h-8 text-[var(--ci-orange)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--ci-surface)] font-sans">
      {/* Top Header Section (40% height) */}
      <div className="h-[35vh] bg-[#0F0E0C] relative flex flex-col items-center justify-center px-4">
        {/* Progress Bar Container */}
        <div className="absolute top-12 w-full max-w-xs px-4">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Étape 2 / 2</span>
            <span className="text-[10px] font-black text-[#F4720B] uppercase tracking-[0.2em]">100%</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#F4720B] transition-all duration-1000 ease-out" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="animate-fade-in-up text-center mt-8">
          <h2 className="text-white text-2xl font-black tracking-tight">Finalisez votre profil</h2>
          <p className="text-slate-400 text-sm font-medium mt-1">Personnalisez votre expérience IvoryKwizz</p>
        </div>
      </div>

      {/* Form Card (Overlapping) */}
      <div className="flex-1 -mt-10 bg-white rounded-t-[2.5rem] shadow-[0_-4px_25px_rgba(0,0,0,0.06)] border-t border-[var(--ci-border)] px-6 py-10 animate-fade-in-up">
        <div className="max-w-md mx-auto w-full">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Nom & Prénom Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[var(--ci-orange)] transition-colors" />
                  <input id="nom" name="nom" type="text" required value={formData.nom} onChange={handleChange} placeholder="Traoré" className="input-field pl-10 h-12 text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prénoms</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[var(--ci-orange)] transition-colors" />
                  <input id="prenom" name="prenom" type="text" required value={formData.prenom} onChange={handleChange} placeholder="Moussa" className="input-field pl-10 h-12 text-sm" />
                </div>
              </div>
            </div>

            {/* Age */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Âge actuel (15-60 ans)</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[var(--ci-orange)] transition-colors" />
                <input id="age" name="age" type="number" min="15" max="60" required value={formData.age} onChange={handleChange} placeholder="24" className="input-field pl-10" />
              </div>
            </div>

            {/* Niveau d'études */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Diplôme le plus élevé</label>
              <div className="relative group">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[var(--ci-orange)] transition-colors z-10" />
                <select id="niveau" name="niveau" required value={formData.niveau} onChange={handleChange} className="input-field pl-10 appearance-none bg-white">
                  <option value="" disabled>Sélectionnez votre niveau...</option>
                  <option value="BEPC">BEPC</option>
                  <option value="BAC">BAC</option>
                  <option value="Licence">Licence (BAC+3)</option>
                  <option value="Master">Master (BAC+5)</option>
                  <option value="Doctorat">Doctorat</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>

            {/* Concours visé */}
            <div className="space-y-2">
              <label className="text-[10px) font-black text-slate-400 uppercase tracking-widest ml-1">Objectif Concours</label>
              <div className="relative group">
                <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[var(--ci-orange)] transition-colors z-10" />
                <select id="concours_cible" name="concours_cible" required value={formData.concours_cible} onChange={handleChange} className="input-field pl-10 appearance-none bg-white">
                  <option value="" disabled>Quel concours préparez-vous ?</option>
                  <option value="CAFOP">CAFOP</option>
                  <option value="ENA">ENA</option>
                  <option value="Douanes">Douanes</option>
                  <option value="Fonction Publique">Fonction Publique</option>
                  <option value="Eaux et Forêts">Eaux et Forêts</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button type="submit" disabled={localLoading || profileLoading} className="btn-primary flex items-center gap-3">
                {localLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                  <>
                    <span>C'est parti !</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Bottom Security Info */}
          <div className="mt-10 flex justify-center items-center gap-2 opacity-50">
            <CheckCircle className="w-4 h-4 text-[var(--ci-green)]" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vos données sont stockées en Côte d'Ivoire</span>
          </div>
        </div>
      </div>
    </div>
  );
}
