import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  
  if (!user) return null;

  const displayName = profile?.prenom || user.user_metadata?.full_name?.split(' ')[0] || 'Ami';

  return (
    <nav className="sticky top-0 h-14 w-full bg-[#0F0E0C] text-white flex items-center justify-between px-4 sm:px-6 z-50 shadow-md">
      <div className="flex items-center gap-1 text-lg font-extrabold tracking-tight">
        <span>Ivoire</span>
        <span className="text-[#F4720B]">Kwizz</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-300">
          Salut, <span className="text-white font-bold">{displayName}</span>
        </span>
        <button 
          onClick={() => signOut()}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-[#F4720B]"
          title="Déconnexion"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
