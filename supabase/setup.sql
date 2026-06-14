-- Запусти один раз в Supabase → SQL Editor

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  mood text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  visitor_id text not null,
  reaction_type text not null default 'like',
  created_at timestamptz not null default now(),
  unique (post_id, visitor_id, reaction_type)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  author_name text not null default 'Аноним',
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;

create policy "posts_select_all" on public.posts for select using (true);
create policy "posts_insert_author" on public.posts for insert with check (auth.uid() = author_id);
create policy "posts_update_author" on public.posts for update using (auth.uid() = author_id);
create policy "posts_delete_author" on public.posts for delete using (auth.uid() = author_id);

create policy "reactions_select_all" on public.reactions for select using (true);
create policy "reactions_insert_all" on public.reactions for insert with check (true);
create policy "reactions_delete_own" on public.reactions for delete using (true);

create policy "comments_select_all" on public.comments for select using (true);
create policy "comments_insert_all" on public.comments for insert with check (char_length(content) <= 2000);
