import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Theme {
  id: string;
  slug: string;
  label: string;
  description: string;
  icon: string;
  ordre: number;
  nb_questions: number;
  score_moyen: number | null;
}

interface DbTheme {
  id: string;
  slug: string;
  label: string;
  description: string;
  icon: string;
  ordre: number;
}

export function useThemes() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    async function fetchThemes() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch des thèmes ordonnés par 'ordre' ASC
        const { data: themesData, error: themesError } = await supabase
          .from('themes')
          .select('*')
          .order('ordre', { ascending: true });

        if (themesError) throw themesError;

        if (!themesData) {
          if (isMounted) {
            setThemes([]);
            setLoading(false);
          }
          return;
        }

        const typedThemes = themesData as DbTheme[];

        // 2. Fetch des agrégations
        const themesWithStats: Theme[] = await Promise.all(
          typedThemes.map(async (theme) => {
            // Nombre de questions
            const { count, error: countError } = await supabase
              .from('questions')
              .select('*', { count: 'exact', head: true })
              .eq('theme_id', theme.id);

            if (countError) {
              console.error(`Erreur comptage questions pour ${theme.id}:`, countError.message);
            }

            // Score moyen de l'utilisateur
            let avgScore: number | null = null;
            if (user?.id) {
              const { data: scores, error: scoresError } = await supabase
                .from('scores')
                .select('pourcentage')
                .eq('theme_id', theme.id)
                .eq('user_id', user.id);

              if (scoresError) {
                console.error(`Erreur récupération scores pour ${theme.id}:`, scoresError.message);
              } else if (scores && scores.length > 0) {
                const validScores = scores
                  .map(s => s.pourcentage)
                  .filter((p): p is number => typeof p === 'number');
                
                if (validScores.length > 0) {
                  const sum = validScores.reduce((acc, curr) => acc + curr, 0);
                  avgScore = sum / validScores.length;
                }
              }
            }

            return {
              ...theme,
              nb_questions: count || 0,
              score_moyen: avgScore,
            };
          })
        );

        if (isMounted) {
          setThemes(themesWithStats);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
          console.error('Erreur globale useThemes:', errorMessage);
          setError(errorMessage);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchThemes();

    return () => {
      isMounted = false;
    };
  }, [user?.id]); // On dépend explicitement de user.id pour éviter les boucles inutiles

  return { themes, loading, error };
}
