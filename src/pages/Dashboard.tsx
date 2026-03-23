import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useThemes, Theme } from '../hooks/useThemes';
import { AlertCircle, ChevronRight } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { themes, loading, error } = useThemes();
  const navigate = useNavigate();

  const firstName = profile?.prenom || user?.user_metadata?.full_name?.split(' ')[0] || 'Utilisateur';

  if (error) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center p-6 bg-[var(--ci-surface)]">
        <div className="w-full max-w-sm ci-card p-8 text-center flex flex-col items-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-[var(--ci-dark)]">Une erreur est survenue</h2>
          <p className="text-slate-500 mt-2 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full btn-primary"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-8 px-4 bg-[var(--ci-surface)]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--ci-dark)] tracking-tight">
            Bonjour <span className="text-[var(--ci-orange)]">{firstName}</span> !
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base font-medium">
            Que voulez-vous réviser aujourd'hui ?
          </p>
        </header>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="ci-card p-4 sm:p-5 flex flex-col h-full animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-slate-200 mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-slate-200 rounded w-5/6 mb-4"></div>
                <div className="mt-auto pt-3 border-t border-[var(--ci-border)]">
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : (
            themes.map((theme) => (
              <ThemeCard 
                key={theme.id} 
                theme={theme} 
                onClick={() => theme.nb_questions > 0 && navigate(`/quiz/${theme.slug}`)} 
              />
            ))
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <Link 
            to="/about"
            className="text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-[var(--ci-orange)] transition-colors"
          >
            À propos
          </Link>
        </footer>
      </div>
    </div>
  );
}

function ThemeCard({ theme, onClick }: { theme: Theme, onClick: () => void }) {
  const isAvailable = theme.nb_questions > 0;
  
  return (
    <div 
      onClick={onClick}
      className={`relative group ci-card p-4 sm:p-5 flex flex-col h-full transition-all ${
        isAvailable 
          ? 'cursor-pointer hover:border-[var(--ci-orange)] hover:shadow-md' 
          : 'opacity-50 cursor-not-allowed'
      }`}
    >
      {/* Icon */}
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 text-2xl sm:text-3xl bg-orange-50 text-[var(--ci-orange)] transition-transform duration-300 group-hover:scale-110">
        {theme.icon || '📚'}
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-base sm:text-lg font-bold text-[var(--ci-dark)] leading-tight mb-1 sm:mb-2 line-clamp-2">
          {theme.label}
        </h3>
        <p className="text-slate-500 text-xs sm:text-sm font-medium leading-snug line-clamp-2">
          {theme.description}
        </p>
      </div>

      {/* Stats & Progress */}
      <div className="mt-4 pt-3 border-t border-[var(--ci-border)]">
        <div className="flex flex-col gap-2">
          {isAvailable ? (
            <span className="inline-flex items-center px-2 py-1 rounded bg-green-50 text-green-700 text-[10px] sm:text-xs font-bold uppercase tracking-wide w-fit border border-green-100">
              {theme.nb_questions} questions
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wide w-fit border border-slate-200">
              Bientôt disponible
            </span>
          )}

          {theme.score_moyen !== null && (
            <div className="flex flex-col gap-1 w-full mt-1">
              <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-[var(--ci-dark)]">
                <span>Score moyen</span>
                <span className="text-[var(--ci-orange)]">{Math.round(theme.score_moyen)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--ci-orange)] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${theme.score_moyen}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hover Arrow */}
      {isAvailable && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 sm:p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--ci-orange)] text-white shadow-sm">
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </div>
      )}
    </div>
  );
}
