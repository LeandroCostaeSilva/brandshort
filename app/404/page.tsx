'use client';

import React, { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Link2, AlertTriangle, ArrowLeft, HelpCircle, CalendarOff, ShieldAlert } from 'lucide-react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || '';
  const reason = searchParams.get('reason') || '';

  // Interceptar redirecionamento local para modo demonstração ou testes locais
  useEffect(() => {
    if (slug) {
      try {
        const demoLinks = JSON.parse(localStorage.getItem('brandshort_demo_links') || '[]');
        const match = demoLinks.find((l: any) => l.slug.toLowerCase() === slug.toLowerCase());
        if (match && match.original_url) {
          window.location.href = match.original_url;
        }
      } catch (err) {
        console.error('Erro ao tentar ler links demo para redirecionar:', err);
      }
    }
  }, [slug]);

  // Definir mensagem contextual com base no motivo (reason)
  let title = 'Link Indisponível';
  let description = 'O link que você está tentando acessar não está disponível no momento.';
  let Icon = AlertTriangle;
  let iconColor = 'text-amber-400 border-amber-500/20 bg-amber-500/10';

  if (reason === 'not_found') {
    title = 'Link Não Encontrado';
    description = `O link curto "/${slug}" não foi encontrado. Verifique a digitação ou consulte o criador do link.`;
    Icon = HelpCircle;
    iconColor = 'text-zinc-400 border-zinc-500/20 bg-zinc-500/10';
  } else if (reason === 'inactive') {
    title = 'Link Desativado';
    description = `O link curto "/${slug}" foi desativado temporariamente pela organização proprietária.`;
    Icon = ShieldAlert;
    iconColor = 'text-rose-400 border-rose-500/20 bg-rose-500/10';
  } else if (reason === 'expired') {
    title = 'Link Expirado';
    description = `O período de validade do link curto "/${slug}" foi encerrado e ele não está mais ativo.`;
    Icon = CalendarOff;
    iconColor = 'text-orange-400 border-orange-500/20 bg-orange-500/10';
  } else if (reason === 'exception' || reason === 'error') {
    title = 'Erro de Resolução';
    description = 'Ocorreu uma falha técnica ao tentar resolver este link de marca. Tente novamente mais tarde.';
    Icon = AlertTriangle;
    iconColor = 'text-rose-400 border-rose-500/20 bg-rose-500/10';
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 px-6 py-12">
      {/* Background neon lights */}
      <div className="absolute top-[30%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-violet-600/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10 text-center">
        
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg">
            <Link2 className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-white tracking-tight">BrandShort</span>
        </div>

        {/* Card do 404 */}
        <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6">
          <div className={`w-14 h-14 rounded-2xl ${iconColor} border flex items-center justify-center mx-auto shadow-md`}>
            <Icon className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-xl font-bold text-white">{title}</h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">{description}</p>
          </div>

          {slug && (
            <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-xs font-mono text-zinc-500 inline-block">
              slug: <span className="text-violet-400 font-semibold">{slug}</span>
            </div>
          )}

          <div className="pt-2">
            <Link
              href="/"
              className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ir para a Página Inicial</span>
            </Link>
          </div>
        </div>

        {/* Footer brand info */}
        <p className="text-[10px] text-zinc-600 mt-8">Powered by BrandShort White-label redirect engine.</p>

      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500">
        <span className="w-10 h-10 border-4 border-violet-600/30 border-t-violet-500 rounded-full animate-spin mb-4" />
        <p className="text-sm">Carregando detalhes do erro...</p>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
