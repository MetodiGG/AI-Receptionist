# Unified discovery and orange actions — production release

## Authority and source

The owner explicitly requested publication after reviewing the local button preview. Published the accumulated reviewed changes on `codex/unified-business-rail`, not an unrelated branch or a staging Preview promotion.

- [PR #30](https://github.com/MetodiGG/AI-Receptionist/pull/30): all two Vercel checks passed, no conflicts; merged through the authenticated GitHub UI. The connector could read the repository but rejected PR creation with integration permission 403; no permissions were expanded.
- Tested branch head: `a1959c656baee68719e55e3da985eef4bd4d29fe`.
- Production/main squash commit: `691a7e58c8504ae2d8667ecc0dd25cc19f9f7709`. `git diff --exit-code origin/main HEAD` confirmed the merged tree exactly matched the tested branch before this documentation-only record.
- [Vercel deployment](https://vercel.com/ai-receptionist12/ai-receptionist/JDbk4JrrURCvApr8nmx97DCebWes) was verified in its UI as **Ready / Latest / Production / Current**, from `main` via Git integration, assigned to **www.gorez.co**. Build duration 32 seconds. No Preview environment was promoted.
- [Published site](https://www.gorez.co/?lang=bg).

## Published scope

Unified horizontal business browsing, existing-budget automatic discovery/location fallback, compact shared navigation and Home icon, shorter heading, simplified free registration, text-only registration CTA and its Free accent, bold GoRez-owned Maps navigation, and the deeper Reserve hover/focus/pressed orange matching the pressed Free gradient (`135deg / #ff9546 → #ff7725`). Card dimensions and booking destinations are unchanged.

Optional Google partner-rating preparation is included but remains **off by default**; no production flag was enabled and no business identity link was created or changed. Native Google attribution remains intact and Google/GoRez review scores are separate. Real native provider rendering is not claimed as live-tested. See the existing local review and partner-rating documents for provider-owned layout limitations.

No migration, dependency, secret, quota, paid plan, subscription, Google rating activation, business/customer/appointment edit or real reservation was performed. Existing application rate/cost limits were retained. Automatic discovery on normal visits can use the already-authorized budget; the limits are not a cap on the entire Google invoice. No manually initiated Google/AI search test was run for this publication.

## Verification

- Fresh final `pnpm test`: **788 passed, 0 failed, 0 skipped**.
- Fresh `pnpm build`: passed. `git diff --check origin/main..HEAD`: passed before merging.
- Live HTTP home BG/EN, business registration and partner directory: **200**. Both localized shorter headings are present.
- Live production stylesheets contain the exact deeper-orange Reserve hover rule, bold GoRez-owned Maps rule and text-only signup class. Registration HTML has no “30 дни безплатно” copy.
- `/dev/button-states` and `/dev/homepage`: **404** in Production.
- Anonymous GET to the new admin business discovery-link endpoint: **401 UNAUTHORIZED**, `private, no-store, max-age=0`.
- Production screenshot: `docs/review/2026-11-05/production-release-vercel-ready.png`. Deployment page left open as a deliverable.

The two successful-build warnings concern the unchanged `engines.node >=20.9.0`: Vercel selected Node 26.x rather than the project's 24.x setting and warns that future major versions may be selected automatically. This release did not change engines or runtime settings; pinning a supported major is a separate maintenance item, not silently bundled into the visual publication.

This record and its screenshot are local release evidence; adding them does not initiate another deployment.
