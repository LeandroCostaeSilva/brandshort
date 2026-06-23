import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const supabase = getServerClient(req);

    // 1. Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
    }

    // 2. Extrair parâmetros da query string
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || 'all'; // all, active, inactive, expired, archived
    const startDate = url.searchParams.get('startDate') || '';
    const endDate = url.searchParams.get('endDate') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    const fromRange = (page - 1) * limit;
    const toRange = fromRange + limit - 1;

    // 3. Montar a query básica buscando link + quantidade de cliques
    let query = supabase
      .from('links')
      .select('*, clicks(count)', { count: 'exact' });

    // Filtrar pelo usuário atual
    query = query.eq('user_id', user.id);

    // 4. Aplicar filtros de status
    const now = new Date().toISOString();
    if (status === 'active') {
      query = query
        .eq('is_deleted', false)
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${now}`);
    } else if (status === 'inactive') {
      query = query
        .eq('is_deleted', false)
        .eq('is_active', false);
    } else if (status === 'expired') {
      query = query
        .eq('is_deleted', false)
        .eq('is_active', true)
        .lt('expires_at', now);
    } else if (status === 'archived') {
      query = query.or('is_deleted.eq.true,status.eq.archived');
    } else {
      // 'all' - no status filter (mas por segurança, não trazer os excluídos definitivamente)
      // O banco de dados mantém os soft-deleted na tabela, então eles virão se status for 'all' ou 'archived'
    }

    // 5. Aplicar busca textual (slug, URL original ou título)
    if (search) {
      query = query.or(`slug.ilike.%${search}%,original_url.ilike.%${search}%,title.ilike.%${search}%`);
    }

    // 6. Aplicar filtros de período de criação
    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString());
    }
    if (endDate) {
      // Ajusta o final do dia para 23:59:59.999
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endDateTime.toISOString());
    }

    // 7. Ordenar e paginar
    const { data: links, count, error: fetchError } = await query
      .order('created_at', { ascending: false })
      .range(fromRange, toRange);

    if (fetchError) {
      return NextResponse.json({ error: `Erro ao buscar histórico: ${fetchError.message}` }, { status: 500 });
    }

    // Formatando a resposta para simplificar o array de cliques em um número total de cliques
    const formattedLinks = links?.map((link: any) => {
      const clickCount = link.clicks && link.clicks[0] ? link.clicks[0].count : 0;
      
      // Determinar status em tempo de execução para expiração
      let currentStatus = link.status;
      if (link.is_deleted) {
        currentStatus = 'archived';
      } else if (!link.is_active) {
        currentStatus = 'inactive';
      } else if (link.expires_at && new Date(link.expires_at) < new Date()) {
        currentStatus = 'expired';
      } else {
        currentStatus = 'active';
      }

      return {
        ...link,
        clicks_count: clickCount,
        status: currentStatus,
        clicks: undefined, // remove array temporário
      };
    });

    return NextResponse.json({
      links: formattedLinks || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Erro no endpoint de histórico:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
