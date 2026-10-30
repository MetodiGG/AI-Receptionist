# Business photos

The first gallery uses the two real photos supplied for Vesi Studio (business ID
`450c5c2f-db41-476b-a21e-98cf5ee29194`). The interior is the directory cover;
the entrance is the second gallery image. Full-screen viewing preserves the
entire image. The same carousel works in the directory, business profile and
full-image dialog, with arrows, horizontal swipes and a five-second slideshow.
There are no visible entrance/interior captions; descriptive alternative text
and control labels support BG and EN. Manual navigation pauses rotation until
the play button is pressed. Hidden/offscreen carousels and reduced-motion
preferences do not autoplay; keyboard navigation, pause and Escape remain usable.

The original gallery above was supplied through reviewed source releases.
The follow-up self-service implementation is documented in
`business-management-2026-10-30.md`. It requires the additive media migration and
a private Storage bucket before deployment. Until that approved activation,
the live site retains its original curated-photo workflow.

Legacy source-based photo maintenance (before self-service activation):

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
