// Owner-approved publication eligibility, not deletion or a rewrite of the
// first-party pricing/source history. Only exact reviewed rows are hidden.
export const NONBOOKABLE_CATALOGUE_ITEMS = Object.freeze([
  {
    "businessId": "sofia-sf-dent",
    "name": "Флуорна паста Profluorid за домашна употреба (флакон)",
    "category": "other",
    "sourceUrl": "https://sfdent.eu/pricing",
    "reason": "Home-use fluoride paste bottle; retail product, not a bookable treatment.",
    "checkedOn": "2026-11-12"
  },
  {
    "businessId": "sofia-sf-dent",
    "name": "Глас-йономерен цимент (капсула)",
    "category": "other",
    "sourceUrl": "https://sfdent.eu/pricing",
    "reason": "Priced capsule of glass-ionomer cement; material unit, no procedure specified.",
    "checkedOn": "2026-11-12"
  },
  {
    "businessId": "sofia-sf-dent",
    "name": "Кост – допълнителна доза",
    "category": "other",
    "sourceUrl": "https://sfdent.eu/pricing",
    "reason": "Additional bone-material dose, distinct from the separately listed augmentation procedure.",
    "checkedOn": "2026-11-12"
  },
  {
    "businessId": "sofia-sf-dent",
    "name": "Еластични пръстени за протеза върху импланти (O-ring set)",
    "category": "other",
    "sourceUrl": "https://sfdent.eu/pricing",
    "reason": "O-ring accessory set for an implant-supported denture, not a fitting or replacement procedure.",
    "checkedOn": "2026-11-12"
  },
  {
    "businessId": "sofia-sf-dent",
    "name": "Myobrace апарат (прегледите и следващите етапи се заплащат отделно)",
    "category": "other",
    "sourceUrl": "https://sfdent.eu/pricing",
    "reason": "Appliance-only price; source explicitly charges examinations and subsequent treatment stages separately.",
    "checkedOn": "2026-11-12"
  },
  {
    "businessId": "sofia-sf-dent",
    "name": "Потребителска такса за посещение по НЗОК",
    "category": "other",
    "sourceUrl": "https://sfdent.eu/pricing",
    "reason": "Patient charge under NHIF; not an independent bookable service.",
    "checkedOn": "2026-11-12"
  },
  {
    "businessId": "sofia-sf-dent",
    "name": "Такса преглед по НЗОК (нов пациент)",
    "category": "other",
    "sourceUrl": "https://sfdent.eu/pricing",
    "reason": "Administrative NHIF examination charge; not a complete independently priced examination.",
    "checkedOn": "2026-11-12"
  },
  {
    "businessId": "sofia-sf-dent",
    "name": "Потребителска такса по НЗОК за пенсионери",
    "category": "other",
    "sourceUrl": "https://sfdent.eu/pricing",
    "reason": "Reduced pensioner NHIF patient charge; not an independent bookable service.",
    "checkedOn": "2026-11-12"
  }
])
const identity = service => JSON.stringify([service.category, service.name.trim()])
const excluded = new Map()
for (const item of NONBOOKABLE_CATALOGUE_ITEMS) {
  if (!excluded.has(item.businessId)) excluded.set(item.businessId, new Set())
  excluded.get(item.businessId).add(identity(item))
}
const projected = new WeakMap()
export function eligibleCatalogueServiceRow(row) {
  const hidden = excluded.get(row.id)
  if (!hidden) return row
  if (projected.has(row)) return projected.get(row)
  const services = row.services.filter(service => !hidden.has(identity(service)))
  if (services.length === row.services.length) return row
  if (!services.length) return null
  const result = { ...row, services }
  if (Object.isFrozen(row) && Object.isFrozen(row.services)) {
    Object.freeze(services); Object.freeze(result); projected.set(row, result)
  }
  return result
}
