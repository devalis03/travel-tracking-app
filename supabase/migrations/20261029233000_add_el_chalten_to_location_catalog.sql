insert into public.cities (name, country_code, latitude, longitude)
values ('El Chalten', 'AR', -49.3315, -72.8863)
on conflict (country_code, lower(name))
do update set
  latitude = excluded.latitude,
  longitude = excluded.longitude;
