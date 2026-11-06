// Only the owners' actual trial-lesson premises, not every city, class,
// franchise territory or ordinary course registration counted as a booking.
import { reviewed } from './reviewed-record.mjs'

export default [
  ...[
    { id: 'geo-milev', name: 'Гео Милев', address: 'кв. Гео Милев, ул. Манастирска 17А', neighborhood: 'Гео Милев', phone: '+359878482950' },
    { id: 'darvenitsa', name: 'Дървеница', address: 'кв. Дървеница, бул. Андрей Ляпчев 11', neighborhood: 'Дървеница', phone: '+359878850031' },
    { id: 'lyulin', name: 'Люлин', address: 'ж.к. Люлин 8, ул. 3004-та 5', neighborhood: 'Люлин 8', phone: '+359882752835' },
    { id: 'manastirski-livadi', name: 'Манастирски ливади', address: 'кв. Манастирски ливади, бл. 61, вх. Д, к-с Авалон', neighborhood: 'Манастирски ливади', phone: '+359892600917' },
    { id: 'nadezhda', name: 'Надежда', address: 'кв. Надежда 2, ул. Йосиф Хербст 2', neighborhood: 'Надежда 2', phone: '+359898543272' },
  ].map(branch => reviewed({ ...branch, id: `amakids-${branch.id}`, name: `AMAkids · ${branch.name}`, category: 'education', address: `София, ${branch.address}`, website: 'https://www.amakids.bg/',
    services: ['Пробен урок за деца'], evidenceUrl: `https://www.amakids.bg/nashite-tsentrove/sofia-${branch.id}`, excerpt: 'Запиши пробен урок' })),
  // The Vitosha centre says its groups are not announced yet: it is pending,
  // not padded into an active premises total. Online is not another venue.
  ...[
    { id: 'pitagor', name: 'Академия Питагор', address: 'бул. Никола Мушанов 147, ж.к. Красна поляна 3', neighborhood: 'Красна поляна 3' },
    { id: 'mladost', name: 'Интелект Младост', address: 'ж.к. Младост 2, бул. Андрей Ляпчев 261А, вх. 2, ет. 1', neighborhood: 'Младост 2' },
  ].map(branch => reviewed({ ...branch, id: `algorithmics-${branch.id}`, name: `Algorithmics · ${branch.name}`, category: 'education', address: `София, ${branch.address}`, website: 'https://www.algorithmics.bg/', phone: '+359879879899',
    services: ['Пробен урок по програмиране за деца'], bookingUrl: 'https://www.algorithmics.bg/proben-urok', evidenceUrl: 'https://www.algorithmics.bg/proben-urok', contactUrl: 'https://www.algorithmics.bg/lokatsii', excerpt: 'намираме място в група за неговата възраст' })),
]
