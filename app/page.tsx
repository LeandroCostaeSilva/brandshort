'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Link2, Shield, BarChart3, Globe, Zap, Check, Sparkles, Copy, QrCode } from 'lucide-react';

export default function Home() {
  const [longUrl, setLongUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('https://www.brandshort.com.br');

  // Detectar se está rodando localmente (localhost ou IP local) para permitir testes funcionais
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
        setOrigin(window.location.origin);
      }
    }
  }, []);



  const handleMockShorten = (e: React.FormEvent) => {
    e.preventDefault();
    if (!longUrl) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const slug = customSlug || 'x9d8f3';
      setShortenedUrl(`${origin}/${slug}`);

      // Salvar no localStorage para que a página 404 consiga redirecionar localmente no teste de desenvolvimento
      try {
        const demoLinks = JSON.parse(localStorage.getItem('brandshort_demo_links') || '[]');
        const filtered = demoLinks.filter((l: any) => l.slug !== slug);
        filtered.unshift({
          id: `mock-${Date.now()}`,
          slug,
          original_url: longUrl,
          title: 'Link de Teste Rápido',
          is_active: true,
          status: 'active',
          is_deleted: false,
          created_at: new Date().toISOString(),
          clicks_count: 0
        });
        localStorage.setItem('brandshort_demo_links', JSON.stringify(filtered));
      } catch (err) {
        console.error('Erro ao salvar link demo localmente:', err);
      }
    }, 800);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortenedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col bg-zinc-950 font-sans">
      
      {/* Luzes de Fundo (Gradients) */}
      <div className="absolute top-[-10%] left-[-20%] w-[70vw] h-[70vw] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Link2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
            BrandShort
          </span>
        </div>

        <nav className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Entrar
          </Link>
          <Link 
            href="/login?signup=true" 
            className="px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 rounded-xl transition-all shadow-sm"
          >
            Criar Conta Grátis
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative flex-1 flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto z-10 py-12 md:py-24">
        
        {/* Badge superior */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-300 mb-8 animate-pulse-subtle">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Encurtador Profissional com Marca Própria</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
          Seus links. <br className="sm:hidden" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-300 to-purple-400">
            Sua própria marca.
          </span>
        </h1>

        <p className="max-w-2xl text-zinc-400 text-lg sm:text-xl leading-relaxed mb-12">
          Substitua links genéricos e suspeitos como <strong>bit.ly/3x8f2d</strong> por endereços confiáveis com seu domínio próprio <strong>www.brandshort.com.br/promo</strong>. Ganhe autoridade e controle.
        </p>

        {/* MOCK INTERATIVO DO ENCURTADOR */}
        <div className="w-full max-w-2xl mx-auto mb-16">
          <div className="glass-panel p-6 rounded-2xl glow-purple text-left border border-white/10 shadow-2xl">
            <h3 className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-400" />
              <span>Experimente na hora:</span>
            </h3>

            <form onSubmit={handleMockShorten} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">URL Longa (limpe o campo antes de inserir o link)</label>
                <input
                  type="url"
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  placeholder="https://sua-pagina-longa.com/com-parametros-chatos"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 rounded-xl outline-none text-sm text-zinc-200 transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Domínio White-label</label>
                  <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-zinc-400 select-none flex items-center gap-1.5 font-mono">
                    <Globe className="w-4 h-4 text-zinc-600" />
                    {origin.replace(/^https?:\/\//, '')}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Slug Customizado (opcional)</label>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="ex: promo"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 rounded-xl outline-none text-sm text-zinc-200 transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-violet-600/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Encurtar com Marca</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Resultado do Mock */}
            {shortenedUrl && (
              <div className="mt-6 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 animate-fadeIn">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-zinc-500 mb-1 font-medium">Seu Link Curto de Marca:</div>
                  <div className="text-violet-400 font-semibold font-mono break-all">{shortenedUrl}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-zinc-400" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                  <Link
                    href="/login?signup=true"
                    className="px-4 py-2.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/20 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Salvar no Painel</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bento Grid de Funcionalidades */}
        <section className="w-full py-12 text-left">
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white text-center mb-12">
            Tudo o que sua marca precisa para decolar
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bloco 1 - Domínio próprio */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-violet-500/20 transition-all flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                <Globe className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">Domínio Próprio</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Configure seu domínio curto customizado (ex. <strong>marca.link</strong>) com SSL automático da Vercel. Links que reforçam sua marca.
              </p>
            </div>

            {/* Bloco 2 - Analytics em Tempo Real */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-violet-500/20 transition-all flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                <BarChart3 className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">Analytics Completo</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Métricas detalhadas em tempo real. Identifique origens de tráfego (referrers), navegadores, países e dispositivos de todos os cliques.
              </p>
            </div>

            {/* Bloco 3 - Segurança e Privacidade */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-violet-500/20 transition-all flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                <Shield className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">Conformidade LGPD</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Segurança avançada através de criptografia e proteção com RLS do Supabase. Minimização automática de IPs para proteção de privacidade.
              </p>
            </div>
            
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>
            &copy; {new Date().getFullYear()} BrandShort. Criado com maestria profissional.
          </div>
          <div className="flex gap-4">
            <span>Next.js App Router</span>
            <span>Supabase Auth & DB</span>
            <span>Tailwind CSS v4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
