import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz';
import { useAuth } from '../hooks/useAuth';
import { useThemes } from '../hooks/useThemes';
import { supabase } from '../lib/supabase';
import { CheckCircle2, XCircle, RotateCcw, LayoutGrid } from 'lucide-react';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function Results() {
  const { theme_slug } = useParams<{ theme_slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { themes } = useThemes();
  const theme = themes.find(t => t.slug === theme_slug);

  const {
    questions,
    reponsesUtilisateur,
    score,
    pourcentage,
    totalQuestions
  } = useQuiz();

  const isSaved = useRef(false);

  // Redirection si pas de questions
  useEffect(() => {
    if (questions.length === 0) {
      navigate('/dashboard', { replace: true });
    }
  }, [questions.length, navigate]);

  // Sauvegarde Supabase (une seule fois)
  useEffect(() => {
    const saveResults = async () => {
      if (isSaved.current) return;
      if (!user || !theme) return;
      if (import.meta.env.VITE_DEV_MODE === 'true') return;
      if (questions.length === 0) return;

      isSaved.current = true;

      try {
        // 1. INSERT session
        const { data: session, error: sessionError } = await supabase
          .from('sessions')
          .insert({
            user_id: user.id,
            theme_id: theme.id,
            finished_at: new Date().toISOString(),
            nb_questions: totalQuestions
          })
          .select('id')
          .single();

        if (sessionError || !session) {
          console.error('Erreur insertion session:', sessionError);
          return;
        }

        // 2. INSERT session_answers
        const answers = questions.map((q, i) => ({
          session_id: session.id,
          question_id: q.id,
          reponse_choisie: reponsesUtilisateur[i],
          est_correcte: reponsesUtilisateur[i] === q.bonne_reponse
        }));

        const { error: answersError } = await supabase
          .from('session_answers')
          .insert(answers);

        if (answersError) {
          console.error('Erreur insertion réponses:', answersError);
        }

        // 3. INSERT score
        const { error: scoreError } = await supabase
          .from('scores')
          .insert({
            user_id: user.id,
            theme_id: theme.id,
            session_id: session.id,
            score,
            pourcentage
          });

        if (scoreError) {
          console.error('Erreur insertion score:', scoreError);
        }

        // 4. Nettoyer le sessionStorage
        sessionStorage.removeItem('quiz_questions');
      } catch (err) {
        console.error('Erreur sauvegarde résultats:', err);
      }
    };

    saveResults();
  }, [user, theme, questions, reponsesUtilisateur, score, pourcentage, totalQuestions]);

  if (questions.length === 0 || !theme) {
    return null;
  }

  // SVG Circle
  const RADIUS = 54;
  const STROKE_WIDTH = 8;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const offset = CIRCUMFERENCE - (pourcentage / 100) * CIRCUMFERENCE;

  const getMessage = (): string => {
    if (pourcentage >= 80) return 'Excellent ! Vous êtes prêt(e) pour le concours !';
    if (pourcentage >= 60) return 'Bien ! Continuez à pratiquer.';
    return 'Courage ! La pratique mène à la perfection.';
  };

  const getEmoji = (): string => {
    if (pourcentage >= 80) return '🏆';
    if (pourcentage >= 60) return '👍';
    return '💪';
  };

  return (
    <div className="min-h-screen pt-8 pb-12 px-4 bg-[var(--ci-surface)] animate-fade-in-up">
      <div className="max-w-2xl mx-auto">
        {/* Score Card */}
        <div className="ci-card p-6 sm:p-8 text-center mb-8">
          {/* SVG Circle */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <svg width={140} height={140} className="-rotate-90">
                {/* Background circle */}
                <circle
                  cx={70}
                  cy={70}
                  r={RADIUS}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth={STROKE_WIDTH}
                />
                {/* Progress arc */}
                <circle
                  cx={70}
                  cy={70}
                  r={RADIUS}
                  fill="none"
                  stroke="var(--ci-orange)"
                  strokeWidth={STROKE_WIDTH}
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={offset}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-[var(--ci-dark)]">
                  {score} / {totalQuestions}
                </span>
                <span className="text-sm font-bold text-[var(--ci-orange)]">
                  {Math.round(pourcentage)}%
                </span>
              </div>
            </div>
          </div>

          {/* Encouragement */}
          <div className="text-3xl mb-2">{getEmoji()}</div>
          <p className="text-base sm:text-lg font-bold text-[var(--ci-dark)]">
            {getMessage()}
          </p>
        </div>

        {/* Corrigé détaillé */}
        <div className="ci-card overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-[var(--ci-border)] bg-slate-50">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Corrigé détaillé
            </h2>
          </div>

          <div className="divide-y divide-[var(--ci-border)]">
            {questions.map((q, i) => {
              const reponseUser = reponsesUtilisateur[i];
              const estCorrecte = reponseUser === q.bonne_reponse;

              return (
                <div key={q.id} className="p-5 sm:p-6">
                  {/* Numéro + Énoncé */}
                  <div className="flex items-start gap-3 mb-4">
                    <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      estCorrecte ? 'bg-green-500' : 'bg-red-400'
                    }`}>
                      {i + 1}
                    </span>
                    <p className="text-sm sm:text-base font-bold text-[var(--ci-dark)] leading-snug">
                      {q.enonce}
                    </p>
                  </div>

                  {/* Réponse utilisateur */}
                  <div className="ml-10 space-y-2">
                    {reponseUser !== null && (
                      <div className={`flex items-center gap-2 text-sm font-medium ${
                        estCorrecte ? 'text-green-700' : 'text-red-600'
                      }`}>
                        {estCorrecte 
                          ? <CheckCircle2 className="w-4 h-4 text-green-600" /> 
                          : <XCircle className="w-4 h-4 text-red-500" />
                        }
                        <span>
                          Votre réponse : {LETTERS[reponseUser]}. {q.options[reponseUser]}
                        </span>
                      </div>
                    )}

                    {/* Bonne réponse (toujours affichée si fausse) */}
                    {!estCorrecte && (
                      <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>
                          Bonne réponse : {LETTERS[q.bonne_reponse]}. {q.options[q.bonne_reponse]}
                        </span>
                      </div>
                    )}

                    {/* Explication */}
                    {q.explication && (
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-2 pl-6 border-l-2 border-slate-200">
                        {q.explication}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate(`/quiz/${theme_slug}`)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl border-2 border-[var(--ci-border)] bg-white text-[var(--ci-dark)] font-bold hover:border-slate-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Recommencer ce thème
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <LayoutGrid className="w-4 h-4" />
            Choisir un autre thème
          </button>
        </div>
      </div>
    </div>
  );
}
