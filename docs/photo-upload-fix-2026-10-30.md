# Business photo upload correction — 30 October 2026

## Scope and cause

Owner reported ordinary business photos being rejected with a request for smaller
files. The old browser preparer required a WebP blob even on an engine that
silently returns PNG for an unsupported WebP encoder. It mislabeled that format
fallback as a size error. Original inputs were also capped at 20 MiB / 40 MP and
an application could reject the combined photo size at its final step.

## Changes

- Browser preparation accepts individual originals up to 50 MiB / 64 MP,
  sequentially, and emits correctly typed WebP or a JPEG/PNG compatibility result.
  Unsupported WebP encoding is detected from the returned blob, not assumed.
- JPEG fallbacks have a white rather than black transparency background. Each
  prepared photo is at most 200,000 bytes and 1,600 pixels along its longest edge;
  detailed photos progressively reduce dimensions rather than failing immediately.
- HEIC/HEIF is accepted when the browser can decode it natively. Unsupported
  decoding gets a specific JPG/browser message; no new codec package or paid
  conversion service is introduced. HEIC originals never reach the server.
- Large combined gallery/team applications are recompressed locally to fit the
  existing request bound. Staff indices and gallery ordering remain unchanged.
- A batch retains valid selections if one file is unreadable; progress and ready
  counts are shown. Concurrent/stale picker updates are guarded.
- Server independently verifies actual image bytes and strips metadata/GPS,
  auto-orients and re-encodes to WebP. Detailed images can be resized further to
  satisfy the unchanged private bucket's 1 MiB limit.
- Existing 12-photo gallery, one current portrait per specialist, permission/
  consent checks, request limits, ownership isolation, private Storage and
  optimistic revisions remain. No migration, credential change, plan upgrade,
  dependency, Google/AI request, email or real business/customer edit is required.

## Verification

- 422 tests passed; optimized Next.js build/TypeScript phase passed.
- Regression tests include PNG-for-WebP behavior, JPEG fallback, large/48 MP
  inputs, HEIC decode success/failure, memory cleanup, adaptive sizing, bounded
  originals, partial selections and a bounded multipart application containing
  12 gallery + 20 staff files with exact staff positions.
- Actual in-app-browser local check: selected four synthetic originals together
  (25,768,493-byte JPEG; 9,841,785-byte PNG; 48 MP oriented JPEG; WebP).
  All four were automatically prepared. Shared application body parsing and
  actual server normalization returned HTTP 200/count 4, final WebP sizes
  233,784 / 228,214 / 3,500 / 3,130 bytes. No Storage or database writes.
- Built-production local smoke: GET `/dev/photo-upload` and POST
  `/dev/photo-upload/check` both return 404. The QA route is development-only,
  same-origin and bounded; it never imports a database, mailer or Storage client.
- Native Safari/HEIC file-chooser verification remains pending while the Mac
  is locked; the compatibility fallback is regression-tested but should not be
  presented as an actual Safari-device test yet.

Proof: `/tmp/gorez-photo-upload-four-browser-test-20261030.png`.
Local logs: `/tmp/gorez-photo-upload-tests-20261030.log`,
`/tmp/gorez-photo-upload-build-20261030.log`.

## Release

Owner explicitly approved publication after verification.

- Protected existing Preview branch received patch `7e6526c`; cloud build Ready.
  Its actual business-application picker prepared all four synthetic originals.
- Production received only patch `6e53b6a` from the existing main base `ac5bf32`,
  via non-forced fast-forward. The separate review-mail test harness/credentials
  are not included in this Production patch.
- Deployment **7Hziqx4VhbhxQKBc2jAkexqwBUg7**, Ready / Production / Current,
  assigned **www.gorez.co** and
  `ai-receptionist-2t5ptofob-ai-receptionist12.vercel.app`; cloud build 32s.
- The live business-application page prepared all four original files and showed
  **4 снимки са готови за качване**. All four thumbnail images loaded with expected
  dimensions, including correct orientation of the 48 MP input.
- Production development-only QA page and POST endpoint returned 404. Guest media
  management API returned 401. No application was submitted, new account created,
  real business changed, or test photo saved in a real gallery. Authenticated
  persistence to a real business remains deliberately untested in this release.
- The synthetic files were selected only for browser validation, not submitted;
  the temporary live form is cleared/closed after the proof screenshot.

Live proof: `/tmp/gorez-photo-upload-live-four-ready-20261030.png`.
Deployment proof: `/tmp/gorez-photo-upload-production-ready-20261030.png`.

## Technical references

- [Canvas toBlob format fallback](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)
- [WebKit native HEIC support](https://webkit.org/blog/14445/webkit-features-in-safari-17-0/)
