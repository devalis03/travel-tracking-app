alter table public.profiles
  add column if not exists phone text,
  add column if not exists age integer,
  add column if not exists gender text;

alter table public.profiles
  drop constraint if exists profiles_age_check;

alter table public.profiles
  add constraint profiles_age_check check (age is null or age between 13 and 120);

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
  requested_username text;
  suffix text;
  attempt integer := 0;
  profile_age integer;
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

  requested_username := lower(regexp_replace(coalesce(p_user_metadata ->> 'username', ''), '[^a-zA-Z0-9_-]+', '-', 'g'));
  requested_username := trim(both '-_' from requested_username);
  if char_length(requested_username) between 3 and 30 then
    username_base := requested_username;
  else
    username_base := lower(regexp_replace(coalesce(display_name, 'traveler'), '[^a-zA-Z0-9]+', '-', 'g'));
    username_base := trim(both '-' from username_base);
    if char_length(username_base) < 3 then
      username_base := 'traveler';
    end if;
    username_base := left(username_base, 24);
  end if;

  suffix := substr(replace(p_user_id::text, '-', ''), 1, 5);
  username_candidate := username_base;

  while exists (select 1 from public.profiles where lower(username) = lower(username_candidate)) loop
    attempt := attempt + 1;
    username_candidate := left(username_base, 24) || '-' || suffix;
    if attempt > 1 then
      username_candidate := left(username_base, 20) || '-' || suffix || '-' || attempt::text;
    end if;
  end loop;

  profile_age := case
    when (p_user_metadata ->> 'age') ~ '^[0-9]+$' then (p_user_metadata ->> 'age')::integer
    else null
  end;

  insert into public.profiles (
    id, username, display_name, phone, age, gender, bio, avatar_url
  )
  values (
    p_user_id,
    username_candidate,
    coalesce(display_name, 'Wayfarer traveler'),
    nullif(trim(p_user_metadata ->> 'phone'), ''),
    profile_age,
    nullif(trim(p_user_metadata ->> 'gender'), ''),
    nullif(trim(p_user_metadata ->> 'bio'), ''),
    nullif(trim(p_user_metadata ->> 'avatar_url'), '')
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$;

do $$
declare
  auth_user record;
begin
  for auth_user in select id, email, raw_user_meta_data from auth.users loop
    perform public.provision_auth_user(auth_user.id, auth_user.email, auth_user.raw_user_meta_data);
  end loop;
end;
$$;
