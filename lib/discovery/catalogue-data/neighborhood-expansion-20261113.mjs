// Owner-requested expansion: primary-source services/booking first, optional
// published prices, deeper hours checks. No requests or automatic approvals.
import dental from './neighborhood-dental-20261113.mjs'
import homeEducation from './neighborhood-home-education-20261113.mjs'
import homeExtra from './neighborhood-home-extra-20261113.mjs'
import autoSport from './neighborhood-auto-sport-20261113.mjs'
import autoSportExtra from './neighborhood-auto-sport-extra-20261113.mjs'
import washDetail from './neighborhood-wash-detail-20261113.mjs'
import beauty from './neighborhood-beauty-20261113.mjs'
import puzzle from './neighborhood-puzzle-20261113.mjs'
import pets from './neighborhood-pets-20261113.mjs'
import psychology from './neighborhood-psychology-20261113.mjs'
import consulting from './neighborhood-consulting-20261113.mjs'
import consultingMore from './neighborhood-consulting-more-20261113.mjs'
import drivingMore from './neighborhood-driving-more-20261113.mjs'
import educationPhotoMore from './neighborhood-education-photo-more-20261113.mjs'
import autoSportMore from './neighborhood-auto-sport-more-20261113.mjs'
import beautyMore from './neighborhood-beauty-more-20261113.mjs'
import psychologyPetsMore from './neighborhood-psychology-pets-more-20261113.mjs'
import autoSportFurther from './neighborhood-auto-sport-further-20261113.mjs'
import beautyFurther from './neighborhood-beauty-further-20261113.mjs'
import beautyNext from './neighborhood-beauty-next-20261113.mjs'
import autoSportNext from './neighborhood-auto-sport-next-20261113.mjs'
import homeEducationNext from './neighborhood-home-education-next-20261113.mjs'
import homeEducation2000_001 from './neighborhood-home-education-2000-001-20261113.mjs'
import schools2000_001 from './neighborhood-schools-2000-001-20261113.mjs'
import beauty2000_001 from './neighborhood-beauty-2000-001-20261113.mjs'
import autoSport2000_001 from './neighborhood-auto-sport-2000-001-20261113.mjs'
import homeEducation2000_002 from './neighborhood-home-education-2000-002-20261113.mjs'
import beauty2000_002 from './neighborhood-beauty-2000-002-20261113.mjs'
import homeEducation2000_003 from './neighborhood-home-education-2000-003-20261113.mjs'
import beauty2000_003 from './neighborhood-beauty-2000-003-20261113.mjs'
import schools2000_002 from './neighborhood-schools-2000-002-20261113.mjs'
import autoSport2000_002 from './neighborhood-auto-sport-2000-002-20261113.mjs'
import homeEducation2000_004 from './neighborhood-home-education-2000-004-20261113.mjs'
import homeEducation2000_005 from './neighborhood-home-education-2000-005-20261113.mjs'
import photography2000_001 from './neighborhood-photography-2000-001-20261113.mjs'
import psychology2000_001 from './neighborhood-psychology-2000-001-20261113.mjs'
import identities from './neighborhood-reviewed-identities-20261113.json' with { type: 'json' }

const batches = [dental, homeEducation, homeExtra, autoSport, autoSportExtra, washDetail, beauty, puzzle, pets, psychology, consulting,
  consultingMore, drivingMore, educationPhotoMore, autoSportMore, beautyMore, psychologyPetsMore, autoSportFurther, beautyFurther, beautyNext, autoSportNext, homeEducationNext,
  homeEducation2000_001, schools2000_001, beauty2000_001,
  autoSport2000_001, homeEducation2000_002, beauty2000_002, homeEducation2000_003,
  beauty2000_003, schools2000_002, autoSport2000_002, homeEducation2000_004,
  photography2000_001, psychology2000_001, homeEducation2000_005]
// Deliberate staging: source/booking holds are documented but not public.
export const NEIGHBORHOOD_20261113_RECORDS = batches.flatMap(batch => batch.records.filter(row => row.verification.status === 'approved'))
export const NEIGHBORHOOD_20261113_REVIEWS = batches.flatMap(batch => batch.reviews.map(review => ({
  ...review, inventoryIdentity: identities[review.id],
})))
