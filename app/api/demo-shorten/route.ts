import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import { validateCustomSlug, isSlugAvailable, generateUniqueSlug } from '@/lib/slug';

const DEMO_LINK_TTL_HOURS = 24;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { originalUrl, customSlug } = body;

    // 1. Validar URL
    if (!originalUrl) {
      return NextResponse.json({ error: 'A URL original é obrigatória.' }, { status: 400 });
    }

    try {
      const url = new URL(originalUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return NextResponse.json({ error: 'A URL deve iniciar com http:// ou https://.' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'A URL informada é inválida.' }, { status: 400 });
    }

    const adminSupabase = getAdminClient();
    let slug = '';

    // 2. Validar / gerar Slug
    if (customSlug) {
      const trimmedSlug = customSlug.trim();
      const validation = validateCustomSlug(trimmedSlug);
      if (!validation.isValid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const available = await isSlugAvailable(trimmedSlug);
      if (!available) {
        return NextResponse.json({ error: 'Este slug já está em uso. Tente outro.' }, { status: 400 });
      }

      slug = trimmedSlug;
    } else {
      slug = await generateUniqueSlug();
    }

    // 3. Definir expiração (24 horas)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + DEMO_LINK_TTL_HOURS);

    // 4. Salvar no Supabase via admin client (ignora RLS, sem necessidade de autenticação)
    const { data: link, error: insertError } = await adminSupabase
      .from('links')
      .insert({
        user_id: null,
        slug,
        original_url: originalUrl,
        title: 'Link Demo — expira em 24h',
        expires_at: expiresAt.toISOString(),
        is_active: true,
        status: 'active',
        is_deleted: false,
      })
      .select('slug')
      .single();

    if (insertError) {
      console.error('Erro ao salvar link demo:', insertError.message);
      return NextResponse.json({ error: 'Não foi possível criar o link. Tente novamente.' }, { status: 500 });
    }

    return NextResponse.json({ slug: link.slug }, { status: 201 });
  } catch (error) {
    console.error('Erro no endpoint demo-shorten:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
