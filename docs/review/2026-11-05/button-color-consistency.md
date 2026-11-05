# Reserve / Free colour consistency — local only

The owner requested the same pale-orange resting appearance for “Резервирай час” and “Безплатно”, becoming more saturated only on interaction. No deployment, provider request, database write or paid activation.

- Resting palette shared exactly: gradient `#ffe5c5 → #ffc58d`, text `#602b11`, border `#eaa66e`, identical inset/drop shadow.
- Hover and keyboard focus share the same more saturated `#ffac62 → #ff8d3f` palette; pressing retains the existing darker orange on both controls. Keyboard focus remains visible and reduced-motion rules remain intact.
- Removed the unguarded Reserve hover brightness filter so disabled controls do not appear interactive. Google-owned native content and attribution are unchanged.
- The guarded development-only `/dev/button-states` uses the full “Резервирай час” label and has no functional links, providers or booking handlers.

## Checks

- 821 automated tests passed, no failures. The regression asserts identical background, foreground, border and shadow in the resting, hover/focus and pressed states, not merely similar hardcoded hues.
- Production build / TypeScript checks passed.
- Offline browser inspection at 900 px confirmed both resting palettes match exactly, and an actual Reserve hover produced `linear-gradient(135deg, rgb(255, 172, 98), rgb(255, 141, 63))`. Tab focus reached Reserve with the same accent and a 3 px visible outline. Temporary viewport override was reset.
- Evidence: `button-colors-rest.png` and `button-colors-reserve-hover.png` in this directory. These are design-only local fixtures, not real reservations.
