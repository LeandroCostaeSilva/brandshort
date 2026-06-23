-- Tabela de links
create table links (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) not null,
  slug        text unique not null,
  original_url text not null,
  title       text,
  is_active   boolean default true,
  status      text default 'active',  -- 'active' | 'archived' | 'expired'
  is_deleted  boolean default false,  -- soft delete: mantém no histórico
  deleted_at  timestamptz,
  expires_at  timestamptz,
  created_at  timestamptz default now()
);

-- Tabela de cliques (analytics)
create table clicks (
  id          uuid primary key default gen_random_uuid(),
  link_id     uuid references links(id) on delete cascade not null,
  clicked_at  timestamptz default now() not null,
  referrer    text,
  user_agent  text,
  country     text,
  device_type text
);

-- Índices para performance de busca e agregação
create index idx_links_slug on links(slug);
create index idx_links_user_created on links(user_id, created_at desc);
create index idx_clicks_link_id on clicks(link_id);
create index idx_clicks_clicked_at on clicks(clicked_at desc);

-- RLS para a tabela de links
alter table links enable row level security;

create policy "Users can perform all actions on their own links" on links
  for all using (auth.uid() = user_id);

-- RLS para a tabela de cliques (analytics)
alter table clicks enable row level security;

create policy "Users can read clicks of their own links" on clicks
  for select using (
    exists (
      select 1 from links
      where links.id = clicks.link_id
      and links.user_id = auth.uid()
    )
  );

-- O bypass de inserção pública para visitantes finais é tratado via cliente do backend com service_role
