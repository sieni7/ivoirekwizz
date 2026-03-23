import { useState, useEffect, useMemo } from 'react';

export interface Question {
  id: string;
  theme_id: string;
  enonce: string;
  options: string[];
  bonne_reponse: number;
  explication: string;
  niveau: string;
}

export function useQuiz() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [indexActuel, setIndexActuel] = useState<number>(0);
  const [reponsesUtilisateur, setReponsesUtilisateur] = useState<(number | null)[]>([]);
  const [estTermine, setEstTermine] = useState<boolean>(false);

  useEffect(() => {
    const storedQuestions = sessionStorage.getItem('quiz_questions');
    if (storedQuestions) {
      try {
        const parsed = JSON.parse(storedQuestions) as Question[];
        setQuestions(parsed);
        setReponsesUtilisateur(new Array(parsed.length).fill(null));
      } catch (err) {
        console.error('Erreur lors du parsing des questions depuis le sessionStorage', err);
        setQuestions([]);
        setReponsesUtilisateur([]);
      }
    } else {
      setQuestions([]);
      setReponsesUtilisateur([]);
    }
  }, []);

  const totalQuestions = questions.length;
  const questionActuelle = totalQuestions > 0 ? questions[indexActuel] : null;

  const repondre = (index: number) => {
    setReponsesUtilisateur(prev => {
      const nouvellesReponses = [...prev];
      nouvellesReponses[indexActuel] = index;
      return nouvellesReponses;
    });
  };

  const questionSuivante = () => {
    if (indexActuel < totalQuestions - 1) {
      setIndexActuel(prev => prev + 1);
    }
  };

  const questionPrecedente = () => {
    if (indexActuel > 0) {
      setIndexActuel(prev => prev - 1);
    }
  };

  const terminer = () => {
    setEstTermine(true);
  };

  const score = useMemo(() => {
    if (totalQuestions === 0) return 0;
    return questions.reduce((acc, q, i) => {
      if (reponsesUtilisateur[i] === q.bonne_reponse) {
        return acc + 1;
      }
      return acc;
    }, 0);
  }, [questions, reponsesUtilisateur, totalQuestions]);

  const pourcentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

  return {
    questions,
    questionActuelle,
    indexActuel,
    totalQuestions,
    reponsesUtilisateur,
    estTermine,
    score,
    pourcentage,
    repondre,
    questionSuivante,
    questionPrecedente,
    terminer
  };
}
