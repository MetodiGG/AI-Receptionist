<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Catalogue pricing reviews

For every current or future catalogue business with a website, follow its
actual “Запази час” / “Book” entry first and inspect the service menu there,
then its Services / Prices pages. A homepage-only visit or crawler signal is
not a completed pricing review. Inspect each branch and specialist where their
tariffs differ; do not infer chain-wide prices, durations or available slots.

Keep literal published amounts, currency, ranges, “from”, units, package totals,
exclusions and conditional online prices with a source URL and review date.
Never invent a price, convert an old tariff into a supposedly published one,
or copy promotions, retail products, deposits or package totals as one visit.
Conflicting, inaccessible or unpublished tariffs remain pending; obtain owner
confirmation instead of claiming complete coverage. Respect access limits and
provider terms, and never submit a booking during a pricing review.

Follow the pricing workflow in README.md. New or changed listings require a
dated review bound to their exact service inventory. Do not refresh the legacy
baseline or review fingerprints to bypass that gate. Keep newly reviewed price
qualifications in the public service description. Run `pnpm catalogue:check`,
the pricing Python tests, `pnpm test` and `pnpm build` before handoff.
