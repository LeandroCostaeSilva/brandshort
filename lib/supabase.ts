import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Cliente Supabase para uso no Browser (Frontend)
let clientSupabase: SupabaseClient | null = null;

export function getClientClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Fallback seguro para o lado do servidor durante o build/SSR
    return createClient(supabaseUrl, supabaseAnonKey);
  }

  if (!clientSupabase) {
    clientSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return clientSupabase;
}

// Cliente Supabase para uso nas API Routes (Server Side) com RLS ativado
// Ele extrai o token JWT enviado no Header Authorization do cliente
export function getServerClient(req: Request): SupabaseClient {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    // Se não houver token, retorna o client com a chave anônima (RLS ativo, sem usuário logado)
    return createClient(supabaseUrl, supabaseAnonKey);
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
    },
  });
}

// Cliente Administrativo (Server Side) que ignora o RLS
// Usado estritamente para o redirecionamento público de slugs e contagem de cliques
export function getAdminClient(): SupabaseClient {
  if (!supabaseServiceKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY não está configurado.');
  }
  return createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}
