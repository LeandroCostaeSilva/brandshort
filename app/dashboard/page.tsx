'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Link2, LogOut, Plus, Search, Filter, Calendar, Copy, Check, 
  QrCode, Trash2, Archive, ToggleLeft, ToggleRight, ExternalLink, 
  ArrowLeft, ArrowRight, BarChart3, Clock, HelpCircle, X, Download
} from 'lucide-react';
import { getClientClient } from '@/lib/supabase';

interface LinkItem {
  id: string;
  slug: string;
  original_url: string;
  title: string | null;
  is_active: boolean;
  status: 'active' | 'inactive' | 'expired' | 'archived';
  is_deleted: boolean;
  expires_at: string | null;
  created_at: string;
  clicks_count: number;
}

export default function Dashboard() {
  const router = useRouter();
  const supabase = getClientClient();

  // Estados de Autenticação e Sessão
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // Estados do Formulário de Criação
  const [originalUrl, setOriginalUrl] = useState('');
  const [title, setTitle] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdLink, setCreatedLink] = useState<string>('');

  // Estados de Listagem e Filtros
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [totalLinks, setTotalLinks] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Estados de Métricas Resumo (Acumuladas)
  const [summaryStats, setSummaryStats] = useState({
    totalCreated: 0,
    totalActive: 0,
    totalClicks: 0
  });

  // Estados de Ações e Modais
  const [copiedId, setCopiedId] = useState<string>('');
  const [activeQrCodeUrl, setActiveQrCodeUrl] = useState<string | null>(null);
  const [activeQrCodeSlug, setActiveQrCodeSlug] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Domínio de exibição curto
  const shortDomain = process.env.NEXT_PUBLIC_SHORT_DOMAIN || 'http://localhost:3000';

  // Estado que sinaliza modo de demonstração local
  const [isDemoMode, setIsDemoMode] = useState(false);

  // 1. Validar e gerenciar a sessão do usuário
  useEffect(() => {
    async function checkSession() {
      // Verificar se o usuário optou pelo modo demo
      const isDemo = typeof window !== 'undefined' && sessionStorage.getItem('brandshort_demo_mode') === 'true';
      if (isDemo) {
        setIsDemoMode(true);
        setUser({ email: 'demo@brandshort.com.br' });
        setToken('demo-token');
        setIsSessionLoading(false);
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          router.push('/login');
        } else {
          setUser(session.user);
          setToken(session.access_token);
        }
      } catch (err) {
        console.error('Erro de sessão:', err);
        router.push('/login');
      } finally {
        setIsSessionLoading(false);
      }
    }
    checkSession();

    // Ouvir alterações no estado da sessão (se não estiver em modo demo)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const isDemo = typeof window !== 'undefined' && sessionStorage.getItem('brandshort_demo_mode') === 'true';
      if (isDemo) return;

      if (session) {
        setUser(session.user);
        setToken(session.access_token);
      } else {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  // 2. Função para buscar histórico de links da API com os filtros aplicados
  const fetchLinksHistory = useCallback(async () => {
    if (!token) return;
    setIsLoadingLinks(true);

    // Bypassar para localStorage se for modo de demonstração
    if (sessionStorage.getItem('brandshort_demo_mode') === 'true') {
      try {
        let demoLinks: LinkItem[] = JSON.parse(localStorage.getItem('brandshort_demo_links') || '[]');
        
        // Aplicar filtros locais
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          demoLinks = demoLinks.filter(l => 
            l.slug.toLowerCase().includes(term) || 
            (l.title && l.title.toLowerCase().includes(term)) ||
            l.original_url.toLowerCase().includes(term)
          );
        }

        if (statusFilter !== 'all') {
          const now = new Date();
          demoLinks = demoLinks.filter(l => {
            if (statusFilter === 'active') return l.is_active && !l.is_deleted && (!l.expires_at || new Date(l.expires_at) > now);
            if (statusFilter === 'inactive') return !l.is_active && !l.is_deleted;
            if (statusFilter === 'expired') return l.is_active && !l.is_deleted && l.expires_at && new Date(l.expires_at) <= now;
            if (statusFilter === 'archived') return l.is_deleted;
            return true;
          });
        } else {
          // Filtro padrão 'all' não mostra os soft-deleted de forma ativa a menos que seja especifico
          // Mas no histórico completo do perfil do PRD, mostramos também se o usuário não filtrou
          // Vamos seguir o comportamento padrão de mostrar todos
        }

        if (startDate) {
          const start = new Date(startDate);
          demoLinks = demoLinks.filter(l => new Date(l.created_at) >= start);
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          demoLinks = demoLinks.filter(l => new Date(l.created_at) <= end);
        }

        // Simular paginação
        const limit = 6;
        const total = demoLinks.length;
        const pages = Math.ceil(total / limit) || 1;
        const offset = (page - 1) * limit;

        setLinks(demoLinks.slice(offset, offset + limit));
        setTotalPages(pages);
        setTotalLinks(total);
      } catch (err) {
        console.error('Erro no parser do localStorage no modo demo:', err);
      } finally {
        setIsLoadingLinks(false);
      }
      return;
    }

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '6',
        search: searchTerm,
        status: statusFilter,
        startDate,
        endDate
      });

      const response = await fetch(`/api/links/history?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setLinks(data.links);
        setTotalPages(data.pagination.pages);
        setTotalLinks(data.pagination.total);
      } else {
        console.error('Erro ao buscar histórico:', data.error);
      }
    } catch (err) {
      console.error('Erro na requisição de histórico:', err);
    } finally {
      setIsLoadingLinks(false);
    }
  }, [token, page, searchTerm, statusFilter, startDate, endDate]);

  // 3. Função para carregar as métricas de resumo (resgata todos sem paginação para contar)
  const fetchSummaryStats = useCallback(async () => {
    if (!token) return;

    if (sessionStorage.getItem('brandshort_demo_mode') === 'true') {
      const demoLinks: LinkItem[] = JSON.parse(localStorage.getItem('brandshort_demo_links') || '[]');
      const totalCreated = demoLinks.length;
      const totalActive = demoLinks.filter(l => l.status === 'active' && !l.is_deleted).length;
      const totalClicks = demoLinks.reduce((acc, curr) => acc + (curr.clicks_count || 0), 0);

      setSummaryStats({
        totalCreated,
        totalActive,
        totalClicks
      });
      return;
    }

    try {
      const response = await fetch('/api/links/history?limit=1000&status=all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok && data.links) {
        const list: LinkItem[] = data.links;
        const totalCreated = list.length;
        const totalActive = list.filter(l => l.status === 'active').length;
        const totalClicks = list.reduce((acc, curr) => acc + curr.clicks_count, 0);

        setSummaryStats({
          totalCreated,
          totalActive,
          totalClicks
        });
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas de resumo:', err);
    }
  }, [token]);

  // Sincronizar listagem ao alterar token, filtros ou página
  useEffect(() => {
    if (token) {
      fetchLinksHistory();
    }
  }, [fetchLinksHistory, token]);

  // Atualizar estatísticas gerais periodicamente ou quando um link for modificado
  useEffect(() => {
    if (token) {
      fetchSummaryStats();
    }
  }, [fetchSummaryStats, token, links]);

  // 4. Logout
  const handleLogout = async () => {
    if (isDemoMode) {
      sessionStorage.removeItem('brandshort_demo_mode');
      router.push('/login');
      return;
    }

    await supabase.auth.signOut();
    router.push('/login');
  };

  // 5. Encurtar Link (Submit do Form)
  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalUrl) return;

    setIsCreating(true);
    setCreateError('');
    setCreatedLink('');

    // Bypassar para localStorage se for modo de demonstração
    if (isDemoMode) {
      setTimeout(() => {
        try {
          const demoLinks: LinkItem[] = JSON.parse(localStorage.getItem('brandshort_demo_links') || '[]');
          
          let slug = customSlug.trim();
          if (slug) {
            // Verificar unicidade na lista demo
            if (demoLinks.some(l => l.slug.toLowerCase() === slug.toLowerCase())) {
              setCreateError('Este slug já está em uso.');
              setIsCreating(false);
              return;
            }
          } else {
            // Gerar aleatório Base62 simulado
            slug = Math.random().toString(36).substring(2, 9);
          }

          const newLink: LinkItem = {
            id: `demo-${Math.random().toString(36).substring(7)}`,
            slug,
            original_url: originalUrl,
            title: title.trim() || null,
            is_active: true,
            status: 'active',
            is_deleted: false,
            expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
            created_at: new Date().toISOString(),
            clicks_count: 0
          };

          demoLinks.unshift(newLink);
          localStorage.setItem('brandshort_demo_links', JSON.stringify(demoLinks));
          
          const fullShortUrl = `${shortDomain}/${slug}`;
          setCreatedLink(fullShortUrl);

          setOriginalUrl('');
          setTitle('');
          setCustomSlug('');
          setExpiresAt('');

          fetchLinksHistory();
        } catch (err) {
          setCreateError('Erro ao criar link simulado.');
        } finally {
          setIsCreating(false);
        }
      }, 500);
      return;
    }

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          originalUrl,
          title: title || undefined,
          customSlug: customSlug || undefined,
          expiresAt: expiresAt || undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        const fullShortUrl = `${shortDomain}/${data.link.slug}`;
        setCreatedLink(fullShortUrl);
        
        // Resetar form
        setOriginalUrl('');
        setTitle('');
        setCustomSlug('');
        setExpiresAt('');

        // Recarregar histórico
        fetchLinksHistory();
      } else {
        setCreateError(data.error || 'Erro ao encurtar o link.');
      }
    } catch (err) {
      setCreateError('Erro de conexão com a API.');
    } finally {
      setIsCreating(false);
    }
  };

  // 6. Alternar Status do Link (Ativar/Desativar)
  const handleToggleActive = async (link: LinkItem) => {
    const nextActive = !link.is_active;

    if (isDemoMode) {
      const demoLinks: LinkItem[] = JSON.parse(localStorage.getItem('brandshort_demo_links') || '[]');
      const updated = demoLinks.map(l => l.id === link.id ? { 
        ...l, 
        is_active: nextActive, 
        status: nextActive ? 'active' : 'inactive' as any
      } : l);
      localStorage.setItem('brandshort_demo_links', JSON.stringify(updated));
      fetchLinksHistory();
      return;
    }

    try {
      const response = await fetch(`/api/links/${link.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          is_active: nextActive
        })
      });

      if (response.ok) {
        setLinks(prev => prev.map(l => l.id === link.id ? { ...l, is_active: nextActive, status: nextActive ? 'active' : 'inactive' } : l));
      } else {
        console.error('Erro ao atualizar status do link');
      }
    } catch (err) {
      console.error('Erro ao chamar PATCH de status:', err);
    }
  };

  // 7. Soft Delete / Arquivar
  const handleArchiveLink = async (id: string) => {
    if (!confirm('Deseja arquivar este link? Ele sairá da listagem de links ativos, mas o histórico de cliques e dados permanecerão salvos.')) return;
    
    if (isDemoMode) {
      const demoLinks: LinkItem[] = JSON.parse(localStorage.getItem('brandshort_demo_links') || '[]');
      const updated = demoLinks.map(l => l.id === id ? { 
        ...l, 
        is_deleted: true, 
        status: 'archived' as any,
        is_active: false
      } : l);
      localStorage.setItem('brandshort_demo_links', JSON.stringify(updated));
      fetchLinksHistory();
      return;
    }

    try {
      const response = await fetch(`/api/links/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchLinksHistory();
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao arquivar link.');
      }
    } catch (err) {
      console.error('Erro ao chamar DELETE (soft):', err);
    }
  };

  // 8. Hard Delete / Excluir Definitivamente
  const handleHardDeleteLink = async (id: string) => {
    if (!confirm('ATENÇÃO: Você deseja EXCLUIR DEFINITIVAMENTE este link e todos os seus relatórios de cliques? Esta ação NÃO pode ser desfeita.')) return;

    if (isDemoMode) {
      const demoLinks: LinkItem[] = JSON.parse(localStorage.getItem('brandshort_demo_links') || '[]');
      const updated = demoLinks.filter(l => l.id !== id);
      localStorage.setItem('brandshort_demo_links', JSON.stringify(updated));
      fetchLinksHistory();
      return;
    }

    try {
      const response = await fetch(`/api/links/${id}?hard=true`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchLinksHistory();
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao excluir link definitivamente.');
      }
    } catch (err) {
      console.error('Erro ao chamar DELETE (hard):', err);
    }
  };

  // 9. Copiar link curto com feedback visual
  const handleCopyLink = (slug: string, id: string) => {
    const url = `${shortDomain}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  // 10. Abrir modal com QR Code
  const handleOpenQrCode = (slug: string) => {
    const url = `${shortDomain}/${slug}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}&color=000&bgcolor=fff&qzone=1`;
    setActiveQrCodeUrl(qrApiUrl);
    setActiveQrCodeSlug(slug);
  };

  const handleDownloadQrCode = async () => {
    if (!activeQrCodeUrl) return;
    try {
      const response = await fetch(activeQrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode_${activeQrCodeSlug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao baixar QR Code:', err);
    }
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400">
        <span className="w-10 h-10 border-4 border-violet-600/30 border-t-violet-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Carregando painel administrativo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans">
      
      {/* Background gradients */}
      <div className="absolute top-0 left-[20%] w-[60vw] h-[30vw] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-white/5 bg-zinc-900/20 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg">
              <Link2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-white tracking-tight">BrandShort</span>
            <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-semibold border border-violet-500/20">
              Painel
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs text-zinc-500 font-medium">
              Logado como: <strong className="text-zinc-300 font-semibold">{user?.email}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LADO ESQUERDO: MÉTRICAS + FORMULÁRIO DE ENCURTAMENTO */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Cartões de Métricas Resumo */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Criados</span>
              <span className="text-xl font-bold text-white mt-1.5">{summaryStats.totalCreated}</span>
            </div>
            <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Ativos</span>
              <span className="text-xl font-bold text-violet-400 mt-1.5">{summaryStats.totalActive}</span>
            </div>
            <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Cliques</span>
              <span className="text-xl font-bold text-indigo-400 mt-1.5">{summaryStats.totalClicks}</span>
            </div>
          </div>

          {/* Form de Encurtar Link */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-violet-600/5 blur-2xl pointer-events-none" />
            
            <h2 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-violet-400" />
              <span>Novo Link Curto</span>
            </h2>

            {createError && (
              <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-start gap-2">
                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleShorten} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">URL Original (limpe o campo antes de inserir o link)</label>
                <input
                  type="url"
                  required
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  placeholder="https://sua-url-super-longa.com/com-muitos-parametros"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 rounded-xl outline-none text-xs text-zinc-200 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Título do Link (opcional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex: Campanha de Marketing Inverno"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 rounded-xl outline-none text-xs text-zinc-200 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Domínio Curto</label>
                  <div className="w-full px-3 py-2.5 bg-zinc-900/60 border border-white/5 text-zinc-500 rounded-xl text-[11px] select-none text-ellipsis overflow-hidden font-mono whitespace-nowrap">
                    {shortDomain.replace(/^https?:\/\//, '')}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Slug Customizado</label>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="ex: promo26"
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 rounded-xl outline-none text-xs text-zinc-200 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Data de Expiração (opcional)</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 rounded-xl outline-none text-xs text-zinc-400 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-violet-600/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isCreating ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Criar Link</span>
                  </>
                )}
              </button>
            </form>

            {/* Sucesso na criação */}
            {createdLink && (
              <div className="mt-4 p-4 bg-violet-600/10 border border-violet-500/20 rounded-xl text-xs animate-fadeIn space-y-2">
                <div className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">Link encurtado!</div>
                <a
                    href={createdLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-200 font-mono font-semibold break-all hover:underline hover:text-violet-300 transition-colors"
                  >
                    {createdLink}
                  </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdLink);
                    alert('Link copiado!');
                  }}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copiar Link</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* LADO DIREITO: HISTÓRICO DE LINKS E FILTROS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col min-h-[500px]">
            
            {/* Cabeçalho do Histórico */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-400" />
                  <span>Histórico de Links do Perfil</span>
                </h2>
                <p className="text-zinc-500 text-xs mt-0.5">Gerencie os links curtos criados por você.</p>
              </div>

              {/* Botões de Pesquisa Rápida e Toggle de Filtros */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Buscar links..."
                    className="w-full sm:w-48 pl-9 pr-4 py-2 bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl outline-none text-xs text-zinc-200 transition-all"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-xl border border-white/10 text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${showFilters ? 'bg-violet-600/20 text-violet-300 border-violet-500/30' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Filtros</span>
                </button>
              </div>
            </div>

            {/* Painel Expansível de Filtros Avançados */}
            {showFilters && (
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-xs space-y-4 mb-6 animate-fadeIn grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-zinc-500 mb-1.5 font-medium">Filtrar por Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full p-2 bg-zinc-900 border border-white/10 rounded-lg outline-none text-zinc-300"
                  >
                    <option value="all">Todos os Links</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                    <option value="expired">Expirados</option>
                    <option value="archived">Arquivados (Soft Deleted)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1.5 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-600" />
                    <span>Data Inicial</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full p-2 bg-zinc-900 border border-white/10 rounded-lg outline-none text-zinc-400"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1.5 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-600" />
                    <span>Data Final</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full p-2 bg-zinc-900 border border-white/10 rounded-lg outline-none text-zinc-400"
                  />
                </div>
              </div>
            )}

            {/* Listagem de Links */}
            <div className="flex-1">
              {isLoadingLinks ? (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
                  <span className="w-8 h-8 border-3 border-violet-600/30 border-t-violet-500 rounded-full animate-spin mb-3" />
                  <p className="text-xs">Carregando links...</p>
                </div>
              ) : links.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                  <HelpCircle className="w-8 h-8 text-zinc-600 mb-2" />
                  <p className="text-xs text-zinc-400 font-semibold">Nenhum link encontrado.</p>
                  <p className="text-[11px] text-zinc-600 mt-1 max-w-xs">Use o formulário à esquerda para encurtar links ou mude as chaves dos filtros acima.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {links.map((link) => {
                    const shortUrl = `${shortDomain}/${link.slug}`;
                    const isCopied = copiedId === link.id;

                    // Badges de status
                    let statusColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                    let statusLabel = 'Ativo';
                    if (link.status === 'inactive') {
                      statusColor = 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
                      statusLabel = 'Inativo';
                    } else if (link.status === 'expired') {
                      statusColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                      statusLabel = 'Expirado';
                    } else if (link.status === 'archived') {
                      statusColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                      statusLabel = 'Arquivado';
                    }

                    return (
                      <div 
                        key={link.id} 
                        className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${link.is_deleted ? 'bg-zinc-900/10 border-white/5 opacity-60' : 'bg-white/[0.01] border-white/5 hover:border-white/10'}`}
                      >
                        <div className="flex-1 min-w-0">
                          {/* Título e Status */}
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-semibold text-zinc-200 text-sm truncate max-w-[200px] md:max-w-[300px]">
                              {link.title || link.slug}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${statusColor}`}>
                              {statusLabel}
                            </span>
                            {link.expires_at && (
                              <span className="text-[10px] text-zinc-500 font-medium">
                                Expirado em: {new Date(link.expires_at).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>

                          {/* Link curto e link original */}
                          <div className="space-y-1">
                            <div className="text-violet-400 font-mono text-xs font-semibold flex items-center gap-1">
                              <span>{shortUrl}</span>
                              <a 
                                href={shortUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-zinc-600 hover:text-zinc-400 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <div className="text-zinc-500 text-[11px] font-mono truncate max-w-[250px] sm:max-w-[400px]">
                              {link.original_url}
                            </div>
                          </div>
                        </div>

                        {/* Estatísticas de Clique e Ações */}
                        <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                          {/* Cliques */}
                          <div className="text-left md:text-right">
                            <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider flex items-center md:justify-end gap-1">
                              <BarChart3 className="w-3 h-3 text-zinc-600" />
                              <span>Cliques</span>
                            </div>
                            <div className="text-lg font-bold text-white mt-0.5">{link.clicks_count}</div>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center gap-2">
                            {/* Copiar */}
                            <button
                              onClick={() => handleCopyLink(link.slug, link.id)}
                              title="Copiar Link Curto"
                              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-all cursor-pointer"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* QR Code */}
                            <button
                              onClick={() => handleOpenQrCode(link.slug)}
                              title="Visualizar QR Code"
                              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-all cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>

                            {/* Detalhes/Analytics (Apenas links válidos) */}
                            {!link.is_deleted && (
                              <button
                                onClick={() => router.push(`/dashboard/analytics/${link.id}`)}
                                title="Ver Relatório Detalhado"
                                className="p-2 rounded-lg bg-violet-600/10 border border-violet-500/20 hover:bg-violet-600/20 text-violet-300 hover:text-violet-200 transition-all cursor-pointer"
                              >
                                <BarChart3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Toggle Ativo/Inativo (Se não arquivado) */}
                            {!link.is_deleted && (
                              <button
                                onClick={() => handleToggleActive(link)}
                                title={link.is_active ? 'Desativar Link' : 'Ativar Link'}
                                className="p-1 text-zinc-400 hover:text-white transition-all cursor-pointer"
                              >
                                {link.is_active ? (
                                  <ToggleRight className="w-6 h-6 text-violet-500" />
                                ) : (
                                  <ToggleLeft className="w-6 h-6 text-zinc-600" />
                                )}
                              </button>
                            )}

                            {/* Soft Delete (Arquivar) se não estiver arquivado */}
                            {!link.is_deleted ? (
                              <button
                                onClick={() => handleArchiveLink(link.id)}
                                title="Arquivar Link (Soft Delete)"
                                className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/30 text-amber-300 transition-all cursor-pointer"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              // Excluir definitivamente se for arquivado
                              <button
                                onClick={() => handleHardDeleteLink(link.id)}
                                title="Excluir Definitivamente"
                                className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/30 text-rose-300 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
                <span>Página {page} de {totalPages} ({totalLinks} links no total)</span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white rounded-lg disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Anterior</span>
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white rounded-lg disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Próxima</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Modal QR Code */}
      {activeQrCodeUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 max-w-sm w-full text-center relative shadow-2xl">
            <button
              onClick={() => setActiveQrCodeUrl(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-display font-bold text-white text-base mb-2">Código QR do Link</h3>
            <p className="text-zinc-500 text-xs mb-6">Aponte a câmera para escanear a URL curta de marca.</p>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-xl inline-block shadow-inner mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={activeQrCodeUrl} 
                alt="QR Code" 
                width={200}
                height={200}
                className="mx-auto"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${shortDomain}/${activeQrCodeSlug}`);
                  alert('URL copiada!');
                }}
                className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Copiar URL
              </button>
              <button
                onClick={handleDownloadQrCode}
                className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 mt-auto bg-zinc-950 text-center text-xs text-zinc-600">
        <p>&copy; {new Date().getFullYear()} BrandShort. Todos os direitos reservados. Governança e White-label completo.</p>
      </footer>
    </div>
  );
}
