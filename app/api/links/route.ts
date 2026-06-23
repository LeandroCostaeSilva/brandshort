import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const supabase = getServerClient(req);

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
    }

    // Buscar links ativos que não foram deletados
    const { data: links, error: fetchError } = await supabase
      .from('links')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (fetchError) {
      return NextResponse.json({ error: `Erro ao buscar links: ${fetchError.message}` }, { status: 500 });
    }

    return NextResponse.json({ links });
  } catch (error) {
    console.error('Erro no endpoint links:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
