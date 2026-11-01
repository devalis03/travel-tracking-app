alter table public.trips
add column if not exists local_id text;

create unique index if not exists trips_user_local_id_idx
on public.trips (user_id, local_id)
where local_id is not null;

grant insert on public.cities to authenticated;

drop policy if exists "Authenticated users can add cities" on public.cities;
create policy "Authenticated users can add cities"
on public.cities for insert
to authenticated
with check (true);

insert into storage.buckets (id, name, public)
values ('travel-photos', 'travel-photos', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload their own travel photos" on storage.objects;
create policy "Users can upload their own travel photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'travel-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users can view their own travel photos" on storage.objects;
create policy "Users can view their own travel photos"
on storage.objects for select
to authenticated
using (
  bucket_id = 'travel-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users can delete their own travel photos" on storage.objects;
create policy "Users can delete their own travel photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'travel-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
