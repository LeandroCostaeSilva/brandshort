import { getAdminClient } from './supabase';

const RESERVED_WORDS = new Set([
  'api',
  'admin',
  'login',
  'logout',
  'register',
  'signup',
  'signin',
  'dashboard',
  'settings',
  'profile',
  'auth',
  '404',
  'links',
  'clicks',
  'analytics',
  'favicon.ico',
  '_next',
  'assets',
  'public',
  'status',
  'health',
  'config',
  'domain',
]);

const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Valida se um slug customizado atende às regras de formato e palavras reservadas.
 */
export function validateCustomSlug(slug: string): { isValid: boolean; error?: string } {
  if (!slug) {
    return { isValid: false, error: 'O slug não pode ser vazio.' };
  }

  // Comprimento entre 3 e 32 caracteres
  if (slug.length < 3 || slug.length > 32) {
    return { isValid: false, error: 'O slug deve conter entre 3 e 32 caracteres.' };
  }

  // Regex para permitir apenas letras, números, hífens e underlines
  const regex = /^[a-zA-Z0-9-_]+$/;
  if (!regex.test(slug)) {
    return { isValid: false, error: 'O slug deve conter apenas letras, números, hífens (-) e sublinhados (_).' };
  }

  // Checar palavras reservadas
  if (RESERVED_WORDS.has(slug.toLowerCase())) {
    return { isValid: false, error: 'Este slug é uma palavra reservada e não pode ser utilizado.' };
  }

  return { isValid: true };
}

/**
 * Gera um slug aleatório de tamanho especificado usando o alfabeto Base62.
 */
export function generateRandomSlug(length = 7): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * BASE62_ALPHABET.length);
    result += BASE62_ALPHABET.charAt(randomIndex);
  }
  return result;
}

/**
 * Gera um slug único no banco de dados com limite de 3 tentativas de retry em caso de colisão.
 */
export async function generateUniqueSlug(length = 7): Promise<string> {
  const supabase = getAdminClient();
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const slug = generateRandomSlug(length);

    // Verifica se já existe esse slug ativo ou inativo
    const { data, error } = await supabase
      .from('links')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      throw new Error(`Erro ao verificar unicidade do slug: ${error.message}`);
    }

    if (!data) {
      // Slug disponível!
      return slug;
    }

    attempts++;
  }

  // Se colidir 3 vezes, tenta gerar com tamanho ligeiramente maior (+1 caractere) para diluir a colisão
  return generateUniqueSlug(length + 1);
}

/**
 * Verifica se um slug específico já existe no banco.
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('links')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao verificar disponibilidade do slug: ${error.message}`);
  }

  return !data;
}
