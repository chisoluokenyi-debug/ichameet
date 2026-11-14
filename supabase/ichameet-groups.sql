-- IchaMeet shared groups, posts, comments and memberships
create extension if not exists pgcrypto;

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 50),
  description text not null default '' check (char_length(description) <= 240),
  is_private boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.group_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.group_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.group_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists group_posts_group_created_idx on public.group_posts(group_id, created_at desc);
create index if not exists group_comments_post_created_idx on public.group_comments(post_id, created_at);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_posts enable row level security;
alter table public.group_comments enable row level security;

create or replace function public.icha_is_group_member(target_group uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.group_members
    where group_id = target_group and user_id = auth.uid()
  );
$$;

create or replace function public.icha_can_view_group(target_group uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.groups g
    where g.id = target_group
      and (not g.is_private or g.created_by = auth.uid()
           or exists (select 1 from public.group_members m where m.group_id = g.id and m.user_id = auth.uid()))
  );
$$;

drop policy if exists "View groups available to me" on public.groups;
create policy "View groups available to me" on public.groups
for select to authenticated
using (not is_private or created_by = auth.uid() or public.icha_is_group_member(id));

drop policy if exists "Signed in members create groups" on public.groups;
create policy "Signed in members create groups" on public.groups
for insert to authenticated with check (created_by = auth.uid());

drop policy if exists "Owners update their groups" on public.groups;
create policy "Owners update their groups" on public.groups
for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists "View memberships in visible groups" on public.group_members;
create policy "View memberships in visible groups" on public.group_members
for select to authenticated using (public.icha_can_view_group(group_id));

drop policy if exists "Join public groups or add owner membership" on public.group_members;
create policy "Join public groups or add owner membership" on public.group_members
for insert to authenticated with check (
  user_id = auth.uid()
  and exists (select 1 from public.groups g where g.id = group_id
    and (not g.is_private or g.created_by = auth.uid()))
);

drop policy if exists "Leave own membership" on public.group_members;
create policy "Leave own membership" on public.group_members
for delete to authenticated using (user_id = auth.uid());

drop policy if exists "Read posts in visible groups" on public.group_posts;
create policy "Read posts in visible groups" on public.group_posts
for select to authenticated using (public.icha_can_view_group(group_id));

drop policy if exists "Members publish posts" on public.group_posts;
create policy "Members publish posts" on public.group_posts
for insert to authenticated with check (
  author_id = auth.uid() and public.icha_is_group_member(group_id)
);

drop policy if exists "Authors update their posts" on public.group_posts;
create policy "Authors update their posts" on public.group_posts
for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "Authors delete their posts" on public.group_posts;
create policy "Authors delete their posts" on public.group_posts
for delete to authenticated using (author_id = auth.uid());

drop policy if exists "Read comments in visible groups" on public.group_comments;
create policy "Read comments in visible groups" on public.group_comments
for select to authenticated using (
  exists (select 1 from public.group_posts p
    where p.id = post_id and public.icha_can_view_group(p.group_id))
);

drop policy if exists "Members comment on group posts" on public.group_comments;
create policy "Members comment on group posts" on public.group_comments
for insert to authenticated with check (
  author_id = auth.uid()
  and exists (select 1 from public.group_posts p
    where p.id = post_id and public.icha_is_group_member(p.group_id))
);

drop policy if exists "Authors delete their comments" on public.group_comments;
create policy "Authors delete their comments" on public.group_comments
for delete to authenticated using (author_id = auth.uid());

grant select, insert, update on public.groups to authenticated;
grant select, insert, delete on public.group_members to authenticated;
grant select, insert, update, delete on public.group_posts to authenticated;
grant select, insert, delete on public.group_comments to authenticated;
