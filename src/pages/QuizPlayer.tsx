import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import { useThemes } from '../hooks/useThemes';
import { Info, CheckCircle2, XCircle } from 'lucide-react';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizPlayer() {
  const { theme_slug } = useParams<{ theme_slug: string }>();
  const navigate = useNavigate();
  
  const { themes } = useThemes();
  const theme = themes.find(t => t.slug === theme_slug);

  const {
    questions,
    questionActuelle,
    indexActuel,
    totalQuestions,
    repondre,
    questionSuivante,
    terminer
  } = useQuiz();

  const [reponseSelectionnee, setReponseSelectionnee] = useState<number | null>(null);
  const [estValide, setEstValide] = useState<boolean>(false);

  // Redirection si pas de questions en session
  useEffect(() => {
    if (questions.length === 0) {
      navigate(`/quiz/${theme_slug}`, { replace: true });
    }
  }, [questions.length, navigate, theme_slug]);

  // Reset des états locaux à chaque changement de question
  useEffect(() => {
    setReponseSelectionnee(null);
    setEstValide(false);
  }, [indexActuel]);

  if (!questionActuelle || !theme) {
    return null;
  }

  const handleSelect = (index: number) => {
    if (!estValide) {
      setReponseSelectionnee(index);
    }
  };

  const handleValider = () => {
    if (reponseSelectionnee !== null && !estValide) {
      setEstValide(true);
      repondre(reponseSelectionnee);
    }
  };

  const handleSuivant = () => {
    if (indexActuel < totalQuestions - 1) {
      questionSuivante();
    } else {
      terminer();
      navigate(`/quiz/${theme_slug}/resultats`);
    }
  };

  const getOptionStyle = (index: number) => {
    if (!estValide) {
      // Avant validation
      if (reponseSelectionnee === index) {
        return 'bg-orange-50 border-[var(--ci-orange)] text-[var(--ci-orange)]';
      }
      return 'bg-white border-[var(--ci-border)] text-[var(--ci-dark)] hover:border-slate-300';
    } else {
      // Après validation
      if (index === questionActuelle.bonne_reponse) {
        return 'bg-green-50 border-green-500 text-green-700 z-10 shadow-sm';
      }
      if (reponseSelectionnee === index) {
        return 'bg-red-50 border-red-400 text-red-600 shadow-sm';
      }
      return 'bg-white border-[var(--ci-border)] opacity-50 text-[var(--ci-dark)] cursor-not-allowed';
    }
  };

  const getOptionIcon = (index: number) => {
    if (!estValide) return null;
    if (index === questionActuelle.bonne_reponse) {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
    if (reponseSelectionnee === index) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return null;
  };

  const progressPercent = ((indexActuel + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-[var(--ci-surface)] flex flex-col pb-24">
      {/* Barre de progression fixe (orange) */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-200 z-50">
        <div 
          className="h-full bg-[var(--ci-orange)] transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 pt-8">
        {/* Header (Thème + Compteur) */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-[var(--ci-orange)] flex items-center justify-center text-lg shadow-sm">
              {theme.icon}
            </div>
            <span className="font-bold text-[var(--ci-dark)] hidden sm:block">
              {theme.label}
            </span>
          </div>
          <div className="px-3 py-1 bg-white border border-[var(--ci-border)] rounded-full text-sm font-bold text-slate-500 shadow-sm">
            Question {indexActuel + 1} / {totalQuestions}
          </div>
        </header>

        {/* Énoncé */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-black text-[var(--ci-dark)] leading-snug">
            {questionActuelle.enonce}
          </h2>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {questionActuelle.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={estValide}
              className={`relative flex items-center p-4 border-2 rounded-xl text-left transition-all outline-none focus:ring-2 focus:ring-[var(--ci-orange)] focus:ring-opacity-50 ${getOptionStyle(index)}`}
            >
              {/* Préfixe (A/B/C/D) */}
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded bg-white/50 border border-current opacity-80 font-bold mr-4 text-sm">
                {LETTERS[index]}
              </div>
              
              <span className="flex-1 font-medium text-sm sm:text-base leading-snug">
                {option}
              </span>
              
              <div className="flex-shrink-0 ml-3">
                {getOptionIcon(index)}
              </div>
            </button>
          ))}
        </div>

        {/* Explication dynamique */}
        {estValide && (
          <div className="mt-6 p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 animate-fade-in-up">
            <Info className="w-5 h-5 flex-shrink-0 text-slate-400 mt-0.5" />
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              {questionActuelle.explication}
            </p>
          </div>
        )}

      </div>

      {/* Floating Action Bar (Barre collée en bas) */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-[var(--ci-border)] p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-2xl mx-auto flex justify-end">
          {!estValide ? (
            reponseSelectionnee !== null && (
              <button
                onClick={handleValider}
                className="btn-primary w-full sm:w-auto px-10 animate-fade-in-up"
              >
                Valider ma réponse
              </button>
            )
          ) : (
            <button
              onClick={handleSuivant}
              className="btn-primary w-full sm:w-auto px-10 animate-fade-in-up"
            >
              {indexActuel < totalQuestions - 1 ? 'Question suivante' : 'Voir mes résultats'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
