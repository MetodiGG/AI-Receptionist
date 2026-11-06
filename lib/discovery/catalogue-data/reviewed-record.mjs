// A compact authoring helper, never an automatic approval/import service.
// Reviewers must supply literal, checked first-party facts for every call.
export function reviewed({ id, name, category, address, neighborhood = null, website, phone = null, services, bookingUrl,
  evidenceUrl = website, contactUrl = evidenceUrl, excerpt, model = 'appointment', serviceArea = false, coordinates = null, openingHours }) {
  return { id: `sofia-${id}`, name, category, cityCode: '68134', neighborhood, address,
    locationKind: serviceArea ? 'service_area' : 'premises', coordinates, website, phone,
    services: services.map(service => ({ category, appointmentModel: model, ...(typeof service === 'string' ? { name: service } : service) })),
    ...(openingHours ? { openingHours } : {}), booking: bookingUrl ? { kind: 'form', url: bookingUrl } : { kind: 'phone', phone },
    verification: { status: 'approved', checkedOn: '2026-11-06', validUntil: '2027-02-04', booking: { url: evidenceUrl, excerpt }, contact: contactUrl } }
}
