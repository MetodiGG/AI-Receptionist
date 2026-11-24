# PR #81 — address lookup and directions only

The runtime starts from the exact PR #81 release, `136d99c8fd546f30a42dd0fbbefe1727f3949032`. No CSS, images, service catalogue data, booking engine, reservation handler, deployment configuration or environment settings are changed.

- Sofia registration lookup uses only the existing `claim_registration_address_lookup_v2` and `finish_registration_address_lookup_v2` functions. Missing exact matches stay unresolved; there is no request on a public page view or for customer geolocation. The database migrations in this branch are the two **already deployed** copies, not instructions to apply them again.
- Public directions use an exact reviewed branch point or verified historical exception. A browse/ranking point, customer origin, typed address, or unrelated Google identifier cannot create directions. Without destination proof, the existing action doesn't navigate; the known address remains visible.
- Public location evidence is isolated from availability, booking, notification and payment actions. Google Maps URLs do not require Google Places or a billing key.

Pre-release checks use a local fixture to simulate geocoding; do not submit a real application or reservation or run a production change to test the release.
