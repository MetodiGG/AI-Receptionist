# Simplified registration address — 12 November 2026

The owner revised the prepared, unpublished map-pin requirement. Signup must
remain city → optional neighbourhood → street and number. A map link,
coordinates and map-confirmation checkbox must not be additional signup steps.
Keep the existing `address` storage field and full-address directions logic;
only its registration label changes to “Улица и номер” / “Street and number”.

The prepared `20261112143000_registration_location.sql` INSERT guard was never
applied in Production. It must not be deployed, as it would reject legitimate
registrations without coordinates. Its removal does not undo any live data or
Touch and care center's already-corrected point. Approval-email changes remain
independent and the email migration has already been applied, without backfill.

## Approved automatic lookup

After the policy/restrictions explanation, on 12 November the owner explicitly
said “Активирай Nominatim, в такъв случай.” This supersedes the earlier one-time
catalogue-only permission for the narrow new-registration lookup described here.
No paid geocoding service, autocomplete or bulk backfill is enabled.

Current official policy: https://operations.osmfoundation.org/policies/nominatim/

The implementation is limited to moderate end-user-driven
public-business registrations, not autocomplete, visitor searches, POI harvesting
or scheduled bulk backfills. Use a shared application-wide throttle below one
request per second, a single logical worker, an identifying User-Agent, a durable
address cache, provider switch/disable configuration and source/licence records.
Never send account emails, phone numbers, visitor coordinates, personal home
addresses or confidential data. OSM attribution and ODbL obligations apply.

The provider does not guarantee precision or availability. Accept only a
non-conflicting exact city/street/building-number candidate, never a street,
quarter or city centre. Apply a result only if the saved address still matches
and no manually corrected point would be overwritten. Missing, ambiguous or
failed lookup must leave signup successful and the location for admin review;
never invent a kilometre value.

Validated first-party catalogue pins may still be carried over at an exact
matching address. This does not independently verify every applicant's address.
Existing map-point corrections are never overwritten. The unchanged manual
admin control remains the fallback, not an additional owner signup step.

## Wiring, limits and activation

Apply `20261112153000_registration_address_lookup.sql` before deploying the app;
the public business query joins its attribution sidecar. The migration adds a
private shared cache/gate and published-only source metadata. It does not send
HTTP, backfill businesses, change reservations or require a signup map point.

Successful public applications and legacy authenticated native setup schedule
one bounded lookup after durable creation. Explicit successful admin approval
can retry unresolved locations. Neither visitor searches nor the notifications
cron invoke this provider. Registration success never depends on lookup success.

- One HTTP request per admitted lookup, five-second timeout, bounded 128 KiB
  response; no automatic provider retry loop or requests while typing.
- A shared database lease permits only one logical request at a time, with
  15 seconds between starts and an initial conservative 250 admitted lookups
  per UTC day. These are GoRez safety limits, NOT a promised free provider quota.
  Throttled/ambiguous requests remain for administrator review; do not invent km.
- Exact matches cache for 30 days, misses for one day, technical failures for
  five minutes. Cached hits do not use the global HTTP budget.
- `REGISTRATION_ADDRESS_LOOKUP_ENABLED=false` stops all lookups without a code
  change. `REGISTRATION_ADDRESS_GEOCODER_URL` selects an owner-configured HTTPS
  Nominatim-compatible endpoint without a software update; the default is the
  explicitly approved `https://nominatim.openstreetmap.org/search`.
- Query contents are only the saved public street/building, quarter and official
  city. The identifying GoRez User-Agent uses the public site/contact address.
  Emails, phones, business names, client locations, apartment/personal/confidential
  details are excluded. Unsupported address strings go to manual review.
- Sidecar records retain the OSM element URL, licence and attribution. Existing
  public search-page footer credits OSM; geocoded business profiles additionally
  show source/ODbL links. Public source rows require an active published business
  with still-matching coordinates/address. Any later address change invalidates
  an unchanged provider-derived point; a deliberate manual correction is kept.

The approval email uses its independent outbox. No existing-owner email backfill,
real test booking or test notification is authorized by enabling address lookup.
