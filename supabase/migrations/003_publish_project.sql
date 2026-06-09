create or replace function public.publish_project_document(
  project_id text,
  project_share_token uuid,
  project_payload jsonb,
  project_updated_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  current_organization_id uuid;
  current_email text;
begin
  if current_user_id is null then
    raise exception 'Debes iniciar sesion para publicar un proyecto.';
  end if;

  select organization_id
  into current_organization_id
  from public.users
  where id = current_user_id;

  if current_organization_id is null then
    select email into current_email
    from auth.users
    where id = current_user_id;

    insert into public.organizations(name)
    values ('Liconex')
    returning id into current_organization_id;

    insert into public.users(id, organization_id, name, email, role)
    values (
      current_user_id,
      current_organization_id,
      coalesce(split_part(current_email, '@', 1), 'Usuario'),
      current_email,
      'owner'
    )
    on conflict (id) do update
      set organization_id = excluded.organization_id;
  end if;

  insert into public.project_documents(
    id,
    organization_id,
    owner_id,
    share_token,
    payload,
    updated_at
  )
  values (
    project_id,
    current_organization_id,
    current_user_id,
    project_share_token,
    project_payload,
    project_updated_at
  )
  on conflict (id) do update set
    share_token = excluded.share_token,
    payload = excluded.payload,
    updated_at = excluded.updated_at;
end;
$$;

grant execute on function public.publish_project_document(text, uuid, jsonb, timestamptz)
to authenticated;
