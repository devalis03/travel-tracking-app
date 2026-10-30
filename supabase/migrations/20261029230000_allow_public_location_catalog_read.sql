-- Countries and cities are non-sensitive reference data used before sign-in.
alter policy "Authenticated users can view countries"
on public.countries to anon, authenticated;

alter policy "Authenticated users can view cities"
on public.cities to anon, authenticated;

grant select on public.countries, public.cities to anon;
