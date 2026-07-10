-- =====================================================================
-- AILAA v2 — VERİTABANI KURULUMU
-- Supabase panelinde: SQL Editor > New query > bunu yapıştır > Run
-- Bir kez çalıştırman yeterli. Tekrar çalıştırmak güvenlidir.
-- =====================================================================

-- ---------- 1) PROFİLLER (her kullanıcıya herkese açık profil) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  bio text not null default '',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles herkes okur" on public.profiles;
create policy "profiles herkes okur" on public.profiles for select using (true);

drop policy if exists "profil sahibi gunceller" on public.profiles;
create policy "profil sahibi gunceller" on public.profiles for update using (auth.uid() = id);

drop policy if exists "profil sahibi ekler" on public.profiles;
create policy "profil sahibi ekler" on public.profiles for insert with check (auth.uid() = id);

-- Yeni üye olunca otomatik profil oluştur (e-postadan kullanıcı adı türet)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    lower(regexp_replace(split_part(coalesce(new.email,'maker'),'@',1), '[^a-zA-Z0-9_]', '', 'g'))
      || '_' || substr(new.id::text, 1, 4)
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mevcut kullanıcılara profil aç (geriye dönük doldurma)
insert into public.profiles (id, username)
select u.id,
  lower(regexp_replace(split_part(coalesce(u.email,'maker'),'@',1), '[^a-zA-Z0-9_]', '', 'g'))
    || '_' || substr(u.id::text, 1, 4)
from auth.users u
on conflict (id) do nothing;

-- ---------- 2) PROJELERE YENİ SÜTUNLAR ----------
alter table public.projects add column if not exists status text not null default 'pending';
alter table public.projects add column if not exists plays integer not null default 0;
alter table public.projects add column if not exists buy_url text;
alter table public.projects add column if not exists cover_url text;

-- Mevcut projeler mağazada kalsın (yeniler moderasyon onayı bekler)
update public.projects set status = 'approved' where status = 'pending';

-- ---------- 3) OYLAR ----------
create table if not exists public.votes (
  id bigint generated always as identity primary key,
  project_id bigint not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);
alter table public.votes enable row level security;

drop policy if exists "oylar herkes okur" on public.votes;
create policy "oylar herkes okur" on public.votes for select using (true);

drop policy if exists "girisli oy verir" on public.votes;
create policy "girisli oy verir" on public.votes for insert with check (auth.uid() = user_id);

drop policy if exists "kendi oyunu geri alir" on public.votes;
create policy "kendi oyunu geri alir" on public.votes for delete using (auth.uid() = user_id);

-- ---------- 4) YORUMLAR ----------
create table if not exists public.comments (
  id bigint generated always as identity primary key,
  project_id bigint not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
alter table public.comments enable row level security;

drop policy if exists "yorumlar herkes okur" on public.comments;
create policy "yorumlar herkes okur" on public.comments for select using (true);

drop policy if exists "girisli yorum yazar" on public.comments;
create policy "girisli yorum yazar" on public.comments for insert with check (auth.uid() = user_id);

drop policy if exists "kendi yorumunu siler" on public.comments;
create policy "kendi yorumunu siler" on public.comments for delete using (auth.uid() = user_id);

-- ---------- 5) OYNAMA SAYACI (herkes tetikleyebilir, sadece +1 yapar) ----------
create or replace function public.increment_plays(pid bigint)
returns void language sql security definer set search_path = public as $$
  update public.projects set plays = plays + 1 where id = pid;
$$;
grant execute on function public.increment_plays(bigint) to anon, authenticated;

-- ---------- 6) İSTATİSTİK GÖRÜNÜMLERİ ----------
create or replace view public.project_stats
with (security_invoker = true) as
select
  p.id as project_id,
  coalesce(v.cnt, 0)::int as votes,
  coalesce(c.cnt, 0)::int as comments,
  p.plays
from public.projects p
left join (select project_id, count(*) cnt from public.votes group by 1) v on v.project_id = p.id
left join (select project_id, count(*) cnt from public.comments group by 1) c on c.project_id = p.id;

grant select on public.project_stats to anon, authenticated;

create or replace view public.comments_view
with (security_invoker = true) as
select c.id, c.project_id, c.body, c.created_at, c.user_id,
       coalesce(pr.username, 'anonim') as username
from public.comments c
left join public.profiles pr on pr.id = c.user_id;

grant select on public.comments_view to anon, authenticated;

-- ---------- 7) MODERATÖR YETKİLERİ ----------
-- ÖNEMLİ: aşağıdaki UID senin admin hesabın (config.js ile aynı olmalı)
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select auth.uid() = 'f8f1eaa0-b720-44f4-a993-2d919b6d57cc'::uuid;
$$;

drop policy if exists "admin projeleri gunceller" on public.projects;
create policy "admin projeleri gunceller" on public.projects
  for update using (public.is_admin());

drop policy if exists "admin projeleri siler" on public.projects;
create policy "admin projeleri siler" on public.projects
  for delete using (public.is_admin());

drop policy if exists "admin yorum siler" on public.comments;
create policy "admin yorum siler" on public.comments
  for delete using (public.is_admin());

-- =====================================================================
-- BİTTİ ✓  Şimdi yeni zip'i Netlify'a yükleyebilirsin.
-- =====================================================================
