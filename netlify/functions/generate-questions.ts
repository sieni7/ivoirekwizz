import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface IAProvider {
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  headers?: Record<string, string>;
}

const providers: IAProvider[] = [
  {
    name: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-8b-instant',
    apiKey: process.env.GROQ_API_KEY || '',
  },
  {
    name: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'qwen/qwen3-coder:free',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    headers: {
      'HTTP-Referer': 'https://ivoirekwizz.netlify.app',
      'X-Title': 'IvoireKwizz',
    },
  },
  {
    name: 'openai',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY || '',
  },
];

interface RequestBody {
  theme_slug?: string;
  niveau?: string;
  nb_questions?: number;
}

interface RawQuestion {
  enonce: string;
  options: string[];
  bonne_reponse: number;
  explication: string;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS, POST, GET'
};

export const handler: Handler = async (event) => {
  // Gestion du preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: corsHeaders,
      body: 'Method Not Allowed' 
    };
  }

  try {
    const bodyText = event.body || '{}';
    const parsedBody = JSON.parse(bodyText) as RequestBody;
    const { theme_slug, niveau, nb_questions } = parsedBody;

    if (!theme_slug || !niveau || !nb_questions) {
      return { 
        statusCode: 400, 
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing parameters' }) 
      };
    }

    // 1. Récupérer le thème
    const { data: theme, error: themeError } = await supabase
      .from('themes')
      .select('id, label')
      .eq('slug', theme_slug)
      .single();

    if (themeError || !theme) {
      return { 
        statusCode: 404, 
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Theme not found' }) 
      };
    }

    // 2. Vérifier le cache (questions existantes)
    const { count, error: countError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('theme_id', theme.id)
      .eq('niveau', niveau);

    if (countError) throw countError;

    // Si on a assez de questions (seuil >= nb_questions ET >= 20)
    if (count !== null && count >= nb_questions && count >= 20) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, source: 'cache', questions_count: count }),
      };
    }

    // 3. Appel IA avec fallback
    const systemPrompt = `Tu es un expert en éducation ivoirienne. Génère exactement 50 questions QCM en français sur le thème "${theme.label}" pour le niveau "${niveau}", dans le contexte des concours administratifs de Côte d'Ivoire. Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ni après, sans balises markdown. Format strict : [{"enonce": "question text", "options": ["rep1", "rep2", "rep3", "rep4"], "bonne_reponse": 0, "explication": "explication claire"}]`;

    let aiResponse: RawQuestion[] | null = null;
    let usedProvider = '';

    for (const provider of providers) {
      if (!provider.apiKey) continue;

      try {
        const response = await fetch(provider.baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
            ...(provider.headers || {}),
          },
          body: JSON.stringify({
            model: provider.model,
            messages: [{ role: 'system', content: systemPrompt }],
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          console.warn(`Provider ${provider.name} failed: ${response.statusText}`);
          continue;
        }

        const data = (await response.json()) as ChatCompletionResponse;
        const content = data.choices[0]?.message?.content;
        
        if (!content) continue;

        // Nettoyage Markdown si présent (sécurité)
        const cleanContent = content.replace(/```json/gi, '').replace(/```/g, '').trim();
        let parsedJson = JSON.parse(cleanContent) as unknown;
        
        // Si c'est un objet avec une clé "questions", on l'extrait
        if (!Array.isArray(parsedJson) && parsedJson !== null && typeof parsedJson === 'object') {
          const obj = parsedJson as Record<string, unknown>;
          if (Array.isArray(obj.questions)) {
            parsedJson = obj.questions;
          }
        }

        if (Array.isArray(parsedJson) && parsedJson.length > 0) {
          // On valide sommairement que c'est bien des RawQuestion
          const firstItem = parsedJson[0] as Partial<RawQuestion>;
          if (typeof firstItem.enonce === 'string' && Array.isArray(firstItem.options)) {
            aiResponse = parsedJson as RawQuestion[];
            usedProvider = provider.name;
            break;
          }
        }
      } catch (err) {
        console.error(`Error with ${provider.name}:`, err);
      }
    }

    if (!aiResponse || !Array.isArray(aiResponse)) {
      return { 
        statusCode: 503, 
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Tous les providers IA sont indisponibles ou ont retourné un format invalide' }) 
      };
    }

    // 4. Insertion dans Supabase
    const questionsToInsert = aiResponse.map((q: RawQuestion) => ({
      theme_id: theme.id,
      enonce: q.enonce,
      options: q.options,
      bonne_reponse: q.bonne_reponse,
      explication: q.explication,
      niveau: niveau,
    }));

    const { error: insertError } = await supabase
      .from('questions')
      .insert(questionsToInsert);

    if (insertError) throw insertError;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        source: usedProvider,
        questions_count: questionsToInsert.length,
      }),
    };
  } catch (error: unknown) {
    console.error('Function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};
