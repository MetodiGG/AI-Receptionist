# Approved supplemental address review

The user approved **at most 25 additional public-address Nominatim requests**, no client coordinates, Google calls, paid services or request-time geocoder.

- One process made 20 structured address requests and 5 named retries, at no more than one request/second. The exact allowlists and cached responses are committed beside this report.
- Six structured matches passed the exact-address checks: Abi Beauty · Лозенец, Бастет, Tsanev · Манастирски ливади, Tsanev · Захарна фабрика, Motorista and One Space.
- One existing cached result was manually disambiguated: the commercial building at the exact published address of Bruno Bastos BJJ, not a neighbouring copy shop/restaurant.
- ZONA WASH's supermarket candidate, a block-only Marry match and campus/restaurant/vending-machine Shun candidates were rejected. An approximate nearby point is not the business entrance.
- `geocodes-v4.json` adds **7** sourced points. Total reviewed OSM points: **46**, alongside **86** independently published first-party points. Remaining unknown points stay unknown; a street address is not a fabricated kilometre value.
- The OSM-derived layer remains separately downloadable as ODbL data at `/catalogue-location-data-20261106.json`. Its attribution is in the shared footer; interactive map attribution is unchanged.

No additional geocoding run is automatically authorized by these files. The script's explicit approval flag, finite allowlist, cache, single-process rate limit and fail-on-provider-error behaviour remain required. No live profiles or bookings were modified.
