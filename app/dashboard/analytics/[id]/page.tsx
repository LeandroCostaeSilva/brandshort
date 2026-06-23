'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, BarChart3, Globe, Laptop, Smartphone, Tablet, Calendar, 
  ExternalLink, Clock, Compass, HelpCircle, RefreshCw
} from 'lucide-react';
import { getClientClient } from '@/lib/supabase';

interface LinkInfo {
  id: string;
  slug: string;
  original_url: string;
  title: string | null;
  is_active: boolean;
  status: string;
  created_at: string;
}

interface ClickItem {
  id: string;
  clicked_at: string;
  referrer: string | null;
  user_agent: string | null;
  country: string;
  device_type: string;
}

interface AnalyticsPageProps {
  params: Promise<{ id: string }>;
}

export default function AnalyticsPage({ params }: AnalyticsPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const supabase = getClientClient();

  const [isLoading, setIsLoading] = useState(true);
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
  const [clicks, setClicks] = useState<ClickItem[]>([]);
  
  // Dados agregados
  const [stats, setStats] = useState({
    totalClicks: 0,
    topReferrer: 'Direto / Desconhecido',
    topCountry: 'Nenhum',
    topDevice: 'Desktop'
  });

  const [referrersList, setReferrersList] = useState<{ name: string; count: number; percentage: number }[]>([]);
  const [countriesList, setCountriesList] = useState<{ code: string; count: number; percentage: number }[]>([]);
  const [devicesList, setDevicesList] = useState<{ type: string; count: number; percentage: number }[]>([]);
  const [timelineList, setTimelineList] = useState<{ date: string; count: number }[]>([]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // 1. Validar login do usuário
      const isDemo = typeof window !== 'undefined' && sessionStorage.getItem('brandshort_demo_mode') === 'true';
      let currentSession = null;
      if (isDemo) {
        currentSession = { user: { email: 'demo@brandshort.com.br' } };
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        currentSession = session;
      }

      if (!currentSession) {
        router.push('/login');
        return;
      }

      let clicksList: ClickItem[] = [];

      if (isDemo) {
        // Obter link do localStorage no modo demo
        const demoLinks: any[] = JSON.parse(localStorage.getItem('brandshort_demo_links') || '[]');
        const linkData = demoLinks.find(l => l.id === id);
        
        if (!linkData) {
          router.push('/dashboard');
          return;
        }

        setLinkInfo({
          id: linkData.id,
          slug: linkData.slug,
          original_url: linkData.original_url,
          title: linkData.title,
          is_active: linkData.is_active,
          status: linkData.status,
          created_at: linkData.created_at
        });

        // Obter ou gerar cliques mockados realistas para o link
        const storageClicksKey = `brandshort_demo_clicks_${id}`;
        const storedClicks = localStorage.getItem(storageClicksKey);
        
        if (storedClicks) {
          clicksList = JSON.parse(storedClicks);
        } else {
          // Gerar cliques aleatórios com base no clicks_count do link
          const clicksToGenerate = linkData.clicks_count || (linkData.slug === 'ebook-gratis' ? 128 : linkData.slug === 'promo-inverno' ? 42 : 12);
          const referrers = [
            'https://instagram.com', 
            'https://instagram.com', 
            'https://linkedin.com', 
            'https://facebook.com', 
            null, 
            'https://t.co', 
            'https://google.com'
          ];
          const countries = ['BR', 'BR', 'BR', 'US', 'PT', 'ES', 'BR', 'AR', 'BR'];
          const devices = ['mobile', 'mobile', 'desktop', 'tablet', 'mobile'];

          for (let i = 0; i < clicksToGenerate; i++) {
            const clickedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString();
            clicksList.push({
              id: `click-demo-${Math.random().toString(36).substring(7)}`,
              clicked_at: clickedAt,
              referrer: referrers[Math.floor(Math.random() * referrers.length)],
              user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
              country: countries[Math.floor(Math.random() * countries.length)],
              device_type: devices[Math.floor(Math.random() * devices.length)]
            });
          }
          // Ordenar por data mais recente
          clicksList.sort((a, b) => new Date(b.clicked_at).getTime() - new Date(a.clicked_at).getTime());
          localStorage.setItem(storageClicksKey, JSON.stringify(clicksList));
        }

        setClicks(clicksList);
      } else {
        // 2. Buscar informações do Link do Supabase
        const { data: linkData, error: linkError } = await supabase
          .from('links')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (linkError || !linkData) {
          console.error('Link não encontrado ou erro:', linkError);
          router.push('/dashboard');
          return;
        }

        setLinkInfo(linkData);

        // 3. Buscar os cliques do Link do Supabase
        const { data: clicksData, error: clicksError } = await supabase
          .from('clicks')
          .select('*')
          .eq('link_id', id)
          .order('clicked_at', { ascending: false });

        if (clicksError) {
          console.error('Erro ao buscar cliques:', clicksError);
          return;
        }

        clicksList = clicksData || [];
        setClicks(clicksList);
      }

      // 4. Agregar os dados de cliques no lado do cliente
      const totalClicks = clicksList.length;

      if (totalClicks > 0) {
        // Agregação de Origens (Referrer)
        const referrersMap: Record<string, number> = {};
        // Agregação de Países
        const countriesMap: Record<string, number> = {};
        // Agregação de Dispositivos
        const devicesMap: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
        // Agregação de Cronologia (Cliques por Dia - últimos 7 dias)
        const timelineMap: Record<string, number> = {};

        clicksList.forEach(click => {
          // Tratar Referrer
          let ref = 'Direto / Desconhecido';
          if (click.referrer) {
            try {
              const url = new URL(click.referrer);
              ref = url.hostname.replace('www.', '');
            } catch {
              ref = click.referrer;
            }
          }
          referrersMap[ref] = (referrersMap[ref] || 0) + 1;

          // Tratar País
          const country = click.country || 'Unknown';
          countriesMap[country] = (countriesMap[country] || 0) + 1;

          // Tratar Dispositivo
          const dev = click.device_type || 'desktop';
          devicesMap[dev] = (devicesMap[dev] || 0) + 1;

          // Tratar Cronologia (Dia no formato DD/MM)
          const date = new Date(click.clicked_at);
          const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          timelineMap[dateStr] = (timelineMap[dateStr] || 0) + 1;
        });

        // Ordenar e formatar listas
        const sortedReferrers = Object.entries(referrersMap)
          .map(([name, count]) => ({
            name,
            count,
            percentage: Math.round((count / totalClicks) * 100)
          }))
          .sort((a, b) => b.count - a.count);

        const sortedCountries = Object.entries(countriesMap)
          .map(([code, count]) => ({
            code,
            count,
            percentage: Math.round((count / totalClicks) * 100)
          }))
          .sort((a, b) => b.count - a.count);

        const sortedDevices = Object.entries(devicesMap)
          .map(([type, count]) => ({
            type,
            count,
            percentage: Math.round((count / totalClicks) * 100)
          }))
          .sort((a, b) => b.count - a.count);

        const sortedTimeline = Object.entries(timelineMap)
          .map(([date, count]) => ({ date, count }))
          .reverse() // mais antigos primeiro para o gráfico de linha temporal
          .slice(-7); // limita nos últimos 7 dias com dados

        setReferrersList(sortedReferrers);
        setCountriesList(sortedCountries);
        setDevicesList(sortedDevices);
        setTimelineList(sortedTimeline);

        // Atualizar KPI cards
        setStats({
          totalClicks,
          topReferrer: sortedReferrers[0]?.name || 'Direto / Desconhecido',
          topCountry: sortedCountries[0]?.code || 'Desconhecido',
          topDevice: sortedDevices[0]?.type === 'mobile' ? 'Mobile' : sortedDevices[0]?.type === 'tablet' ? 'Tablet' : 'Desktop'
        });
      } else {
        // Resetar agregados caso não haja cliques
        setStats({
          totalClicks: 0,
          topReferrer: 'Nenhum clique',
          topCountry: 'Nenhum',
          topDevice: 'Nenhum'
        });
        setReferrersList([]);
        setCountriesList([]);
        setDevicesList([]);
        setTimelineList([]);
      }

    } catch (err) {
      console.error('Erro geral ao processar dados de analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400">
        <span className="w-10 h-10 border-4 border-violet-600/30 border-t-violet-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Carregando analytics do link...</p>
      </div>
    );
  }

  const shortDomain = process.env.NEXT_PUBLIC_SHORT_DOMAIN || 'http://localhost:3000';
  const fullShortUrl = linkInfo ? `${shortDomain}/${linkInfo.slug}` : '';

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans">
      
      {/* Background gradient lights */}
      <div className="absolute top-0 right-[20%] w-[50vw] h-[30vw] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

      {/* Nav Header */}
      <header className="border-b border-white/5 bg-zinc-900/20 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-3.5 py-1.5 rounded-xl border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Painel</span>
          </button>

          <span className="font-display font-bold text-sm text-zinc-400">Relatório do Link</span>

          <button
            onClick={fetchAnalytics}
            className="p-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            title="Atualizar dados"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      {linkInfo && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8 z-10">
          
          {/* Header Card de Info do Link */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />
            <div>
              <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest">Link de Marca</span>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-white mt-1">{linkInfo.title || linkInfo.slug}</h1>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 mt-3 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500 font-medium">Link Curto:</span>
                  <a href={fullShortUrl} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 font-mono font-semibold flex items-center gap-1">
                    <span>{fullShortUrl}</span>
                    <ExternalLink className="w-3 h-3 text-violet-500" />
                  </a>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500 font-medium">Destino:</span>
                  <span className="text-zinc-400 font-mono truncate max-w-[200px] sm:max-w-[400px]" title={linkInfo.original_url}>
                    {linkInfo.original_url}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left md:text-right shrink-0">
              <span className="text-xs text-zinc-500 block font-medium">Criado em</span>
              <span className="text-sm font-semibold text-zinc-300 block mt-1">
                {new Date(linkInfo.created_at).toLocaleDateString('pt-BR')} às {new Date(linkInfo.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Cards KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-violet-400" />
                <span>Cliques Totais</span>
              </span>
              <span className="text-3xl font-extrabold text-white mt-4">{stats.totalClicks}</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-indigo-400" />
                <span>Top Referrer</span>
              </span>
              <span className="text-base font-bold text-white truncate mt-4" title={stats.topReferrer}>{stats.topReferrer}</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Top País</span>
              </span>
              <span className="text-xl font-bold text-white mt-4">{stats.topCountry}</span>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-pink-400" />
                <span>Dispositivo Principal</span>
              </span>
              <span className="text-xl font-bold text-white mt-4">{stats.topDevice}</span>
            </div>

          </div>

          {/* Seção de Gráficos / Listas Agregadas */}
          {stats.totalClicks === 0 ? (
            <div className="glass-panel p-12 rounded-2xl border border-white/10 text-center flex flex-col items-center justify-center min-h-[300px]">
              <HelpCircle className="w-10 h-10 text-zinc-700 mb-3" />
              <h3 className="font-display text-white font-bold text-base">Sem cliques registrados ainda</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">Divulgue seu link de marca! Assim que os visitantes clicarem nele, as métricas e dados demográficos aparecerão aqui em tempo real.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Box 1: Origens (Referrers) */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
                <h3 className="font-display font-bold text-sm text-zinc-300 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-violet-400" />
                  <span>Origens de Tráfego</span>
                </h3>
                <div className="space-y-4 mt-2 flex-1 overflow-y-auto max-h-[250px]">
                  {referrersList.map((ref) => (
                    <div key={ref.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-zinc-400 truncate max-w-[180px]">{ref.name}</span>
                        <span className="text-zinc-300 font-semibold">{ref.count} ({ref.percentage}%)</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-full" 
                          style={{ width: `${ref.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 2: Dispositivos */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
                <h3 className="font-display font-bold text-sm text-zinc-300 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-pink-400" />
                  <span>Dispositivos</span>
                </h3>
                <div className="space-y-4 mt-2 flex-1 overflow-y-auto max-h-[250px]">
                  {devicesList.map((dev) => {
                    const label = dev.type === 'mobile' ? 'Mobile' : dev.type === 'tablet' ? 'Tablet' : 'Desktop';
                    const Icon = dev.type === 'mobile' ? Smartphone : dev.type === 'tablet' ? Tablet : Laptop;

                    return (
                      <div key={dev.type} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-medium">
                          <span className="text-zinc-400 flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{label}</span>
                          </span>
                          <span className="text-zinc-300 font-semibold">{dev.count} ({dev.percentage}%)</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-pink-500 to-rose-500 h-full rounded-full" 
                            style={{ width: `${dev.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Box 3: Países */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
                <h3 className="font-display font-bold text-sm text-zinc-300 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Geolocalização (Países)</span>
                </h3>
                <div className="space-y-4 mt-2 flex-1 overflow-y-auto max-h-[250px]">
                  {countriesList.map((country) => (
                    <div key={country.code} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-zinc-400 uppercase font-semibold tracking-wider">{country.code}</span>
                        <span className="text-zinc-300 font-semibold">{country.count} ({country.percentage}%)</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full" 
                          style={{ width: `${country.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Gráfico Linear Cronológico Simulado / Série Temporal em Tabela */}
          {timelineList.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-xl">
              <h3 className="font-display font-bold text-sm text-zinc-300 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-400" />
                <span>Cliques nos Últimos Dias</span>
              </h3>

              <div className="flex items-end justify-between gap-2 pt-6 h-32 px-4 max-w-2xl mx-auto">
                {timelineList.map((day) => {
                  // Calcular altura proporcional baseada no maior valor
                  const maxClicks = Math.max(...timelineList.map(t => t.count));
                  const heightPercent = maxClicks > 0 ? (day.count / maxClicks) * 100 : 0;

                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group">
                      <span className="text-[10px] text-zinc-500 group-hover:text-white font-semibold transition-colors opacity-0 group-hover:opacity-100 mb-1">
                        {day.count}
                      </span>
                      <div className="w-8 sm:w-12 bg-white/5 hover:bg-violet-600/30 rounded-t-lg transition-all flex items-end overflow-hidden h-24">
                        <div 
                          className="bg-gradient-to-t from-violet-600 to-indigo-500 w-full rounded-t-md transition-all duration-500"
                          style={{ height: `${heightPercent || 5}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-500 font-medium">{day.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabela do Histórico de Cliques Logados */}
          {clicks.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-xl">
              <h3 className="font-display font-bold text-sm text-zinc-300 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-400" />
                <span>Log de Cliques Recentes</span>
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-500 font-medium">
                      <th className="py-3 px-4">Data e Hora</th>
                      <th className="py-3 px-4">País</th>
                      <th className="py-3 px-4">Dispositivo</th>
                      <th className="py-3 px-4">Origem (Referrer)</th>
                      <th className="py-3 px-4">User-Agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clicks.slice(0, 10).map((click) => (
                      <tr key={click.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] text-zinc-400">
                        <td className="py-3 px-4 font-mono font-medium">
                          {new Date(click.clicked_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 font-semibold uppercase tracking-wider text-zinc-300">
                          {click.country}
                        </td>
                        <td className="py-3 px-4 capitalize">
                          {click.device_type}
                        </td>
                        <td className="py-3 px-4 truncate max-w-[150px] font-mono text-[10px]" title={click.referrer || ''}>
                          {click.referrer || 'Direto'}
                        </td>
                        <td className="py-3 px-4 truncate max-w-[200px] text-[10px] text-zinc-600 font-mono" title={click.user_agent || ''}>
                          {click.user_agent || 'Nenhum'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-zinc-600 mt-4 text-right">Exibindo os últimos 10 cliques. Todos os dados são agregados de forma anônima e conforme a LGPD.</p>
            </div>
          )}

        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 mt-auto bg-zinc-950 text-center text-xs text-zinc-600 z-10">
        <p>&copy; {new Date().getFullYear()} BrandShort. Dados demográficos e geolocalizados em conformidade.</p>
      </footer>
    </div>
  );
}
