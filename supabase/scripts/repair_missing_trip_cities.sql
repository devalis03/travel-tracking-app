-- Repairs the historical trips whose rows in public.trips exist but whose
-- public.trip_cities relations were never created.
--
-- This script is intentionally limited to the nine known local_id values
-- from the affected account/export. It does not modify trips, photos, or
-- existing trip-city relations. It is safe to run more than once.

begin;

create temporary table trip_city_repair (
  local_id text not null,
  position integer not null,
  city_name text not null,
  country_code text not null,
  latitude numeric not null,
  longitude numeric not null,
  primary key (local_id, position)
) on commit drop;

insert into trip_city_repair (local_id, position, city_name, country_code, latitude, longitude)
values
  ('trip-mw5y8v2o-v4ny', 0, 'El Chalten', 'AR', -49.3315, -72.8863),
  ('trip-mw5yke6a-zx3i', 0, 'Bogota', 'CO', 4.711, -74.0721),
  ('madrid-2026', 0, 'Madrid', 'ES', 40.4168, -3.7038),
  ('madrid-2026', 1, 'Toledo', 'ES', 39.8628, -4.0273),
  ('tokyo-kyoto-2025', 0, 'Tokyo', 'JP', 35.6762, 139.6503),
  ('tokyo-kyoto-2025', 1, 'Kyoto', 'JP', 35.0116, 135.7681),
  ('barcelona-2025', 0, 'Barcelona', 'ES', 41.3874, 2.1686),
  ('seville-lisbon-porto-2025', 0, 'Seville', 'ES', 37.3891, -5.9845),
  ('seville-lisbon-porto-2025', 1, 'Lisbon', 'PT', 38.7223, -9.1393),
  ('seville-lisbon-porto-2025', 2, 'Porto', 'PT', 41.1579, -8.6291),
  ('rome-florence-2024', 0, 'Rome', 'IT', 41.9028, 12.4964),
  ('rome-florence-2024', 1, 'Florence', 'IT', 43.7696, 11.2558),
  ('rio-2024', 0, 'Rio de Janeiro', 'BR', -22.9068, -43.1729),
  ('buenos-aires-2023', 0, 'Buenos Aires', 'AR', -34.6037, -58.3816),
  ('buenos-aires-2023', 1, 'Mendoza', 'AR', -32.8908, -68.8272);

-- Add only catalog entries that are not already present. The catalog has a
-- case-insensitive unique index, so this avoids duplicate city rows.
insert into public.cities (name, country_code, latitude, longitude)
select repair.city_name, repair.country_code, repair.latitude, repair.longitude
from trip_city_repair as repair
where not exists (
  select 1
  from public.cities as city
  where city.country_code = repair.country_code
    and lower(city.name) = lower(repair.city_name)
);

-- Repair only trips that currently have no city relation. Existing relations
-- are left untouched, including any manually corrected trip.
insert into public.trip_cities (trip_id, city_id, position)
select trip.id, city.id, repair.position
from trip_city_repair as repair
join public.trips as trip
  on trip.local_id = repair.local_id
join public.cities as city
  on city.country_code = repair.country_code
 and lower(city.name) = lower(repair.city_name)
where not exists (
  select 1
  from public.trip_cities as existing_relation
  where existing_relation.trip_id = trip.id
);

commit;

-- Verification: expected 15 repaired relations for the affected account.
select
  count(*) as repaired_trip_city_relations,
  15 as expected_trip_city_relations,
  count(*) = 15 as repair_count_ok
from public.trip_cities as relation
join public.trips as trip on trip.id = relation.trip_id
where trip.local_id in (
  'trip-mw5y8v2o-v4ny',
  'trip-mw5yke6a-zx3i',
  'madrid-2026',
  'tokyo-kyoto-2025',
  'barcelona-2025',
  'seville-lisbon-porto-2025',
  'rome-florence-2024',
  'rio-2024',
  'buenos-aires-2023'
);

select
  trip.local_id,
  trip.destination_label,
  count(relation.city_id) as city_count
from public.trips as trip
left join public.trip_cities as relation on relation.trip_id = trip.id
where trip.local_id in (
  'trip-mw5y8v2o-v4ny',
  'trip-mw5yke6a-zx3i',
  'madrid-2026',
  'tokyo-kyoto-2025',
  'barcelona-2025',
  'seville-lisbon-porto-2025',
  'rome-florence-2024',
  'rio-2024',
  'buenos-aires-2023'
)
group by trip.local_id, trip.destination_label
order by trip.local_id;
