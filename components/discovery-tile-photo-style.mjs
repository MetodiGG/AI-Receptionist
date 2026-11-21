// Presentation-only focal points for the existing generic discovery artwork.
// Exact source keys never replace an image or alter catalogue/partner data.
const photoPositions = new Map([
  ['/category-photos/hair-v2.webp', '50% 0%'],
  ['/category-photos/hair-2x-v2.webp', '50% 0%'],
  ['/category-photos/consulting-v2.webp', '50% 0%'],
  ['/category-photos/consulting-2x-v2.webp', '50% 0%'],
  ['/category-photos/home_services-v2.webp', '50% 0%'],
  ['/category-photos/home_services-2x-v2.webp', '50% 0%'],
  ['/category-photos/health-v2.webp', '50% 0%'],
  ['/category-photos/health-2x-v2.webp', '50% 0%'],
  ['/category-photos/education-v2.webp', '50% 0%'],
  ['/category-photos/education-2x-v2.webp', '50% 0%'],
  ['/category-photos/pets-v2.webp', '50% 0%'],
  ['/category-photos/pets-2x-v2.webp', '50% 0%'],
  ['/category-photos/other-v4.webp', '50% 0%'],
  ['/category-photos/other-2x-v4.webp', '50% 0%'],
  ['/service-photos/womens-haircut-v1.webp', '50% 0%'],
  ['/service-photos/kids-haircut-v1.webp', '50% 0%'],
  ['/service-photos/formal-updo-v1.webp', '55% 0%'],
  ['/service-photos/sx-career-consultation-v1.webp', '50% 0%'],
])

export function discoveryTilePhotoStyle(source) {
  return { '--inline-photo-position': photoPositions.get(source) || 'center' }
}
