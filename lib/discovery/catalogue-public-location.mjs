import { publicBusinessLocation } from '../business-directions.mjs'
import { catalogueBoundCoordinates } from './catalogue-coordinate-binding.mjs'
import { sofiaSettlementPointConflict } from '../sofia-settlement-boundaries.mjs'

export function cataloguePublicLocation(row) {
  return publicBusinessLocation({ ...row, source: 'catalogue' }, catalogueBoundCoordinates(row), sofiaSettlementPointConflict)
}
