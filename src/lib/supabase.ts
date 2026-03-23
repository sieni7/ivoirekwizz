import { createClient } from '@supabase/supabase-js';

// Configuration depuis les variables d'environnement (ex: fichier .env local ou dashboard Netlify)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Attention : Identifiants Supabase manquants. Assurez-vous d'avoir configuré VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.");
}

// Initialisation du client Supabase
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
