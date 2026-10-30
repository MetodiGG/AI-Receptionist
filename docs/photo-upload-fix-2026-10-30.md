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

Owner explicitly approved publication after verification. Preview/Production
deployment verification is pending at this checkpoint. The previous review-mail
test harness/credentials are not part of this Production patch.

## Technical references

- [Canvas toBlob format fallback](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)
- [WebKit native HEIC support](https://webkit.org/blog/14445/webkit-features-in-safari-17-0/)
