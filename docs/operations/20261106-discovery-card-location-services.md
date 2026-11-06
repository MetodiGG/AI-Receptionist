# Discovery cards: location, service rows and directions

Prepared 2026-11-06 on `codex/discovery-card-location-services` from main
`a72beb39f17169e40fb4d6785a5763546e158f88`.

## Scope

- Every GoRez/catalogue card has a top-left pin label. Exact destination points
  retain real device/city-centre distance. Without a usable point/origin, display
  the published quarter/address/city instead, never guessed kilometres.
- Service-area records say “На твой адрес” / “At your address”; missing addresses
  are explicitly unconfirmed. No runtime geocoding or new Nominatim batch.
- Replace the joined service paragraph with up to three vertical rows. Matching
  services lead; current first-party prices are matched by normalized service
  name. Missing, malformed or conflicting prices are omitted, not zero-filled.
- Navigation says “Как да стигна” / “Directions” and still opens the same Maps
  directions URL without sending a visitor origin. Independent Google content
  attribution is preserved for the optional legacy Google path.
- Preserve equal card footer baselines, existing appointment actions, details
  dialog, ranking and the free catalogue provider mode.

## Verification

- `pnpm test`: 940 passed, zero failed.
- `pnpm build`: successful.
- `git diff --check`: passed.
- Local provider-free catalogue preview in BG/EN at 320, 390 and 1280 px:
  Abi Beauty · Лозенец, Belami Studio · Park Center / WestMall and eyebrow
  shaping results; visible location labels, per-service prices and no card/row
  overflow. Footer top coordinates are equal across the eyebrow result cards.
- Unit coverage includes all 595 current catalogue records, both reported
  address-only examples, fixed/service-area/unknown addresses, device versus
  city-centre distance, hidden/duplicate services, zero/from/unknown/malformed
  and conflicting prices, and translated navigation with unchanged attribution.

No schema migration, environment/key/quota change, paid provider test, new
dependency, booking write or customer/business-profile edit is required.
