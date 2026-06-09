create table public.project_documents (
  id text primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  share_token uuid not null default gen_random_uuid() unique,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index project_documents_organization_id_idx
  on public.project_documents(organization_id);

create index project_documents_share_token_idx
  on public.project_documents(share_token);

alter table public.project_documents enable row level security;

create policy "organization members manage project documents"
on public.project_documents for all to authenticated
using (organization_id = public.current_organization_id())
with check (
  organization_id = public.current_organization_id()
  and owner_id = auth.uid()
);

create or replace function public.get_shared_project(project_key text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select payload
  from public.project_documents
  where share_token::text = project_key or id = project_key
  limit 1
$$;

grant execute on function public.get_shared_project(text) to anon, authenticated;
