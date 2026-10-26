# Business photos

The first gallery uses the two real photos supplied for Vesi Studio (business ID
`450c5c2f-db41-476b-a21e-98cf5ee29194`). The interior is the directory cover;
the entrance is the second gallery image. Full-screen viewing preserves the
entire image. Captions, alternative text and controls support BG and EN.

Photos are currently added by the GoRez operator through a reviewed release,
not by an unauthenticated upload form. No Storage bucket, database migration,
new access permissions or paid service is required. This change does not add a
self-service photo uploader to the business or admin settings.

For each additional business:

1. Obtain photos the business has permission to publish and verify its stable ID.
2. Auto-orient and resize to a maximum of 1200 pixels wide, export WebP at quality
   82, and strip EXIF/XMP/IPTC (especially location information). Keep the source
   aspect ratio. The supplied Vesi images become 1200×1600, under 350 KB each.
3. Save uniquely versioned files under `public/businesses/<slug>/` and register
   them in `lib/business-photos.mjs`, keyed by the **business ID**, with dimensions,
   BG/EN alt text/captions and a preview focal position. Put the cover first.
4. Run the photo tests, full suite and build. Check the directory, mobile booking
   gallery, full-size images, arrows/swipe/Escape and keyboard focus restoration.

Both public APIs attach the same curated photos without another database query.
Businesses without supplied photos retain the existing icon-based layout. There
are no generated pictures, remote-image permissions or cross-business fallbacks.
The original uploaded JPEGs and their metadata are not included in the release.
