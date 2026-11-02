-- Diagnostic only: this script does not insert, update, or delete data.
-- Expected values come from:
-- supabase/migrations/20261012192000_seed_location_catalog.sql

-- 1) Basic row counts. Expected: 202 countries and 235 cities.
select
  (select count(*) from public.countries) as countries_count,
  202 as expected_countries_count,
  (select count(*) from public.cities) as cities_count,
  235 as expected_cities_count,
  (select count(*) from public.countries) = 202 as countries_count_ok,
  (select count(*) from public.cities) = 235 as cities_count_ok;

-- 2) Countries grouped by continent.
select continent, count(*) as countries_count
from public.countries
group by continent
order by continent;

-- 3) Cities whose country reference is missing.
-- Expected: zero rows.
select c.id, c.name, c.country_code
from public.cities as c
left join public.countries as country on country.code = c.country_code
where country.code is null
order by c.country_code, c.name;

-- 4) Duplicate city names within the same country.
-- Expected: zero rows.
select country_code, lower(name) as normalized_name, count(*) as duplicate_count
from public.cities
group by country_code, lower(name)
having count(*) > 1
order by country_code, normalized_name;

-- 5) Required catalog samples.
-- Expected to return one row per requested country/city.
select code, name, continent, atlas_name
from public.countries
where code in ('AR', 'BR', 'ES', 'JP', 'US')
order by code;

select name, country_code, latitude, longitude
from public.cities
where (name, country_code) in (
  ('Buenos Aires', 'AR'),
  ('Madrid', 'ES'),
  ('Tokyo', 'JP'),
  ('New York', 'US')
)
order by country_code, name;

-- 6) RLS status for the catalog tables.
-- Expected: relrowsecurity = true for both rows.
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relname in ('countries', 'cities')
  and relnamespace = 'public'::regnamespace
order by relname;
