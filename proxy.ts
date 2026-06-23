import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lista de palavras reservadas da aplicação que não devem ser tratadas como slugs de redirect
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

/**
 * Proxy do Next.js 16 para triagem de domínios (White-Label Routing)
 * O proxy é executado antes de qualquer renderização no servidor.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hostname = request.headers.get('host') || request.nextUrl.hostname;

  // Remover a porta se existir (ex.: localhost:3000 -> localhost)
  const cleanHost = hostname.split(':')[0];

  // Ignorar validação de domínio em ambiente de desenvolvimento local
  if (cleanHost === 'localhost' || cleanHost === '127.0.0.1' || cleanHost.startsWith('192.168.')) {
    return NextResponse.next();
  }

  // Obter domínios configurados nas variáveis de ambiente
  let shortDomainHost = 'brandshort.com.br';
  try {
    shortDomainHost = new URL(process.env.NEXT_PUBLIC_SHORT_DOMAIN || 'https://brandshort.com.br').hostname;
  } catch {}

  let appDomainHost = 'app.brandshort.com.br';
  try {
    appDomainHost = new URL(process.env.NEXT_PUBLIC_APP_DOMAIN || 'https://app.brandshort.com.br').hostname;
  } catch {}

  // Normalizar removendo o prefixo www. para comparação robusta
  const hostWithoutWww = cleanHost.replace(/^www\./i, '');
  const shortDomainWithoutWww = shortDomainHost.replace(/^www\./i, '');
  const appDomainWithoutWww = appDomainHost.replace(/^www\./i, '');

  const isShortDomain = hostWithoutWww === shortDomainWithoutWww;
  const isAppDomain = hostWithoutWww === appDomainWithoutWww;

  // 1. REGRAS PARA O DOMÍNIO CURTO (brandshort.com.br)
  if (isShortDomain) {
    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0]?.toLowerCase();

    // Se acessar a raiz (/) ou rotas de gerenciamento do painel no domínio curto,
    // redirecionar o usuário para o domínio correspondente no app/painel.
    if (
      pathname === '/' ||
      firstSegment === 'login' ||
      firstSegment === 'dashboard' ||
      firstSegment === 'signup' ||
      firstSegment === 'register'
    ) {
      const targetUrl = new URL(pathname + search, `https://${appDomainHost}`);
      return NextResponse.redirect(targetUrl);
    }

    // Caso contrário, deixa seguir. O Next.js resolverá o slug dinâmico em app/[slug]/route.ts
    return NextResponse.next();
  }

  // 2. REGRAS PARA O DOMÍNIO DO APP (app.brandshort.com.br)
  if (isAppDomain) {
    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0]?.toLowerCase();

    // Se o usuário tentar acessar um slug curto (ex.: app.brandshort.com.br/promo)
    // diretamente no domínio do app, redirecioná-lo para o domínio curto correspondente.
    if (segments.length === 1 && firstSegment && !RESERVED_WORDS.has(firstSegment)) {
      const targetUrl = new URL(pathname + search, `https://${shortDomainHost}`);
      return NextResponse.redirect(targetUrl);
    }
  }

  return NextResponse.next();
}

// Configurar o matcher do proxy para interceptar todas as rotas relevantes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
