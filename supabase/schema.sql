create extension if not exists pgcrypto;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'owner' check (role in ('owner', 'admin', 'technician', 'viewer')),
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_name text not null,
  address text not null default '',
  active_plan_id uuid,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.floors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  source_url text,
  source_type text not null default 'blank' check (source_type in ('blank', 'mock', 'image', 'pdf')),
  created_at timestamptz not null default now()
);

alter table public.projects
  add constraint projects_active_plan_id_fkey
  foreign key (active_plan_id) references public.floors(id) on delete set null;

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  plan_id uuid not null references public.floors(id) on delete cascade,
  type text not null,
  layer text not null check (layer in ('cctv', 'access', 'alarm', 'network', 'power')),
  name text not null,
  brand text not null default '',
  model text not null default '',
  ip text not null default '',
  location text not null default '',
  switch_associated text not null default '',
  port text not null default '',
  power text not null default '',
  installed_at date,
  technician text not null default '',
  notes text not null default '',
  x double precision not null,
  y double precision not null,
  coverage_angle double precision,
  coverage_direction double precision,
  coverage_range double precision,
  marker_size double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plan_elements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  plan_id uuid not null references public.floors(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  type text not null check (type in ('wall', 'area', 'cable', 'junction')),
  x double precision not null,
  y double precision not null,
  width double precision,
  height double precision,
  points jsonb,
  label text,
  cable_type text check (cable_type in ('underground', 'in_wall', 'galvanized_pipe', 'pvc_duct')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.device_files (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  type text not null check (type in ('photo', 'document')),
  name text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create table public.maintenance_notes (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create table public.project_documents (
  id text primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  share_token uuid not null default gen_random_uuid() unique,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index projects_organization_id_idx on public.projects(organization_id);
create index floors_project_id_idx on public.floors(project_id);
create index devices_project_id_idx on public.devices(project_id);
create index devices_plan_id_idx on public.devices(plan_id);
create index plan_elements_plan_id_idx on public.plan_elements(plan_id);
create index plan_elements_device_id_idx on public.plan_elements(device_id);
create index device_files_device_id_idx on public.device_files(device_id);
create index maintenance_notes_device_id_idx on public.maintenance_notes(device_id);
create index project_documents_organization_id_idx on public.project_documents(organization_id);
create index project_documents_share_token_idx on public.project_documents(share_token);

create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.users where id = auth.uid()
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_organization_id uuid;
begin
  insert into public.organizations(name)
  values (coalesce(new.raw_user_meta_data ->> 'organization_name', 'Liconex'))
  returning id into new_organization_id;

  insert into public.users(id, organization_id, name, email, role)
  values (
    new.id,
    new_organization_id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    'owner'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.floors enable row level security;
alter table public.devices enable row level security;
alter table public.plan_elements enable row level security;
alter table public.device_files enable row level security;
alter table public.maintenance_notes enable row level security;
alter table public.project_documents enable row level security;

create policy "organization members can view organization"
on public.organizations for select to authenticated
using (id = public.current_organization_id());

create policy "organization members can view users"
on public.users for select to authenticated
using (organization_id = public.current_organization_id());

create policy "organization members can update their profile"
on public.users for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and organization_id = public.current_organization_id());

create policy "organization members manage projects"
on public.projects for all to authenticated
using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create policy "organization members manage floors"
on public.floors for all to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = floors.project_id
      and projects.organization_id = public.current_organization_id()
  )
)
with check (
  exists (
    select 1 from public.projects
    where projects.id = floors.project_id
      and projects.organization_id = public.current_organization_id()
  )
);

create policy "organization members manage devices"
on public.devices for all to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = devices.project_id
      and projects.organization_id = public.current_organization_id()
  )
)
with check (
  exists (
    select 1 from public.projects
    where projects.id = devices.project_id
      and projects.organization_id = public.current_organization_id()
  )
);

create policy "organization members manage plan elements"
on public.plan_elements for all to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = plan_elements.project_id
      and projects.organization_id = public.current_organization_id()
  )
)
with check (
  exists (
    select 1 from public.projects
    where projects.id = plan_elements.project_id
      and projects.organization_id = public.current_organization_id()
  )
);

create policy "organization members manage device files"
on public.device_files for all to authenticated
using (
  exists (
    select 1
    from public.devices
    join public.projects on projects.id = devices.project_id
    where devices.id = device_files.device_id
      and projects.organization_id = public.current_organization_id()
  )
)
with check (
  exists (
    select 1
    from public.devices
    join public.projects on projects.id = devices.project_id
    where devices.id = device_files.device_id
      and projects.organization_id = public.current_organization_id()
  )
);

create policy "organization members manage maintenance notes"
on public.maintenance_notes for all to authenticated
using (
  exists (
    select 1
    from public.devices
    join public.projects on projects.id = devices.project_id
    where devices.id = maintenance_notes.device_id
      and projects.organization_id = public.current_organization_id()
  )
)
with check (
  exists (
    select 1
    from public.devices
    join public.projects on projects.id = devices.project_id
    where devices.id = maintenance_notes.device_id
      and projects.organization_id = public.current_organization_id()
  )
);

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

insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

create policy "organization members read project storage"
on storage.objects for select to authenticated
using (
  bucket_id = 'project-files'
  and (storage.foldername(name))[1] = public.current_organization_id()::text
);

create policy "organization members upload project storage"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'project-files'
  and (storage.foldername(name))[1] = public.current_organization_id()::text
);

create policy "organization members update project storage"
on storage.objects for update to authenticated
using (
  bucket_id = 'project-files'
  and (storage.foldername(name))[1] = public.current_organization_id()::text
)
with check (
  bucket_id = 'project-files'
  and (storage.foldername(name))[1] = public.current_organization_id()::text
);

create policy "organization members delete project storage"
on storage.objects for delete to authenticated
using (
  bucket_id = 'project-files'
  and (storage.foldername(name))[1] = public.current_organization_id()::text
);
