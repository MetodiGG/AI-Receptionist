// Small, reviewed presentation overrides for actual public partner services.
// Business/service UUID + exact current name + category isolate each photo.
// These are not gallery guesses, price changes or invented service records.
export const REVIEWED_PARTNER_SERVICE_PHOTOS = Object.freeze([
  { businessId: 'e5b029ba-3586-485b-ac19-978a8386922d', serviceId: 'ddb089f1-4fb3-422f-8fae-5b1689c1a0da', name: 'Апарат за лице “Меган”', category: null, photoId: 'partner-megan-supplied', source: 'provided' },
  { businessId: '6b57b901-acd8-494b-a992-2cec551b4b00', serviceId: '191082c0-a7f0-4f69-88e8-149ed69eac2c', name: 'Преглед и оценка за ремонт', category: null, photoId: 'partner-car-lift-inspection', source: 'illustrative' },
  { businessId: '6b57b901-acd8-494b-a992-2cec551b4b00', serviceId: '9b74aa5f-2735-4d41-8c8b-fae2422c8a6f', name: 'Ремонт двигатели', category: null, photoId: 'sx-auto-engine-repair', source: 'illustrative' },
  { businessId: '6b57b901-acd8-494b-a992-2cec551b4b00', serviceId: '69f2e80d-6631-4fd4-8210-622272d68fcb', name: 'Зареждане и ремонт климатик', category: null, photoId: 'car-aircon-service', source: 'illustrative' },
  { businessId: 'f309d060-d96d-4237-8fa6-00db10b7ac3d', serviceId: 'cbcb6597-0b5e-44d3-9adc-e0fdf6ca8838', name: 'Боя', category: null, photoId: 'sx-hair-male-colour', source: 'illustrative' },
  { businessId: 'f309d060-d96d-4237-8fa6-00db10b7ac3d', serviceId: '6fab1326-f6fc-4ca2-ab5d-f098fadd3117', name: 'Брада + коса', category: null, photoId: 'haircut-beard-combo', source: 'illustrative' },
  { businessId: '09f6d770-cdd5-40d2-8e82-d7e2cc9e263a', serviceId: 'ef28ff51-cf90-49dc-9e1d-674713f604a2', name: 'Подстригване на коса и брада и оформяне на вежди', category: null, photoId: 'partner-hair-beard-brows-finish', source: 'illustrative' },
  { businessId: '09f6d770-cdd5-40d2-8e82-d7e2cc9e263a', serviceId: '5916e4b4-a1d3-4fe0-8b08-d489b140ee93', name: 'Подстригване на коса', category: null, photoId: 'mens-haircut', source: 'illustrative' },
  { businessId: '09f6d770-cdd5-40d2-8e82-d7e2cc9e263a', serviceId: 'ddd44c38-1dea-433a-af51-4d812eaee013', name: 'Кола маска за уши и нос', category: null, photoId: 'partner-nose-wax', source: 'illustrative' },
].map(Object.freeze))

const byService = new Map(REVIEWED_PARTNER_SERVICE_PHOTOS.map(photo => [JSON.stringify([photo.businessId, photo.serviceId]), photo]))
export function reviewedPartnerServicePhoto(service, business) {
  if (typeof business?.id !== 'string' || typeof service?.id !== 'string' || typeof service?.name !== 'string') return null
  const photo = byService.get(JSON.stringify([business.id, service.id]))
  return photo && service.name.trim() === photo.name && (service.category || null) === photo.category ? photo : null
}
