-- India Bay · Beta v2.04.00 · Badshah story mode cloud saves.
-- Story mode keeps its own save, separate from the open-world save, so a player can continue the story on another
-- device. Run this once in Supabase → SQL Editor. Safe to run again.
create table if not exists public.story_saves (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.story_saves enable row level security;
drop policy if exists "read own story save" on public.story_saves;
create policy "read own story save" on public.story_saves for select to authenticated using (auth.uid() = user_id);
drop policy if exists "create own story save" on public.story_saves;
create policy "create own story save" on public.story_saves for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "update own story save" on public.story_saves;
create policy "update own story save" on public.story_saves for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
