# Navigation, exact minutes and city focus — 30 October 2026

## Approved scope

The owner approved publishing these changes after checks, and subsequently requested the homepage city-focus correction as part of the same work.

- Remove the small NSI/EKATTE/neighbourhood explanation from shared business location fields. City data, searchable choices and custom neighbourhood entry stay intact; provenance remains in source/documentation.
- Replace the onboarding default/service duration selectors with editable integer-minute inputs. Common suggestions include 10 minutes, but do not constrain custom values such as 17. Existing validation accepts 5–1440 minutes. Named service overrides and new-row defaults are preserved. Appointment duration remains separate from the unchanged slot-start interval.
- Put client sign-in in the footer and hamburger disclosure, not as a prominent header account icon. Reuse `/account` and its existing login/registration. Guest booking is unchanged.
- Use one shared current-language button: BG switches to EN, and EN back to BG, through the existing locale callback. No new authentication/storage/routing implementation.
- Keep the navigation disclosure closed by default on desktop/mobile, with hidden links excluded from keyboard navigation; close on Escape, outside pointer or focus leaving navigation. Inner-page Home remains available, not duplicated on the homepage.
- Move the orange city focus outline from the inner select to the entire rounded control, including the location pin. Keyboard focus remains visible.

No database migration, real customer/business mutation, booking, email, provider activation, credential, quota, subscription or billing change is required or performed.

## Verification before release

- `node --test tests/*.test.mjs`: **369 passed, zero failed**. Nine new checks cover exact short/custom durations, server validation and full-duration overlap protection, city-helper removal, language/menu/account links and whole-control focus.
- `next build`: passed with Next 16.4.1; compilation, TypeScript phase and all 57 static pages completed. The package has no separate lint/typecheck script. `git diff --check`: passed.
- Local development-only onboarding fixture: 4-minute input rejected; 10-minute default reaches service step; first service changed to 17, new row inherits 10. Switching to English preserves both values. Fictional inputs only, no signup submitted.
- Compiled local homepage at 1280px and 320px: no horizontal page overflow. One language button; BG→EN→BG changes URL/content while retaining an unsubmitted search draft. Hamburger exposes client sign-in, Escape closes it, and the menu remains within the 320px viewport. Client link opens existing login and Registration options; no account created.
- Safari local check reproduces city focus and verifies a continuous outline around pin and city, rather than the offset inner rectangle. Separate temporary Safari tab closed afterward; temporary browser viewport override reset.
- Local Google Places/UI Kit/paid AI flags explicitly disabled. No search or location permission request submitted during this release QA.

Local proof: `/tmp/gorez-sofia-fixed-20261030.png`. This is local UI evidence, not proof of deployment.

## Production release and postflight

- Source `e9dd36dc38e72ed5ed998f220ff901f72f6e5525` pushed normally to main and the existing feature branch. Vercel deployment `GsbmmS4nrhaoRUjMUPM3HNwX5RLS` is Ready, Production, assigned `www.gorez.co`, with that exact main/source commit. Immutable hostname: `ai-receptionist-3xje9ct14-ai-receptionist12.vercel.app`.
- Live homepage confirms the single language button, hidden header account icon, client login in the menu/footer, and whole-city focus outline. BG→EN→BG updates the live heading and URL.
- Live business onboarding accepts editable 10 and 17 minute values and no longer renders the city source helper. No form submitted.
- Live `/account?lang=bg` shows existing login and Registration options, including the guest-booking message. No credentials entered or account created.
- Live partner page still lists only Zen Barbershop and ВЕСИ СТУДИО (2). The owner's earlier suspension of Test GoRez remains intact; no partner status changed in this release.
- Production environment variables, database, provider flags, quotas, credentials and billing remain unchanged. No real search, precise location, customer message, booking or signup was submitted.
- Live proof: `/tmp/gorez-sofia-fixed-live-20261030.png`.
