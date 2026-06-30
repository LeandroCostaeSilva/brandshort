'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Link2, Shield, BarChart3, Globe, Zap, Check, Sparkles, Copy, QrCode, Smartphone, Download, BarChart2, Infinity } from 'lucide-react';

export default function Home() {
  const [longUrl, setLongUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [demoError, setDemoError] = useState('');
  const [origin, setOrigin] = useState(
    process.env.NEXT_PUBLIC_SHORT_DOMAIN || 'https://www.brandshort.com.br'
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
        setOrigin(window.location.origin);
      }
    }
  }, []);

  const handleDemoShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!longUrl) return;

    setIsLoading(true);
    setDemoError('');
    setShortenedUrl('');

    try {
      const response = await fetch('/api/demo-shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: longUrl,
          customSlug: customSlug.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDemoError(data.error || 'Erro ao encurtar o link. Tente novamente.');
        return;
      }

      setShortenedUrl(`${origin}/${data.slug}`);
    } catch {
      setDemoError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setIsLoading(false);
    }
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

        {/* ENCURTADOR DEMO (sem login) */}
        <div className="w-full max-w-2xl mx-auto mb-16">
          <div className="glass-panel p-6 rounded-2xl glow-purple text-left border border-white/10 shadow-2xl">
            <h3 className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-400" />
              <span>Experimente agora, sem criar conta:</span>
            </h3>

            <form onSubmit={handleDemoShorten} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">URL Longa</label>
                <input
                  type="url"
                  value={longUrl}
                  onChange={(e) => { setLongUrl(e.target.value); setDemoError(''); }}
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
                    onChange={(e) => { setCustomSlug(e.target.value); setDemoError(''); }}
                    placeholder="ex: promo"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 rounded-xl outline-none text-sm text-zinc-200 transition-all font-mono"
                  />
                </div>
              </div>

              {demoError && (
                <div className="px-4 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs">
                  {demoError}
                </div>
              )}

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

            {/* Resultado real */}
            {shortenedUrl && (
              <div className="mt-6 pt-6 border-t border-white/5 space-y-3 animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-500 mb-1 font-medium">Seu Link Curto de Marca:</div>
                    <a
                      href={shortenedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 font-semibold font-mono break-all hover:underline hover:text-violet-300 transition-colors"
                    >
                      {shortenedUrl}
                    </a>
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
                <p className="text-[11px] text-zinc-600">
                  Link demo válido por 24 horas. <Link href="/login?signup=true" className="text-violet-500 hover:text-violet-400 underline">Crie uma conta grátis</Link> para links permanentes e analytics.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ===== SEÇÃO QR CODE CTA ===== */}
        <section className="w-full py-4 mb-8">
          <div className="relative rounded-3xl overflow-hidden border border-violet-500/20 bg-gradient-to-br from-violet-950/60 via-zinc-900/80 to-indigo-950/60 shadow-2xl">

            {/* Luzes internas */}
            <div className="absolute top-[-30%] right-[-10%] w-[50%] h-[160%] bg-violet-600/10 blur-[80px] pointer-events-none rounded-full" />
            <div className="absolute bottom-[-20%] left-[-5%] w-[40%] h-[100%] bg-indigo-500/10 blur-[60px] pointer-events-none rounded-full" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 p-8 md:p-12">

              {/* Lado esquerdo: mockup QR Code */}
              <div className="shrink-0 flex flex-col items-center gap-3.5">
                <div className="relative group">
                  {/* Card QR Code mockup */}
                  <div className="relative w-48 h-56 bg-white rounded-3xl shadow-2xl shadow-violet-500/10 p-4.5 flex flex-col items-center justify-between border border-zinc-100/80 overflow-hidden">
                    {/* Linha laser animada de escaneamento */}
                    <div className="absolute left-4.5 right-4.5 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent shadow-[0_0_10px_#8b5cf6,0_0_4px_#a855f7] animate-scan pointer-events-none z-10" style={{ top: '18px' }} />

                    {/* QR Code SVG premium */}
                    <svg viewBox="0 0 100 100" className="w-36 h-36 text-zinc-900 transition-transform duration-500 group-hover:scale-[1.02]" fill="currentColor">
                      {/* Top-Left Finder */}
                      <rect x="0" y="0" width="28" height="28" rx="6" />
                      <rect x="4" y="4" width="20" height="20" rx="4" fill="white" />
                      <rect x="8" y="8" width="12" height="12" rx="2" />

                      {/* Top-Right Finder */}
                      <rect x="72" y="0" width="28" height="28" rx="6" />
                      <rect x="76" y="4" width="20" height="20" rx="4" fill="white" />
                      <rect x="80" y="8" width="12" height="12" rx="2" />

                      {/* Bottom-Left Finder */}
                      <rect x="0" y="72" width="28" height="28" rx="6" />
                      <rect x="4" y="76" width="20" height="20" rx="4" fill="white" />
                      <rect x="8" y="80" width="12" height="12" rx="2" />

                      {/* Dados / Módulos do QR code com visual arredondado premium */}
                      <rect x="34" y="2" width="6" height="6" rx="2" />
                      <rect x="44" y="2" width="6" height="6" rx="2" />
                      <rect x="54" y="2" width="6" height="6" rx="2" />
                      <rect x="62" y="8" width="6" height="6" rx="2" />
                      
                      <rect x="34" y="12" width="6" height="6" rx="2" />
                      <rect x="44" y="12" width="14" height="6" rx="2" />
                      <rect x="62" y="18" width="6" height="14" rx="2" />

                      <rect x="34" y="22" width="6" height="6" rx="2" />
                      <rect x="44" y="22" width="6" height="6" rx="2" />

                      {/* Meio horizontal */}
                      <rect x="2" y="34" width="6" height="6" rx="2" />
                      <rect x="12" y="34" width="6" height="6" rx="2" />
                      <rect x="22" y="34" width="14" height="6" rx="2" />
                      <rect x="44" y="34" width="6" height="6" rx="2" />
                      <rect x="54" y="34" width="14" height="6" rx="2" />
                      <rect x="72" y="34" width="6" height="6" rx="2" />
                      <rect x="82" y="34" width="16" height="6" rx="2" />

                      <rect x="2" y="44" width="14" height="6" rx="2" />
                      <rect x="22" y="44" width="6" height="6" rx="2" />
                      <rect x="72" y="44" width="6" height="6" rx="2" />
                      <rect x="82" y="44" width="16" height="6" rx="2" />

                      <rect x="2" y="54" width="6" height="6" rx="2" />
                      <rect x="12" y="54" width="6" height="6" rx="2" />
                      <rect x="22" y="54" width="6" height="6" rx="2" />
                      <rect x="34" y="54" width="14" height="6" rx="2" />
                      <rect x="54" y="54" width="6" height="6" rx="2" />
                      <rect x="62" y="54" width="14" height="6" rx="2" />
                      <rect x="82" y="54" width="6" height="14" rx="2" />

                      <rect x="34" y="64" width="6" height="6" rx="2" />
                      <rect x="44" y="64" width="6" height="6" rx="2" />
                      <rect x="54" y="64" width="14" height="6" rx="2" />
                      <rect x="72" y="64" width="6" height="6" rx="2" />

                      {/* Parte inferior */}
                      <rect x="34" y="74" width="6" height="6" rx="2" />
                      <rect x="44" y="74" width="14" height="6" rx="2" />
                      <rect x="62" y="74" width="6" height="6" rx="2" />
                      <rect x="72" y="74" width="6" height="6" rx="2" />
                      <rect x="82" y="74" width="16" height="6" rx="2" />

                      <rect x="34" y="84" width="14" height="6" rx="2" />
                      <rect x="54" y="84" width="6" height="6" rx="2" />
                      <rect x="62" y="84" width="6" height="6" rx="2" />
                      <rect x="72" y="84" width="6" height="6" rx="2" />
                      <rect x="82" y="84" width="6" height="6" rx="2" />
                      <rect x="92" y="84" width="6" height="6" rx="2" />

                      {/* Círculo com Logo central */}
                      <circle cx="50" cy="50" r="14" fill="white" />
                      <circle cx="50" cy="50" r="11" fill="#7c3aed" />
                      
                      {/* Ícone de link no centro */}
                      <path 
                        d="M48 45.5 a2 2 0 0 0-2.8 2.8 l1 1 a0.7 0.7 0 0 0 1-1 l-1-1 a0.6 0.6 0 0 1 0.8-0.8 l1.8 1.8 a0.6 0.6 0 0 1 0 0.8 l-1 1 a0.7 0.7 0 0 0 1 1 l1-1 a2 2 0 0 0 0-2.8 Z 
                           M52 48.5 a0.7 0.7 0 0 0-1 0 l-1 1 a0.7 0.7 0 0 0 1 1 l1-1 a0.6 0.6 0 0 1 0.8 0.8 l-1.8 1.8 a0.6 0.6 0 0 1-0.8 0 l-1-1 a0.7 0.7 0 0 0-1 1 l1 1 a2 2 0 0 0 2.8-2.8 Z" 
                        fill="white" 
                      />
                    </svg>

                    <div className="w-full flex flex-col items-center gap-1 mt-1">
                      <div className="w-full h-px bg-zinc-100/80" />
                      <span className="text-[10px] font-bold text-zinc-500 font-mono tracking-tight text-center leading-none">
                        brandshort.com.br
                      </span>
                      <span className="text-[9px] font-medium text-violet-600 font-mono tracking-tight text-center leading-none mt-0.5">
                        /sua-promo
                      </span>
                    </div>
                  </div>

                  {/* Badge "GRÁTIS" com visual mais moderno */}
                  <span className="absolute -top-2.5 -right-2.5 px-3 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-black rounded-full shadow-lg shadow-violet-500/30 tracking-wider border border-white/20 select-none animate-pulse-subtle">
                    GRÁTIS
                  </span>

                  {/* Glow sob o card */}
                  <div className="absolute inset-0 rounded-3xl bg-violet-500/15 blur-xl -z-10 scale-90 translate-y-3 group-hover:scale-95 group-hover:bg-violet-500/25 transition-all duration-500" />
                </div>

                {/* Ícone de scan */}
                <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Aponte a câmera e acesse</span>
                </div>
              </div>


              {/* Lado direito: texto e CTA */}
              <div className="flex-1 text-center md:text-left">
                {/* Badge superior */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/25 text-[11px] font-semibold text-violet-300 mb-4">
                  <QrCode className="w-3 h-3" />
                  <span>Exclusivo para contas gratuitas</span>
                </div>

                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-3">
                  QR Code instantâneo<br className="hidden sm:block" />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-300"> para cada link.</span>
                </h2>

                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-6 max-w-md">
                  Conecte o mundo físico ao digital. Gere, baixe e compartilhe o QR Code de qualquer link encurtado — em impressões, embalagens, eventos ou redes sociais.
                </p>

                {/* Feature chips */}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-8">
                  {[
                    { icon: Download, label: 'Download em PNG' },
                    { icon: BarChart2, label: 'Analytics por clique' },
                    { icon: Infinity, label: 'Links ilimitados' },
                    { icon: QrCode, label: 'QR por link' },
                  ].map(({ icon: Icon, label }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-zinc-300"
                    >
                      <Icon className="w-3.5 h-3.5 text-violet-400" />
                      {label}
                    </span>
                  ))}
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Link
                    href="/login?signup=true"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-600/25"
                  >
                    <span>Criar Conta Grátis</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white rounded-xl text-sm font-medium transition-all"
                  >
                    Já tenho uma conta
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

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
