import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';
import { validateCustomSlug, isSlugAvailable, generateUniqueSlug } from '@/lib/slug';
import { validateUrlSecurity } from '@/lib/security';

export async function POST(req: Request) {
  try {
    const supabase = getServerClient(req);

    // 1. Verificar autenticação do usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const { originalUrl, customSlug, title, expiresAt } = body;

    // Obtém o IP do cliente dos headers comuns
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || undefined;

    // 2. Validar URL original com a camada de segurança (HTTPS e Google Safe Browsing)
    const securityCheck = await validateUrlSecurity(originalUrl, user.id, ip);
    if (!securityCheck.isValid) {
      return NextResponse.json(
        { error: securityCheck.error },
        { status: securityCheck.status || 400 }
      );
    }


    let slug = '';

    // 3. Validar / gerar Slug
    if (customSlug) {
      const trimmedSlug = customSlug.trim();
      const validation = validateCustomSlug(trimmedSlug);
      if (!validation.isValid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const available = await isSlugAvailable(trimmedSlug);
      if (!available) {
        return NextResponse.json({ error: 'Este slug já está em uso.' }, { status: 400 });
      }

      slug = trimmedSlug;
    } else {
      slug = await generateUniqueSlug();
    }

    // 4. Salvar link no Supabase
    const { data: link, error: insertError } = await supabase
      .from('links')
      .insert({
        user_id: user.id,
        slug,
        original_url: originalUrl,
        title: title?.trim() || null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_active: true,
        status: 'active',
        is_deleted: false,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: `Erro ao salvar o link: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ link }, { status: 201 });
  } catch (error: any) {
    console.error('Erro no endpoint shorten:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
