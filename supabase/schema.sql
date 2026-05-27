create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key,
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('owner', 'admin', 'technician', 'viewer')),
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_name text not null,
  address text not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table floors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  source_url text,
  source_type text not null default 'blank' check (source_type in ('blank', 'mock', 'image', 'pdf')),
  created_at timestamptz not null default now()
);

create table plan_elements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  plan_id uuid not null references floors(id) on delete cascade,
  type text not null check (type in ('wall', 'area')),
  x numeric not null,
  y numeric not null,
  width numeric,
  height numeric,
  points jsonb,
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table devices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  plan_id uuid not null references floors(id) on delete cascade,
  type text not null,
  layer text not null check (layer in ('cctv', 'access', 'alarm', 'network', 'power')),
  name text not null,
  brand text,
  model text,
  ip inet,
  location text,
  switch_associated text,
  port text,
  power text,
  installed_at date,
  technician text,
  notes text,
  x numeric not null,
  y numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table device_files (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references devices(id) on delete cascade,
  type text not null check (type in ('photo', 'document')),
  name text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create table maintenance_notes (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references devices(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create index devices_project_id_idx on devices(project_id);
create index devices_plan_id_idx on devices(plan_id);
create index plan_elements_plan_id_idx on plan_elements(plan_id);
create index device_files_device_id_idx on device_files(device_id);
create index maintenance_notes_device_id_idx on maintenance_notes(device_id);
