'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getClientClient } from '@/lib/supabase';
import { Link2, Mail, Lock, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getClientClient();

  // Ler o parâmetro ?signup=true para abrir diretamente na aba de cadastro
  const isSignUpDefault = searchParams.get('signup') === 'true';

  const [isSignUp, setIsSignUp] = useState(isSignUpDefault);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showDemoButton, setShowDemoButton] = useState(false);

  // Sincronizar estado caso mude o query param da URL
  useEffect(() => {
    setIsSignUp(searchParams.get('signup') === 'true');
  }, [searchParams]);

  // Se já houver sessão ativa (ou modo demo), redireciona diretamente para o dashboard
  useEffect(() => {
    const isDemo = sessionStorage.getItem('brandshort_demo_mode') === 'true';
    if (isDemo) {
      router.push('/dashboard');
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard');
      }
    });
  }, [supabase, router]);

  const handleStartDemo = () => {
    sessionStorage.setItem('brandshort_demo_mode', 'true');
    // Popular alguns links mockados no localStorage para ficar realista
    const currentDemoLinks = localStorage.getItem('brandshort_demo_links');
    if (!currentDemoLinks) {
      const mockLinks = [
        {
          id: 'demo-link-1',
          slug: 'promo-inverno',
          original_url: 'https://sua-loja.com.br/promocao-de-inverno-2026?utm_source=instagram',
          title: 'Campanha de Inverno Instagram',
          is_active: true,
          status: 'active',
          is_deleted: false,
          expires_at: null,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          clicks_count: 42
        },
        {
          id: 'demo-link-2',
          slug: 'ebook-gratis',
          original_url: 'https://site.com.br/baixar-ebook-marketing-digital-2026',
          title: 'Ebook Grátis Marketing',
          is_active: true,
          status: 'active',
          is_deleted: false,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          clicks_count: 128
        },
        {
          id: 'demo-link-3',
          slug: 'desconto-10',
          original_url: 'https://sua-plataforma.com/checkout?coupon=10OFF',
          title: 'Cupom 10% Desconto',
          is_active: false,
          status: 'inactive',
          is_deleted: false,
          expires_at: null,
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          clicks_count: 15
        }
      ];
      localStorage.setItem('brandshort_demo_links', JSON.stringify(mockLinks));
    }

    setSuccessMsg('Entrando no modo de demonstração...');
    setTimeout(() => {
      router.push('/dashboard');
      router.refresh();
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setShowDemoButton(false);

    try {
      if (isSignUp) {
        // Fluxo de Cadastro
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data.user && data.session === null) {
          setSuccessMsg('Cadastro realizado! Verifique seu email para confirmar o cadastro (ou efetue login diretamente se a confirmação de email estiver desativada no Supabase).');
          // Limpar form
          setEmail('');
          setPassword('');
        } else if (data.session) {
          // Autologin no cadastro
          setSuccessMsg('Cadastro realizado com sucesso!');
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 1000);
        }
      } else {
        // Fluxo de Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message === 'Invalid login credentials' ? 'Credenciais inválidas. Verifique seu e-mail e senha.' : error.message);
        } else if (data.session) {
          setSuccessMsg('Login efetuado com sucesso!');
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 1000);
        }
      }
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      const isNetworkError = err instanceof TypeError || err.message?.includes('Failed to fetch') || err.toString().includes('fetch');
      if (isNetworkError) {
        setErrorMsg('Erro de conexão: Não foi possível conectar ao servidor do Supabase. Certifique-se de configurar as credenciais reais no arquivo .env.local (NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY). Se quiser testar o design e fluxos agora mesmo sem banco de dados, clique no botão de Demonstração abaixo!');
        setShowDemoButton(true);
      } else {
        setErrorMsg('Ocorreu um erro inesperado. Tente novamente mais tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 px-6 py-12">
      {/* Gradiêntes no fundo */}
      <div className="absolute top-[20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[45vw] h-[45vw] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Link2 className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h2 className="font-display text-2xl font-bold text-white tracking-tight">
            {isSignUp ? 'Criar sua conta' : 'Entrar no BrandShort'}
          </h2>
          <p className="text-zinc-500 text-sm mt-1.5 text-center">
            {isSignUp 
              ? 'Comece a encurtar links com sua própria marca hoje mesmo.' 
              : 'Gerencie seus links curtos de marca e veja os cliques.'}
          </p>
        </div>

        {/* Formulário */}
        <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-xl">
          
          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-start gap-2.5 animate-fadeIn">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@short.com.br"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 rounded-xl outline-none text-sm text-zinc-200 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 rounded-xl outline-none text-sm text-zinc-200 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-violet-600/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Criar Conta' : 'Entrar'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {showDemoButton && (
              <button
                type="button"
                onClick={handleStartDemo}
                className="w-full py-3 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/20 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
              >
                <span>Iniciar Modo de Demonstração</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Toggle Login/Cadastro */}
          <div className="mt-6 text-center space-y-3">
            <div>
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-xs text-zinc-500 hover:text-violet-400 font-medium transition-colors cursor-pointer"
              >
                {isSignUp 
                  ? 'Já possui uma conta? Faça login aqui' 
                  : 'Não tem uma conta ainda? Cadastre-se grátis'}
              </button>
            </div>

            <div className="pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={handleStartDemo}
                className="text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors cursor-pointer"
              >
                Entrar em Modo de Demonstração (Sem Banco de Dados)
              </button>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Voltar para a página inicial
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500">
        <span className="w-10 h-10 border-4 border-violet-600/30 border-t-violet-500 rounded-full animate-spin mb-4" />
        <p className="text-sm">Carregando autenticação...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
