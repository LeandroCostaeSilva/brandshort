import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

// Função utilitária ultra rápida para identificar o tipo de dispositivo pelo User Agent
function getDeviceType(userAgent: string | null): string {
  if (!userAgent) return 'desktop';
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipod')) {
    return 'mobile';
  }
  if (ua.includes('tablet') || ua.includes('ipad') || ua.includes('playbook') || ua.includes('silk')) {
    return 'tablet';
  }
  return 'desktop';
}

// Helper assíncrono para registrar o clique em segundo plano sem bloquear a resposta HTTP
async function saveClick(
  adminSupabase: any,
  linkId: string,
  referrer: string | null,
  userAgent: string | null,
  country: string,
  deviceType: string
) {
  try {
    const { error } = await adminSupabase
      .from('clicks')
      .insert({
        link_id: linkId,
        referrer,
        user_agent: userAgent,
        country,
        device_type: deviceType,
      });

    if (error) {
      console.error(`Erro ao registrar clique para link ${linkId}:`, error.message);
    }
  } catch (err) {
    console.error('Erro de exceção ao registrar clique:', err);
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const adminSupabase = getAdminClient();

  try {
    // 1. Buscar o link correspondente no banco (ignora RLS, pois é público)
    const { data: link, error } = await adminSupabase
      .from('links')
      .select('*')
      .eq('slug', slug)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      console.error(`Erro ao resolver slug "${slug}":`, error.message);
      return NextResponse.redirect(new URL(`/404?slug=${slug}&reason=error`, req.url));
    }

    // 2. Se o link não existir
    if (!link) {
      return NextResponse.redirect(new URL(`/404?slug=${slug}&reason=not_found`, req.url));
    }

    // 3. Se estiver inativo
    if (!link.is_active || link.status === 'inactive') {
      return NextResponse.redirect(new URL(`/404?slug=${slug}&reason=inactive`, req.url));
    }

    // 4. Se estiver expirado
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      // Opcional: Atualizar o status do link no banco para expired (assíncrono)
      try {
        await adminSupabase
          .from('links')
          .update({ status: 'expired' })
          .eq('id', link.id);
      } catch (err) {
        console.error('Erro ao atualizar status de expirado:', err);
      }

      return NextResponse.redirect(new URL(`/404?slug=${slug}&reason=expired`, req.url));
    }

    // 5. Capturar metadados do visitante para o Analytics
    const headers = req.headers;
    const referrer = headers.get('referer') || headers.get('referrer') || null;
    const userAgent = headers.get('user-agent');
    
    // Obter país via cabeçalhos de geoIP comuns em CDNs (como Vercel ou Cloudflare)
    const country = headers.get('x-vercel-ip-country') || headers.get('cf-ipcountry') || 'Unknown';
    const deviceType = getDeviceType(userAgent);

    // 6. Registrar o clique de forma assíncrona (não bloqueante para o redirect)
    saveClick(adminSupabase, link.id, referrer, userAgent, country, deviceType);

    // 7. Redirecionar o visitante usando HTTP 302 (Redirecionamento temporário)
    // HTTP 302 garante que o navegador não cacheie o redirecionamento, forçando acessos futuros a passarem pela nossa API
    return NextResponse.redirect(link.original_url, {
      status: 302,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error(`Exceção ao processar redirect para "${slug}":`, error);
    return NextResponse.redirect(new URL(`/404?slug=${slug}&reason=exception`, req.url));
  }
}
