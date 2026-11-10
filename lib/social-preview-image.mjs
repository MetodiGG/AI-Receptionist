// A code-native frame for the existing, unmodified 1280×320 owner artwork.
// The useful 1000×320 area (including the whole logo, copy and phone) scales
// uniformly to 1200×384. Soft peach gradients extend the existing background;
// a narrow edge fade avoids both white letterboxing and stretched-pixel bands.
// No text is added to the image; the tagline belongs in the link's metadata.
export function socialPreviewSvg(banner) {
  const image = Buffer.from(banner).toString('base64')
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <image id="gorez-art" width="1280" height="320" xlink:href="data:image/jpeg;base64,${image}"/>
      <linearGradient id="peach-top"><stop offset="0" stop-color="#ffe3ce"/><stop offset=".52" stop-color="#fde8d7"/><stop offset=".72" stop-color="#ffcda0"/><stop offset="1" stop-color="#ffab55"/></linearGradient>
      <linearGradient id="peach-bottom"><stop offset="0" stop-color="#fdd5b1"/><stop offset=".32" stop-color="#fde3cc"/><stop offset=".52" stop-color="#ffe5d4"/><stop offset=".72" stop-color="#fdd7b0"/><stop offset="1" stop-color="#ffb76b"/></linearGradient>
      <linearGradient id="background-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="black"/><stop offset="1" stop-color="white"/></linearGradient>
      <linearGradient id="art-fade" gradientUnits="userSpaceOnUse" x1="0" y1="123" x2="0" y2="507"><stop offset="0" stop-color="black"/><stop offset=".04" stop-color="white"/><stop offset=".98" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient>
      <mask id="background-blend"><path d="M0 0H1200V630H0Z" fill="url(#background-fade)"/></mask>
      <mask id="art-blend" maskUnits="userSpaceOnUse" x="0" y="123" width="1200" height="384"><path d="M0 123H1200V507H0Z" fill="url(#art-fade)"/></mask>
    </defs>
    <path d="M0 0H1200V630H0Z" fill="url(#peach-top)"/>
    <path d="M0 0H1200V630H0Z" fill="url(#peach-bottom)" mask="url(#background-blend)"/>
    <g mask="url(#art-blend)"><svg x="0" y="123" width="1200" height="384" viewBox="280 0 1000 320" preserveAspectRatio="none" overflow="hidden"><use xlink:href="#gorez-art"/></svg></g>
  </svg>`
}
