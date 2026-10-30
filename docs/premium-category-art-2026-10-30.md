# Premium realistic category art — 30 October 2026

## Local implementation, not published

Requested alongside local-partner priority: replace the old flat category
symbols, especially the homepage shortcuts and Zen Barbershop's directory
illustration, with more premium realistic imagery. This is a visual change,
not a change to business classification, ownership, booking, prices or provider
configuration. The earlier media migration/Storage approval is still pending.

## Art and provenance

- Used the built-in `image_gen` path of the imagegen skill, not a CLI/API key.
  Twelve separate transparent generations, one per asset, in a shared realistic
  material style: polished steel, graphite, warm copper/orange, glass and paper.
- Full final shared prompt, individual subjects and source PNG filenames:
  `category-art-prompts-2026-10-30.json`. Original generated PNGs remain in the
  local generated-images folder; no originals or source metadata are publicly
  served. There are no new remote images, brand logos, identifiable people or
  generated business-interior photographs.
- Final project assets: `public/category-art/{hair,barber,nails,car,sports,beauty,
  education,consulting,home,pets,health,appointments}[-sm]-v1.webp`.
  The 128px and 256px variants preserve alpha and have no EXIF/XMP metadata.
  The existing GoRez vector logo, functional navigation icons and real business
  photo galleries are unchanged.
- Mechanical preparation script: `scripts/prepare-category-art.mjs`. It checks
  real source transparency, normalizes framing with transparent safe padding,
  downsizes and encodes WebP using the existing pinned Sharp dependency.
  It does not generate/edit content, remove backgrounds, repaint pixels or
  contact an API. For deliberate regeneration, pass the folder containing the
  original PNGs named in the prompt record; only the versioned output art files
  are replaced. Do not run it against arbitrary user-image folders.

## Integration

- Shared `BusinessCategoryIcon` provides local responsive images, fixed layout
  sizes, async decoding, decorative empty alt/aria-hidden treatment and visible
  adjacent BG/EN labels. It never accepts an arbitrary image URL.
- Homepage/search shortcuts retain Hair / Nails / Car wash / Sports and their
  existing stored identifiers. Four readable two-column tactile tiles on mobile;
  a warm selected state keeps dark materials visible instead of tinting icons.
- Partner directory: choose category art from public name and active services.
  **Zen Barbershop → barber clipper**, nail-focused businesses → nail polish,
  general beauty → mirror/serum. This is a display heuristic only, not a verified
  business subtype, a saved classification, a partner verification step or a
  per-tenant hardcoded identity override.
- Search cards, no-photo profile placeholders and admin business/application
  category markers share the same artwork. Real uploaded/curated gallery photos
  still take precedence; art is never inserted into the photos array or presented
  as the business's actual interior, team, product or logo.
- `/dev/category-art` is a development/mock-only, clearly labelled design fixture.
  It reuses the actual directory component and disables booking links/analytics.
  Zen is only a name reference; no real address, services or prices are copied.
  Production must return 404 for this fixture.

## Performance and verification

- All 24 WebP assets combined: **273,326 bytes**. Homepage four small variants:
  **27,780 bytes**; four larger variants for higher-density displays:
  **77,554 bytes**. The browser selects the variant; not all twelve assets are
  requested on the homepage. This adds ordinary local static-asset transfer,
  not a paid image-generation call on visitor requests or a guaranteed bill cap.
- **410 automated tests passed**, zero failures: all previous tests plus image
  mapping/prototype-safe URLs, genuine alpha, size/dimension/metadata checks,
  responsive decorative markup, real-photo precedence and fixture guards.
- Local browser QA at 390px BG and 320px EN: four images loaded, no horizontal
  overflow, category selection preserved and no search request on selection.
  The guarded Zen design card loads the barber image and the nail example a
  distinct nail image. A mock Връбница search retains partner-first grouping and
  exactly one partner badge, with separate external cards. No real Google/AI
  discovery call, geolocation permission, cloud mutation, reservation or email.
- Local screenshots:
  `/tmp/gorez-premium-icons-home-mobile-local-20261030.png` and
  `/tmp/gorez-premium-icons-zen-mobile-local-20261030.png`.
- Final compiled homepage proof (390px, all four icons loaded, document width
  equals viewport width, without development tools):
  `/tmp/gorez-premium-icons-home-compiled-mobile-20261030.png`.
- Final optimized Next.js 16.4.1 build passed, including its TypeScript phase
  and 58 prerendered pages. Compiled local checks: homepage 200, barber WebP 200
  with `image/webp` / 13,580-byte response; `/dev/category-art` and `/dev/discovery`
  both 404 in production mode. No production deployment or Supabase change is
  implied by these local checks.
- Combined partner-priority proof after the art integration:
  `/tmp/gorez-partners-first-premium-mobile-local-20261030.png`.
