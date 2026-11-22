# Public English content cache

Prepared locally on 2026-11-22. This adds English **display metadata**, not a second business catalogue. Original Bulgarian fields, identities, service IDs, amounts, currencies, pricing conditions, photographs, filtering, eligibility, booking destinations and booking writes remain the source of truth.

## Translation and provenance

`lib/locale/service-english.json` contains exact source-keyed translations for 6,040 names, 1,790 post-pricing-presentation descriptions and 660 units. Category-specific names are resolved before the generic name. The server decorates public response projections after filtering, price interpretation and photograph association. Clients import only lightweight display selectors; the static dictionary and resolver are not part of client dependency graphs.

An initial draft was produced **offline** using the Helsinki-NLP / OPUS-MT contributors' [opus-mt-tc-big-bg-en model](https://huggingface.co/Helsinki-NLP/opus-mt-tc-big-bg-en), the 2022 Bulgarian–English Transformer-big release. The [original model archive](https://object.pouta.csc.fi/Tatoeba-MT-models/bul-eng/opusTCv20210807%2Bbt_transformer-big_2022-03-09.zip) is SHA-256 `a9fbf8de9f41d2bf8a37d3b9c56ed17553b95ba4d30a81462003ef88b05aea55`. The model card declares [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/); the original license is retained in [the license notice](licenses/opus-mt-tc-big-bg-en-CC-BY-4.0.txt).

Modification notice: the model was locally converted to CTranslate2 INT8 for authoring only. Its output was combined with existing explicit bilingual suggestion seeds, terminology corrections, exact-key editorial overrides and source-condition checks. Neither model weights nor an inference runtime is shipped. No source text was submitted to an external translation API, and rendering performs no translation request.

## Review evidence and limitations

All 6,040 unique source names have agent source/output review coverage across beauty/hair/nails/barber, auto/home/pets/sport/education, health, consulting and other-domain ledgers. All 660 units were individually agent reviewed. Of the 1,790 descriptions, 495 were individually compared and corrected (including all health and consulting descriptions and flagged legal, medical, financial, exclusion, scheduling and photographic-privacy cases). The remaining 1,295 received source-piece reconstruction, quantity and qualification-marker checks; they are **not claimed to have individual semantic review**. This is not a certified human translation.

The cache metadata retains exact source fingerprints, reviewer-artifact hashes, review counts and the draft hash. The offline authoring evidence is stored with the task artifacts, not loaded by the application. Automated checks prove exact coverage, literal numeric preservation, absence of untranslated Cyrillic/unknown glyphs and retention of conservative condition markers; they do not establish semantic accuracy or validate professional/medical claims.

Unknown future Cyrillic free text displays an honest English translation-pending notice until an exact translation is added. Switching to Bulgarian always preserves the original. Proper business and personal names are not semantically translated; postal labels use the project's existing transliteration. Owner/admin editable fields intentionally remain original source data. Search suggestion display labels are English, but the existing underlying search query is preserved, so selecting a Bulgarian-source suggestion may leave that original query visible in the input; changing search matching is outside this display-only change.

## Verification

Run `node scripts/check-public-english.mjs` for current public eligibility, and `node scripts/check-public-english.mjs --all` for all checked-in source rows. Focused tests cover source/price/ID preservation, category-specific names, unknown future strings, server projection ordering, public/native booking and customer-account boundaries, and transitive exclusion of the heavy cache from every client entry.

New live partner text is not silently sent elsewhere or guessed. Add a reviewed exact source key, rerun the coverage checks and review the actual context before publication.
