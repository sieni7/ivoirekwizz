-- Nettoyage propre avant recréation
DROP POLICY IF EXISTS "Themes lisibles par tous" ON public.themes;
DROP POLICY IF EXISTS "Questions lisibles par tous" ON public.questions;
DROP POLICY IF EXISTS "Sessions propres" ON public.sessions;
DROP POLICY IF EXISTS "Reponses propres" ON public.session_answers;
DROP POLICY IF EXISTS "Scores propres" ON public.scores;

DROP TABLE IF EXISTS public.scores CASCADE;
DROP TABLE IF EXISTS public.session_answers CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.themes CASCADE;

-- Phase 2: Tables pour le moteur de quiz et les scores

-- 1. Table des thèmes
CREATE TABLE IF NOT EXISTS public.themes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  label text NOT NULL,
  description text,
  icon text,
  ordre integer
);

-- 2. Table des questions
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  theme_id uuid REFERENCES public.themes(id) ON DELETE CASCADE,
  enonce text NOT NULL,
  options jsonb NOT NULL, -- Format: ["option1", "option2", "option3", "option4"]
  bonne_reponse integer NOT NULL CHECK (bonne_reponse BETWEEN 0 AND 3),
  explication text,
  niveau text CHECK (niveau IN ('Debutant','Intermediaire','Avance')),
  fois_utilise integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. Table des sessions de quiz
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_id uuid REFERENCES public.themes(id),
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  nb_questions integer
);

-- 4. Table des réponses individuelles par session
CREATE TABLE IF NOT EXISTS public.session_answers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
  question_id uuid REFERENCES public.questions(id),
  reponse_choisie integer,
  est_correcte boolean
);

-- 5. Table des scores finaux
CREATE TABLE IF NOT EXISTS public.scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_id uuid REFERENCES public.themes(id),
  session_id uuid REFERENCES public.sessions(id),
  score integer,
  pourcentage float,
  created_at timestamptz DEFAULT now()
);

-- Sécurité RLS
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
CREATE POLICY "Themes lisibles par tous" ON public.themes FOR SELECT USING (true);
CREATE POLICY "Questions lisibles par tous" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Sessions propres" ON public.sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Reponses propres" ON public.session_answers FOR ALL USING (
  session_id IN (SELECT id FROM public.sessions WHERE user_id = auth.uid())
);
CREATE POLICY "Scores propres" ON public.scores FOR ALL USING (auth.uid() = user_id);

-- Seed : 10 thèmes initiaux
INSERT INTO public.themes (slug, label, description, icon, ordre) 
VALUES
  ('culture-generale', 'Culture générale', 'Actualités et faits sur la Côte d''Ivoire', '🌍', 1),
  ('histoire-geo', 'Histoire & Géographie', 'CI et Afrique', '🗺️', 2),
  ('droit-admin', 'Droit administratif', 'Institutions ivoiriennes', '⚖️', 3),
  ('mathematiques', 'Mathématiques', 'Logique et calcul', '🔢', 4),
  ('francais', 'Français', 'Expression écrite et grammaire', '✍️', 5),
  ('education-civique', 'Éducation civique', 'Constitution ivoirienne', '🏛️', 6),
  ('economie', 'Économie', 'Finances publiques', '📊', 7),
  ('sciences-nature', 'Sciences naturelles', 'Eaux, forêts, environnement', '🌿', 8),
  ('douanes', 'Douanes & Fiscalité', 'Commerce international', '🛃', 9),
  ('anglais', 'Anglais', 'Niveau concours', '🇬🇧', 10)
ON CONFLICT (slug) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  ordre = EXCLUDED.ordre;
