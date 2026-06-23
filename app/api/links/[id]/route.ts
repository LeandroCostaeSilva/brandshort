import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';
import { validateCustomSlug } from '@/lib/slug';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getServerClient(req);

    // 1. Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const { slug, title, is_active, expires_at } = body;

    const updateData: any = {};

    // 2. Se slug for fornecido, validar e verificar unicidade
    if (slug !== undefined) {
      const trimmedSlug = slug.trim();
      const validation = validateCustomSlug(trimmedSlug);
      if (!validation.isValid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // Verificar se o slug já está em uso por OUTRO link
      const { data: existingLink, error: checkError } = await supabase
        .from('links')
        .select('id')
        .eq('slug', trimmedSlug)
        .neq('id', id)
        .maybeSingle();

      if (checkError) {
        return NextResponse.json({ error: 'Erro ao validar unicidade do slug.' }, { status: 500 });
      }

      if (existingLink) {
        return NextResponse.json({ error: 'Este slug já está em uso por outro link.' }, { status: 400 });
      }

      updateData.slug = trimmedSlug;
    }

    if (title !== undefined) {
      updateData.title = title ? title.trim() : null;
    }

    if (is_active !== undefined) {
      updateData.is_active = !!is_active;
      updateData.status = is_active ? 'active' : 'inactive';
    }

    if (expires_at !== undefined) {
      updateData.expires_at = expires_at ? new Date(expires_at).toISOString() : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar foi enviado.' }, { status: 400 });
    }

    // 3. Atualizar no banco (RLS garante que só o dono edita)
    const { data: link, error: updateError } = await supabase
      .from('links')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: `Erro ao atualizar link: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({ link });
  } catch (error) {
    console.error('Erro no endpoint PATCH link:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getServerClient(req);

    // 1. Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const hard = searchParams.get('hard') === 'true';

    if (hard) {
      // Hard delete: remove definitivamente do banco (RLS restringe ao dono)
      const { error: deleteError } = await supabase
        .from('links')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return NextResponse.json({ error: `Erro ao deletar link: ${deleteError.message}` }, { status: 500 });
      }

      return NextResponse.json({ message: 'Link excluído definitivamente com sucesso.' });
    } else {
      // Soft delete: arquivamento
      const { error: updateError } = await supabase
        .from('links')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          status: 'archived',
          is_active: false,
        })
        .eq('id', id);

      if (updateError) {
        return NextResponse.json({ error: `Erro ao arquivar link: ${updateError.message}` }, { status: 500 });
      }

      return NextResponse.json({ message: 'Link arquivado (soft-delete) com sucesso.' });
    }
  } catch (error) {
    console.error('Erro no endpoint DELETE link:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
