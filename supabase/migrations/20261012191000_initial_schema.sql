create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text not null,
  bio text,
  home_country_code text,
  avatar_url text,
  member_since timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (char_length(username) between 3 and 30),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 100)
);

create unique index profiles_username_lower_idx on public.profiles (lower(username));

create table public.user_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  public_profile boolean not null default false,
  show_stats_publicly boolean not null default false,
  show_achievements_publicly boolean not null default false,
  show_memories_publicly boolean not null default false,
  automatic_photo_suggestions boolean not null default false,
  theme text not null default 'system',
  reduce_motion boolean not null default false,
  timeline_animations boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_settings_theme_check check (theme in ('system', 'light', 'dark'))
);

create table public.countries (
  code text primary key,
  name text not null unique,
  continent text not null,
  latitude numeric not null,
  longitude numeric not null,
  atlas_name text,
  constraint countries_code_format check (code ~ '^[A-Z]{2}$'),
  constraint countries_latitude_check check (latitude between -90 and 90),
  constraint countries_longitude_check check (longitude between -180 and 180)
);

alter table public.profiles
add constraint profiles_home_country_code_fkey
foreign key (home_country_code) references public.countries (code);

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_code text not null references public.countries (code),
  latitude numeric not null,
  longitude numeric not null,
  place_id text,
  created_at timestamptz not null default now(),
  constraint cities_latitude_check check (latitude between -90 and 90),
  constraint cities_longitude_check check (longitude between -180 and 180)
);

create unique index cities_country_name_lower_idx on public.cities (country_code, lower(name));
create unique index cities_place_id_idx on public.cities (place_id) where place_id is not null;

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  destination_label text not null,
  start_date date not null,
  end_date date not null,
  favorite_place text,
  highlight text,
  would_return text not null default 'yes',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_date_range_check check (end_date >= start_date),
  constraint trips_would_return_check check (would_return in ('yes', 'no', 'unsure'))
);

create index trips_user_start_date_idx on public.trips (user_id, start_date desc);

create table public.trip_cities (
  trip_id uuid not null references public.trips (id) on delete cascade,
  city_id uuid not null references public.cities (id),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (trip_id, city_id),
  constraint trip_cities_position_check check (position >= 0)
);

create unique index trip_cities_trip_position_idx on public.trip_cities (trip_id, position);

create table public.trip_photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  storage_path text not null,
  caption text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint trip_photos_position_check check (position >= 0)
);

create unique index trip_photos_trip_position_idx on public.trip_photos (trip_id, position);
create index trip_photos_trip_id_idx on public.trip_photos (trip_id);

create table public.country_preferences (
  user_id uuid not null references public.profiles (id) on delete cascade,
  country_code text not null references public.countries (code) on delete cascade,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, country_code),
  constraint country_preferences_status_check check (status in ('next-trip', 'interested', 'not-interested'))
);

create index country_preferences_country_code_idx on public.country_preferences (country_code);

grant usage on schema public to authenticated;
grant select on public.countries, public.cities to authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.user_settings,
  public.trips,
  public.trip_cities,
  public.trip_photos,
  public.country_preferences
to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

create trigger trips_set_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

create trigger country_preferences_set_updated_at
before update on public.country_preferences
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.countries enable row level security;
alter table public.cities enable row level security;
alter table public.trips enable row level security;
alter table public.trip_cities enable row level security;
alter table public.trip_photos enable row level security;
alter table public.country_preferences enable row level security;

create policy "Users can view their own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can delete their own profile"
on public.profiles for delete
to authenticated
using ((select auth.uid()) = id);

create policy "Users can manage their own settings"
on public.user_settings for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Authenticated users can view countries"
on public.countries for select
to authenticated
using (true);

create policy "Authenticated users can view cities"
on public.cities for select
to authenticated
using (true);

create policy "Users can manage their own trips"
on public.trips for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can manage cities on their own trips"
on public.trip_cities for all
to authenticated
using (
  exists (
    select 1
    from public.trips
    where trips.id = trip_cities.trip_id
      and trips.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.trips
    where trips.id = trip_cities.trip_id
      and trips.user_id = (select auth.uid())
  )
);

create policy "Users can manage photos on their own trips"
on public.trip_photos for all
to authenticated
using (
  exists (
    select 1
    from public.trips
    where trips.id = trip_photos.trip_id
      and trips.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.trips
    where trips.id = trip_photos.trip_id
      and trips.user_id = (select auth.uid())
  )
);

create policy "Users can manage their own country preferences"
on public.country_preferences for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
