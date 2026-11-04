import { validPlaceId } from '../outbound-booking.mjs'
// Only the documented event.place.id crosses the widget boundary. Never read
// Google's Shadow DOM, place names, photos, ratings or review contents.
export function selectedDiscoveryPlaceId(event,allowedIds=[]) {
 const id=event?.place?.id
 return validPlaceId(id)&&allowedIds.includes(id)?id:null
}
