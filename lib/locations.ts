import type { CityInfo, Continent, CountryMeta } from "@/lib/types"

/**
 * Central location service. Every screen that needs to know "which country
 * is this city in?", "what continent is this country on?" or "find me a
 * destination called X" goes through this module — nothing else in the app
 * does its own city/country matching.
 *
 * The data is a structured prototype dataset (full canonical country list +
 * a few hundred major cities). It is deliberately shaped like the response
 * of a places provider (id, name, ISO code, coordinates), so swapping in a
 * real geocoding API later only means replacing `searchCities`.
 */

const CONTINENT_BY_KEY: Record<string, Continent> = {
  AF: "Africa",
  AS: "Asia",
  EU: "Europe",
  NA: "North & Central America",
  SA: "South America",
  OC: "Oceania",
  AN: "Antarctica",
}

// code|name|continent|lat|lon
const COUNTRY_ROWS = `
DZ|Algeria|AF|28.03|1.66
AO|Angola|AF|-11.2|17.87
BJ|Benin|AF|9.31|2.32
BW|Botswana|AF|-22.33|24.68
BF|Burkina Faso|AF|12.24|-1.56
BI|Burundi|AF|-3.37|29.92
CV|Cabo Verde|AF|16.0|-24.01
CM|Cameroon|AF|7.37|12.35
CF|Central African Republic|AF|6.61|20.94
TD|Chad|AF|15.45|18.73
KM|Comoros|AF|-11.88|43.87
CG|Republic of the Congo|AF|-0.23|15.83
CD|DR Congo|AF|-4.04|21.76
CI|Côte d'Ivoire|AF|7.54|-5.55
DJ|Djibouti|AF|11.83|42.59
EG|Egypt|AF|26.82|30.8
GQ|Equatorial Guinea|AF|1.65|10.27
ER|Eritrea|AF|15.18|39.78
SZ|Eswatini|AF|-26.52|31.47
ET|Ethiopia|AF|9.15|40.49
GA|Gabon|AF|-0.8|11.61
GM|Gambia|AF|13.44|-15.31
GH|Ghana|AF|7.95|-1.02
GN|Guinea|AF|9.95|-9.7
GW|Guinea-Bissau|AF|11.8|-15.18
KE|Kenya|AF|-0.02|37.91
LS|Lesotho|AF|-29.61|28.23
LR|Liberia|AF|6.43|-9.43
LY|Libya|AF|26.34|17.23
MG|Madagascar|AF|-18.77|46.87
MW|Malawi|AF|-13.25|34.3
ML|Mali|AF|17.57|-3.99
MR|Mauritania|AF|21.0|-10.94
MU|Mauritius|AF|-20.35|57.55
MA|Morocco|AF|31.79|-7.09
MZ|Mozambique|AF|-18.67|35.53
NA|Namibia|AF|-22.96|18.49
NE|Niger|AF|17.61|8.08
NG|Nigeria|AF|9.08|8.68
RW|Rwanda|AF|-1.94|29.87
ST|São Tomé and Príncipe|AF|0.19|6.61
SN|Senegal|AF|14.5|-14.45
SC|Seychelles|AF|-4.68|55.49
SL|Sierra Leone|AF|8.46|-11.78
SO|Somalia|AF|5.15|46.2
ZA|South Africa|AF|-30.56|22.94
SS|South Sudan|AF|6.88|31.31
SD|Sudan|AF|12.86|30.22
TZ|Tanzania|AF|-6.37|34.89
TG|Togo|AF|8.62|0.82
TN|Tunisia|AF|33.89|9.54
UG|Uganda|AF|1.37|32.29
ZM|Zambia|AF|-13.13|27.85
ZW|Zimbabwe|AF|-19.02|29.15
AF|Afghanistan|AS|33.94|67.71
AM|Armenia|AS|40.07|45.04
AZ|Azerbaijan|AS|40.14|47.58
BH|Bahrain|AS|26.07|50.56
BD|Bangladesh|AS|23.68|90.36
BT|Bhutan|AS|27.51|90.43
BN|Brunei|AS|4.54|114.73
KH|Cambodia|AS|12.57|104.99
CN|China|AS|35.86|104.2
GE|Georgia|AS|42.32|43.36
IN|India|AS|20.59|78.96
ID|Indonesia|AS|-0.79|113.92
IR|Iran|AS|32.43|53.69
IQ|Iraq|AS|33.22|43.68
IL|Israel|AS|31.05|34.85
JP|Japan|AS|36.2048|138.2529
JO|Jordan|AS|30.59|36.24
KZ|Kazakhstan|AS|48.02|66.92
KW|Kuwait|AS|29.31|47.48
KG|Kyrgyzstan|AS|41.2|74.77
LA|Laos|AS|19.86|102.5
LB|Lebanon|AS|33.85|35.86
MY|Malaysia|AS|4.21|101.98
MV|Maldives|AS|3.2|73.22
MN|Mongolia|AS|46.86|103.85
MM|Myanmar|AS|21.91|95.96
NP|Nepal|AS|28.39|84.12
KP|North Korea|AS|40.34|127.51
OM|Oman|AS|21.51|55.92
PK|Pakistan|AS|30.38|69.35
PS|Palestine|AS|31.95|35.23
PH|Philippines|AS|12.88|121.77
QA|Qatar|AS|25.35|51.18
SA|Saudi Arabia|AS|23.89|45.08
SG|Singapore|AS|1.35|103.82
KR|South Korea|AS|35.91|127.77
LK|Sri Lanka|AS|7.87|80.77
SY|Syria|AS|34.8|38.99
TW|Taiwan|AS|23.7|120.96
TJ|Tajikistan|AS|38.86|71.28
TH|Thailand|AS|15.87|100.99
TL|Timor-Leste|AS|-8.87|125.73
TR|Turkey|AS|38.96|35.24
TM|Turkmenistan|AS|38.97|59.56
AE|United Arab Emirates|AS|23.42|53.85
UZ|Uzbekistan|AS|41.38|64.59
VN|Vietnam|AS|14.06|108.28
YE|Yemen|AS|15.55|48.52
AL|Albania|EU|41.15|20.17
AD|Andorra|EU|42.55|1.6
AT|Austria|EU|47.52|14.55
BY|Belarus|EU|53.71|27.95
BE|Belgium|EU|50.5|4.47
BA|Bosnia and Herzegovina|EU|43.92|17.68
BG|Bulgaria|EU|42.73|25.49
HR|Croatia|EU|45.1|15.2
CY|Cyprus|EU|35.13|33.43
CZ|Czechia|EU|49.82|15.47
DK|Denmark|EU|56.26|9.5
EE|Estonia|EU|58.6|25.01
FI|Finland|EU|61.92|25.75
FR|France|EU|46.23|2.21
DE|Germany|EU|51.17|10.45
GR|Greece|EU|39.07|21.82
HU|Hungary|EU|47.16|19.5
IS|Iceland|EU|64.96|-19.02
IE|Ireland|EU|53.41|-8.24
IT|Italy|EU|41.8719|12.5674
XK|Kosovo|EU|42.6|20.9
LV|Latvia|EU|56.88|24.6
LI|Liechtenstein|EU|47.17|9.56
LT|Lithuania|EU|55.17|23.88
LU|Luxembourg|EU|49.82|6.13
MT|Malta|EU|35.94|14.38
MD|Moldova|EU|47.41|28.37
MC|Monaco|EU|43.74|7.42
ME|Montenegro|EU|42.71|19.37
NL|Netherlands|EU|52.13|5.29
MK|North Macedonia|EU|41.61|21.75
NO|Norway|EU|60.47|8.47
PL|Poland|EU|51.92|19.15
PT|Portugal|EU|39.3999|-8.2245
RO|Romania|EU|45.94|24.97
RU|Russia|EU|61.52|105.32
SM|San Marino|EU|43.94|12.46
RS|Serbia|EU|44.02|21.01
SK|Slovakia|EU|48.67|19.7
SI|Slovenia|EU|46.15|14.99
ES|Spain|EU|40.4637|-3.7492
SE|Sweden|EU|60.13|18.64
CH|Switzerland|EU|46.82|8.23
UA|Ukraine|EU|48.38|31.17
GB|United Kingdom|EU|55.38|-3.44
VA|Vatican City|EU|41.9|12.45
AG|Antigua and Barbuda|NA|17.06|-61.8
BS|Bahamas|NA|25.03|-77.4
BB|Barbados|NA|13.19|-59.54
BZ|Belize|NA|17.19|-88.5
CA|Canada|NA|56.13|-106.35
CR|Costa Rica|NA|9.75|-83.75
CU|Cuba|NA|21.52|-77.78
DM|Dominica|NA|15.41|-61.37
DO|Dominican Republic|NA|18.74|-70.16
SV|El Salvador|NA|13.79|-88.9
GD|Grenada|NA|12.12|-61.68
GL|Greenland|NA|71.71|-42.6
GT|Guatemala|NA|15.78|-90.23
HT|Haiti|NA|18.97|-72.29
HN|Honduras|NA|15.2|-86.24
JM|Jamaica|NA|18.11|-77.3
MX|Mexico|NA|23.63|-102.55
NI|Nicaragua|NA|12.87|-85.21
PA|Panama|NA|8.54|-80.78
PR|Puerto Rico|NA|18.22|-66.59
KN|Saint Kitts and Nevis|NA|17.36|-62.78
LC|Saint Lucia|NA|13.91|-60.98
VC|Saint Vincent and the Grenadines|NA|12.98|-61.29
TT|Trinidad and Tobago|NA|10.69|-61.22
US|United States|NA|37.09|-95.71
AR|Argentina|SA|-38.4161|-63.6167
BO|Bolivia|SA|-16.29|-63.59
BR|Brazil|SA|-14.235|-51.9253
CL|Chile|SA|-35.68|-71.54
CO|Colombia|SA|4.57|-74.3
EC|Ecuador|SA|-1.83|-78.18
GY|Guyana|SA|4.86|-58.93
PY|Paraguay|SA|-23.44|-58.44
PE|Peru|SA|-9.19|-75.02
SR|Suriname|SA|3.92|-56.03
UY|Uruguay|SA|-32.52|-55.77
VE|Venezuela|SA|6.42|-66.59
AU|Australia|OC|-25.27|133.78
FJ|Fiji|OC|-17.71|178.07
KI|Kiribati|OC|1.87|-157.4
MH|Marshall Islands|OC|7.13|171.18
FM|Micronesia|OC|7.43|150.55
NR|Nauru|OC|-0.52|166.93
NC|New Caledonia|OC|-20.9|165.62
NZ|New Zealand|OC|-40.9|174.89
PW|Palau|OC|7.51|134.58
PG|Papua New Guinea|OC|-6.31|143.96
PF|French Polynesia|OC|-17.68|-149.41
WS|Samoa|OC|-13.76|-172.1
SB|Solomon Islands|OC|-9.65|160.16
TO|Tonga|OC|-21.18|-175.2
TV|Tuvalu|OC|-7.11|177.65
VU|Vanuatu|OC|-15.38|166.96
AQ|Antarctica|AN|-82.86|135
`

// The world-atlas topology uses its own spellings for some countries. Only
// the ones that differ from our canonical name need an entry.
const ATLAS_NAME_BY_CODE: Record<string, string> = {
  US: "United States of America",
  CD: "Dem. Rep. Congo",
  CG: "Congo",
  CF: "Central African Rep.",
  GQ: "Eq. Guinea",
  SZ: "eSwatini",
  SS: "S. Sudan",
  BA: "Bosnia and Herz.",
  DO: "Dominican Rep.",
  SB: "Solomon Is.",
  PF: "Fr. Polynesia",
}

export const WORLD_COUNTRIES: CountryMeta[] = COUNTRY_ROWS.trim()
  .split("\n")
  .map((row) => {
    const [code, name, continentKey, lat, lon] = row.split("|")
    return { code, name, continent: CONTINENT_BY_KEY[continentKey], lat: Number(lat), lon: Number(lon) }
  })

const COUNTRY_BY_CODE = new Map(WORLD_COUNTRIES.map((c) => [c.code, c]))
const COUNTRY_BY_ATLAS_NAME = new Map(
  WORLD_COUNTRIES.flatMap((c) => {
    const entries: Array<[string, CountryMeta]> = [[c.name, c]]
    if (ATLAS_NAME_BY_CODE[c.code]) entries.push([ATLAS_NAME_BY_CODE[c.code], c])
    return entries
  }),
)

export function getWorldCountry(code: string): CountryMeta | undefined {
  return COUNTRY_BY_CODE.get(code)
}

/** Resolves a `world-atlas` feature name (e.g. "Dem. Rep. Congo") to a country. */
export function getCountryByAtlasName(name: string): CountryMeta | undefined {
  return COUNTRY_BY_ATLAS_NAME.get(name)
}

export function getAtlasName(code: string): string | undefined {
  return ATLAS_NAME_BY_CODE[code] ?? COUNTRY_BY_CODE.get(code)?.name
}

// name|country code|lat|lon
const CITY_ROWS = `
Milan|IT|45.4642|9.19
Milazzo|IT|38.2203|15.2397
Milano Marittima|IT|44.2833|12.3500
Rome|IT|41.9028|12.4964
Florence|IT|43.7696|11.2558
Venice|IT|45.4408|12.3155
Naples|IT|40.8518|14.2681
Turin|IT|45.0703|7.6869
Bologna|IT|44.4949|11.3426
Genoa|IT|44.4056|8.9463
Verona|IT|45.4384|10.9916
Pisa|IT|43.7228|10.4017
Siena|IT|43.3188|11.3308
Palermo|IT|38.1157|13.3615
Catania|IT|37.5079|15.083
Bari|IT|41.1171|16.8719
Amalfi|IT|40.634|14.6027
Como|IT|45.8081|9.0852
Paris|FR|48.8566|2.3522
Lyon|FR|45.764|4.8357
Marseille|FR|43.2965|5.3698
Nice|FR|43.7102|7.262
Bordeaux|FR|44.8378|-0.5792
Toulouse|FR|43.6047|1.4442
Strasbourg|FR|48.5734|7.7521
Cannes|FR|43.5528|7.0174
Madrid|ES|40.4168|-3.7038
Toledo|ES|39.8628|-4.0273
Barcelona|ES|41.3874|2.1686
Seville|ES|37.3891|-5.9845
Valencia|ES|39.4699|-0.3763
Granada|ES|37.1773|-3.5986
Malaga|ES|36.7213|-4.4214
Bilbao|ES|43.263|-2.935
San Sebastian|ES|43.3183|-1.9812
Cordoba|ES|37.8882|-4.7794
Palma de Mallorca|ES|39.5696|2.6502
Lisbon|PT|38.7223|-9.1393
Porto|PT|41.1579|-8.6291
Faro|PT|37.0194|-7.9304
Coimbra|PT|40.2033|-8.4103
Funchal|PT|32.6669|-16.9241
Berlin|DE|52.52|13.405
Munich|DE|48.1351|11.582
Hamburg|DE|53.5511|9.9937
Frankfurt|DE|50.1109|8.6821
Cologne|DE|50.9375|6.9603
Dresden|DE|51.0504|13.7373
Amsterdam|NL|52.3676|4.9041
Rotterdam|NL|51.9244|4.4777
Brussels|BE|50.8503|4.3517
Bruges|BE|51.2093|3.2247
Zurich|CH|47.3769|8.5417
Geneva|CH|46.2044|6.1432
Lucerne|CH|47.0502|8.3093
Vienna|AT|48.2082|16.3738
Salzburg|AT|47.8095|13.055
Prague|CZ|50.0755|14.4378
Budapest|HU|47.4979|19.0402
Warsaw|PL|52.2297|21.0122
Krakow|PL|50.0647|19.945
Athens|GR|37.9838|23.7275
Santorini|GR|36.3932|25.4615
Thessaloniki|GR|40.6401|22.9444
London|GB|51.5072|-0.1276
Edinburgh|GB|55.9533|-3.1883
Manchester|GB|53.4808|-2.2426
Birmingham|GB|52.4862|-1.8904
Dublin|IE|53.3498|-6.2603
Reykjavik|IS|64.1466|-21.9426
Copenhagen|DK|55.6761|12.5683
Stockholm|SE|59.3293|18.0686
Oslo|NO|59.9139|10.7522
Helsinki|FI|60.1699|24.9384
Tallinn|EE|59.437|24.7536
Riga|LV|56.9496|24.1052
Vilnius|LT|54.6872|25.2797
Moscow|RU|55.7558|37.6173
Saint Petersburg|RU|59.9311|30.3609
Kyiv|UA|50.4501|30.5234
Bucharest|RO|44.4268|26.1025
Sofia|BG|42.6977|23.3219
Belgrade|RS|44.7866|20.4489
Zagreb|HR|45.815|15.9819
Dubrovnik|HR|42.6507|18.0944
Split|HR|43.5081|16.4402
Ljubljana|SI|46.0569|14.5058
Sarajevo|BA|43.8563|18.4131
Valletta|MT|35.8989|14.5146
Istanbul|TR|41.0082|28.9784
Ankara|TR|39.9334|32.8597
Antalya|TR|36.8969|30.7133
Tokyo|JP|35.6762|139.6503
Kyoto|JP|35.0116|135.7681
Osaka|JP|34.6937|135.5023
Sapporo|JP|43.0618|141.3545
Hiroshima|JP|34.3853|132.4553
Nara|JP|34.6851|135.8049
Yokohama|JP|35.4437|139.638
Seoul|KR|37.5665|126.978
Busan|KR|35.1796|129.0756
Beijing|CN|39.9042|116.4074
Shanghai|CN|31.2304|121.4737
Hong Kong|CN|22.3193|114.1694
Shenzhen|CN|22.5431|114.0579
Chengdu|CN|30.5728|104.0668
Taipei|TW|25.033|121.5654
Bangkok|TH|13.7563|100.5018
Chiang Mai|TH|18.7883|98.9853
Phuket|TH|7.8804|98.3923
Hanoi|VN|21.0278|105.8342
Ho Chi Minh City|VN|10.8231|106.6297
Da Nang|VN|16.0544|108.2022
Singapore|SG|1.3521|103.8198
Kuala Lumpur|MY|3.139|101.6869
Jakarta|ID|-6.2088|106.8456
Bali|ID|-8.3405|115.092
Manila|PH|14.5995|120.9842
Phnom Penh|KH|11.5564|104.9282
Siem Reap|KH|13.3671|103.8448
Vientiane|LA|17.9757|102.6331
Kathmandu|NP|27.7172|85.324
Delhi|IN|28.6139|77.209
Mumbai|IN|19.076|72.8777
Bangalore|IN|12.9716|77.5946
Jaipur|IN|26.9124|75.7873
Goa|IN|15.2993|74.124
Colombo|LK|6.9271|79.8612
Dubai|AE|25.2048|55.2708
Abu Dhabi|AE|24.4539|54.3773
Doha|QA|25.2854|51.531
Riyadh|SA|24.7136|46.6753
Jeddah|SA|21.4858|39.1925
Tel Aviv|IL|32.0853|34.7818
Jerusalem|IL|31.7683|35.2137
Amman|JO|31.9454|35.9284
Petra|JO|30.3285|35.4444
Beirut|LB|33.8938|35.5018
Tehran|IR|35.6892|51.389
Tbilisi|GE|41.7151|44.8271
Yerevan|AM|40.1792|44.4991
Baku|AZ|40.4093|49.8671
Tashkent|UZ|41.2995|69.2401
Almaty|KZ|43.222|76.8512
Ulaanbaatar|MN|47.8864|106.9057
Cairo|EG|30.0444|31.2357
Luxor|EG|25.6872|32.6396
Marrakech|MA|31.6295|-7.9811
Casablanca|MA|33.5731|-7.5898
Fes|MA|34.0181|-5.0078
Tunis|TN|36.8065|10.1815
Algiers|DZ|36.7538|3.0588
Lagos|NG|6.5244|3.3792
Accra|GH|5.6037|-0.187
Dakar|SN|14.7167|-17.4677
Nairobi|KE|-1.2921|36.8219
Mombasa|KE|-4.0435|39.6682
Addis Ababa|ET|9.0301|38.7578
Dar es Salaam|TZ|-6.7924|39.2083
Zanzibar|TZ|-6.1659|39.2026
Kampala|UG|0.3476|32.5825
Kigali|RW|-1.9441|30.0619
Cape Town|ZA|-33.9249|18.4241
Johannesburg|ZA|-26.2041|28.0473
Durban|ZA|-29.8587|31.0218
Windhoek|NA|-22.5609|17.0658
Victoria Falls|ZW|-17.9243|25.8572
Antananarivo|MG|-18.8792|47.5079
New York|US|40.7128|-74.006
Los Angeles|US|34.0522|-118.2437
San Francisco|US|37.7749|-122.4194
Chicago|US|41.8781|-87.6298
Miami|US|25.7617|-80.1918
Boston|US|42.3601|-71.0589
Washington|US|38.9072|-77.0369
Seattle|US|47.6062|-122.3321
Las Vegas|US|36.1699|-115.1398
New Orleans|US|29.9511|-90.0715
Austin|US|30.2672|-97.7431
Honolulu|US|21.3069|-157.8583
Anchorage|US|61.2181|-149.9003
Toronto|CA|43.6532|-79.3832
Vancouver|CA|49.2827|-123.1207
Montreal|CA|45.5017|-73.5673
Quebec City|CA|46.8139|-71.208
Banff|CA|51.1784|-115.5708
Mexico City|MX|19.4326|-99.1332
Cancun|MX|21.1619|-86.8515
Guadalajara|MX|20.6597|-103.3496
Oaxaca|MX|17.0732|-96.7266
Havana|CU|23.1136|-82.3666
San Jose|CR|9.9281|-84.0907
Panama City|PA|8.9824|-79.5199
Antigua Guatemala|GT|14.5586|-90.7295
San Juan|PR|18.4655|-66.1057
Kingston|JM|17.9712|-76.7936
Punta Cana|DO|18.5601|-68.3725
Nassau|BS|25.0443|-77.3504
Buenos Aires|AR|-34.6037|-58.3816
Mendoza|AR|-32.8908|-68.8272
Cordoba|AR|-31.4201|-64.1888
Bariloche|AR|-41.1335|-71.3103
Ushuaia|AR|-54.8019|-68.303
Salta|AR|-24.7821|-65.4232
Rosario|AR|-32.9442|-60.6505
Rio de Janeiro|BR|-22.9068|-43.1729
Sao Paulo|BR|-23.5505|-46.6333
Salvador|BR|-12.9777|-38.5016
Brasilia|BR|-15.7939|-47.8828
Florianopolis|BR|-27.5954|-48.548
Recife|BR|-8.0476|-34.877
Santiago|CL|-33.4489|-70.6693
Valparaiso|CL|-33.0472|-71.6127
Lima|PE|-12.0464|-77.0428
Cusco|PE|-13.5319|-71.9675
Bogota|CO|4.711|-74.0721
Medellin|CO|6.2442|-75.5812
Cartagena|CO|10.391|-75.4794
Quito|EC|-0.1807|-78.4678
La Paz|BO|-16.4897|-68.1193
Montevideo|UY|-34.9011|-56.1645
Punta del Este|UY|-34.9667|-54.95
Asuncion|PY|-25.2637|-57.5759
Caracas|VE|10.4806|-66.9036
Sydney|AU|-33.8688|151.2093
Melbourne|AU|-37.8136|144.9631
Brisbane|AU|-27.4698|153.0251
Perth|AU|-31.9505|115.8605
Cairns|AU|-16.9186|145.7781
Auckland|NZ|-36.8485|174.7633
Wellington|NZ|-41.2866|174.7756
Queenstown|NZ|-45.0312|168.6626
Christchurch|NZ|-43.5321|172.6362
Suva|FJ|-18.1248|178.4501
Papeete|PF|-17.5516|-149.5585
`

export interface LocationCity {
  /** Stable identifier — a provider place ID would slot in here. */
  id: string
  name: string
  countryCode: string
  lat: number
  lon: number
}

export const WORLD_CITIES: LocationCity[] = CITY_ROWS.trim()
  .split("\n")
  .map((row) => {
    const [name, countryCode, lat, lon] = row.split("|")
    return { id: `${name}-${countryCode}`.toLowerCase().replace(/\s+/g, "-"), name, countryCode, lat: Number(lat), lon: Number(lon) }
  })

function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

const INDEXED_CITIES = WORLD_CITIES.map((city) => ({
  city,
  key: normalize(city.name),
  countryKey: normalize(COUNTRY_BY_CODE.get(city.countryCode)?.name ?? ""),
}))

const INDEXED_COUNTRIES = WORLD_COUNTRIES.map((country) => ({ country, key: normalize(country.name) }))

export interface CitySearchResult {
  city: LocationCity
  country: CountryMeta
}

/**
 * Searches the city dataset. Matches on city name first (prefix, then word
 * prefix, then substring) and, when the query is a country name, returns that
 * country's cities so "Italy" or "Japan" also works as a starting point.
 */
export function searchCities(query: string, limit = 8): CitySearchResult[] {
  const q = normalize(query)
  if (!q) return []

  const scored: Array<{ result: CitySearchResult; score: number }> = []
  for (const entry of INDEXED_CITIES) {
    let score = -1
    if (entry.key === q) score = 0
    else if (entry.key.startsWith(q)) score = 1
    else if (entry.key.split(/[\s-]+/).some((word) => word.startsWith(q))) score = 2
    else if (entry.key.includes(q)) score = 3
    else if (entry.countryKey.startsWith(q)) score = 4
    if (score < 0) continue
    const country = COUNTRY_BY_CODE.get(entry.city.countryCode)
    if (!country) continue
    scored.push({ result: { city: entry.city, country }, score })
  }

  return scored
    .sort((a, b) => a.score - b.score || a.result.city.name.localeCompare(b.result.city.name))
    .slice(0, limit)
    .map((s) => s.result)
}

export function searchCountries(query: string, limit = 8): CountryMeta[] {
  const q = normalize(query)
  const matches = q
    ? INDEXED_COUNTRIES.filter((entry) => entry.key.includes(q)).sort(
        (a, b) => Number(!a.key.startsWith(q)) - Number(!b.key.startsWith(q)) || a.key.localeCompare(b.key),
      )
    : INDEXED_COUNTRIES
  return matches.slice(0, limit).map((entry) => entry.country)
}

/** Converts a search result (or a manual entry) into the `CityInfo` stored on a trip. */
export function toCityInfo(city: LocationCity): CityInfo {
  return { name: city.name, lat: city.lat, lon: city.lon, countryCode: city.countryCode, placeId: city.id }
}

/** Fallback for a destination the dataset doesn't know: the user supplies the country. */
export function createManualCity(name: string, country: CountryMeta): CityInfo {
  return { name: name.trim(), lat: country.lat, lon: country.lon, countryCode: country.code }
}

export function cityKey(city: Pick<CityInfo, "name" | "countryCode">): string {
  return `${normalize(city.name)}|${city.countryCode}`
}
