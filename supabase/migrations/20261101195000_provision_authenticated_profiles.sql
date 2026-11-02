create or replace function public.provision_auth_user(
  p_user_id uuid,
  p_user_email text,
  p_user_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
  username_base text;
  username_candidate text;
  suffix text;
  attempt integer := 0;
begin
  display_name := nullif(
    trim(coalesce(
      p_user_metadata ->> 'display_name',
      concat_ws(' ', p_user_metadata ->> 'first_name', p_user_metadata ->> 'last_name'),
      split_part(p_user_email, '@', 1),
      'Wayfarer traveler'
    )),
    ''
  );

  username_base := lower(regexp_replace(coalesce(display_name, 'traveler'), '[^a-zA-Z0-9]+', '-', 'g'));
  username_base := trim(both '-' from username_base);
  if char_length(username_base) < 3 then
    username_base := 'traveler';
  end if;
  username_base := left(username_base, 24);
  suffix := substr(replace(p_user_id::text, '-', ''), 1, 5);
  username_candidate := username_base;

  while exists (select 1 from public.profiles where lower(username) = lower(username_candidate)) loop
    attempt := attempt + 1;
    username_candidate := left(username_base, 24) || '-' || suffix;
    if attempt > 1 then
      username_candidate := left(username_base, 20) || '-' || suffix || '-' || attempt::text;
    end if;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (p_user_id, username_candidate, coalesce(display_name, 'Wayfarer traveler'))
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.provision_auth_user(new.id, new.email, new.raw_user_meta_data);
  return new;
end;
$$;

revoke execute on function public.provision_auth_user(uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

do $$
declare
  auth_user record;
begin
  for auth_user in select id, email, raw_user_meta_data from auth.users loop
    perform public.provision_auth_user(auth_user.id, auth_user.email, auth_user.raw_user_meta_data);
  end loop;
end;
$$;
