import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useThemes } from '../hooks/useThemes';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const NIVEAUX = ['Débutant', 'Intermédiaire', 'Avancé'] as const;
type Niveau = typeof NIVEAUX[number];
const NB_QUESTIONS_OPTIONS = [5, 10, 20] as const;
type NbQuestions = typeof NB_QUESTIONS_OPTIONS[number];

export default function QuizConfig() {
  const { theme_slug } = useParams<{ theme_slug: string }>();
  const navigate = useNavigate();
  const { themes, loading: themesLoading } = useThemes();
  
  const [niveau, setNiveau] = useState<Niveau>('Débutant');
  const [nbQuestions, setNbQuestions] = useState<NbQuestions>(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const theme = themes.find(t => t.slug === theme_slug);

  useEffect(() => {
    if (!themesLoading && !theme) {
      navigate('/', { replace: true });
    }
  }, [theme, themesLoading, navigate]);

  if (themesLoading || !theme) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-[var(--ci-surface)]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[var(--ci-orange)] rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const IS_DEV = import.meta.env.VITE_DEV_MODE === 'true';

      if (IS_DEV) {
        // Mode développement : fausses questions
        const fakeQuestions = Array.from({ length: nbQuestions }).map((_, i) => ({
          id: `fake-${i}`,
          theme_id: theme.id,
          enonce: `Question test n°${i + 1} pour le niveau ${niveau} en mode DEV.`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          bonne_reponse: 0,
          explication: `Ceci est une explication fictive générée en mode DEV pour vérifier que l'UI fonctionne.`,
          niveau: niveau
        }));
        
        sessionStorage.setItem('quiz_questions', JSON.stringify(fakeQuestions));
        
        // Simuler un léger délai
        await new Promise(r => setTimeout(r, 800));
        navigate(`/quiz/${theme.slug}/jouer`);
        return;
      }

      // Mode production : Appel Netlify Function
      const prodUrl = '/.netlify/functions/generate-questions';
      
      const response = await fetch(prodUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          theme_slug: theme.slug,
          niveau,
          nb_questions: nbQuestions
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Erreur lors de la génération (statut: ${response.status})`);
      }

      // Fetch aléatoire depuis Supabase : 
      // Comme "ORDER BY RANDOM()" n'est pas standard sur Data API sans RPC, 
      // on récupère un large pool qu'on mélange côté client.
      const { data: questions, error: fetchError } = await supabase
        .from('questions')
        .select('*')
        .eq('theme_id', theme.id)
        .eq('niveau', niveau)
        .limit(100);

      if (fetchError) throw fetchError;

      if (!questions || questions.length < nbQuestions) {
        throw new Error(`Désolé, seulement ${questions?.length || 0} questions trouvées pour ce niveau.`);
      }

      // Mélange aléatoire (shuffle) et découpage selon le nb_questions demandé
      const shuffled = questions.sort(() => 0.5 - Math.random()).slice(0, nbQuestions);

      sessionStorage.setItem('quiz_questions', JSON.stringify(shuffled));
      navigate(`/quiz/${theme.slug}/jouer`);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur inattendue est survenue';
      console.error('Erreur génération quiz:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 bg-[var(--ci-surface)] animate-fade-in-up">
      <div className="max-w-xl mx-auto">
        {/* Top Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-xl bg-white border border-[var(--ci-border)] text-slate-500 hover:text-[var(--ci-orange)] hover:border-slate-300 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-[var(--ci-orange)] flex items-center justify-center text-xl shadow-sm">
              {theme.icon}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--ci-dark)] line-clamp-1">
              {theme.label}
            </h1>
          </div>
        </div>

        <div className="ci-card p-5 sm:p-8 flex flex-col gap-8">
          
          {/* Niveau */}
          <div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
              Niveau de difficulté
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {NIVEAUX.map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setNiveau(lvl)}
                  className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border-2 ${
                    niveau === lvl 
                      ? 'border-[var(--ci-orange)] bg-orange-50 text-[var(--ci-orange)] shadow-sm' 
                      : 'border-[var(--ci-border)] bg-transparent text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre de questions */}
          <div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
              Nombre de questions
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {NB_QUESTIONS_OPTIONS.map(nb => (
                <button
                  key={nb}
                  onClick={() => setNbQuestions(nb)}
                  className={`py-3 px-4 rounded-xl text-sm font-bold transition-all border-2 ${
                    nbQuestions === nb 
                      ? 'border-[var(--ci-orange)] bg-orange-50 text-[var(--ci-orange)] shadow-sm' 
                      : 'border-[var(--ci-border)] bg-transparent text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {nb}
                </button>
              ))}
            </div>
          </div>

          {/* Erreur visuelle */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 animate-fade-in-up">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="mt-2 pt-6 border-t border-[var(--ci-border)]">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn-primary w-full relative overflow-hidden group"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  </div>
                  <span className="text-base">L'IA prépare vos questions...</span>
                </div>
              ) : (
                <span className="text-lg">Générer mon quiz</span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
