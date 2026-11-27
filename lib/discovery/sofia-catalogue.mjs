import { validateCatalogue } from './catalogue-policy.mjs'
import beautyExpansion from './catalogue-data/beauty-expansion.json' with { type: 'json' }
import autoSportHomeExpansion from './catalogue-data/auto-sport-home-expansion.json' with { type: 'json' }
import servicesExpansion from './catalogue-data/services-expansion.json' with { type: 'json' }
import beautyExpansionV2 from './catalogue-data/beauty-expansion-v2.json' with { type: 'json' }
import autoSportHomeExpansionV2 from './catalogue-data/auto-sport-home-expansion-v2.json' with { type: 'json' }
import servicesExpansionV2 from './catalogue-data/services-expansion-v2.json' with { type: 'json' }
import geocodesV2 from './catalogue-data/geocodes-v2.json' with { type: 'json' }
import geocodesV3 from './catalogue-data/geocodes-v3.json' with { type: 'json' }
import geocodesV4 from './catalogue-data/geocodes-v4.json' with { type: 'json' }
import supplementalExpansionV2 from './catalogue-data/supplemental-expansion-v2.mjs'
import coverageExpansionV3 from './catalogue-data/coverage-expansion-v3.mjs'
import coverageExpansionV4 from './catalogue-data/coverage-expansion-v4.mjs'
import coverageExpansionV5 from './catalogue-data/coverage-expansion-v5.mjs'
import coverageExpansionV6 from './catalogue-data/coverage-expansion-v6.mjs'
import coverageExpansionV7 from './catalogue-data/coverage-expansion-v7.mjs'
import coverageExpansionV8 from './catalogue-data/coverage-expansion-v8.mjs'
import coverageExpansionV9 from './catalogue-data/coverage-expansion-v9.mjs'
import coverageExpansionV10 from './catalogue-data/coverage-expansion-v10.mjs'
import { PRICING_EXPANSION_RECORDS } from './catalogue-data/pricing-expansion-20261110.mjs'
import { NEIGHBORHOOD_20261111_RECORDS } from './catalogue-data/neighborhood-expansion-20261111.mjs'
import { NEIGHBORHOOD_20261113_RECORDS } from './catalogue-data/neighborhood-expansion-20261113.mjs'
import { COVERAGE_20261116_RECORDS } from './catalogue-data/neighborhood-coverage-20261116.mjs'
import { SUHODOL_20261122_RECORDS } from './catalogue-data/neighborhood-suhodol-20261122.mjs'
import { INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-intake-20261123.mjs'
import { AUTO_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-auto-intake-20261123.mjs'
import { VERIFIED_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-verified-intake-20261123.mjs'
import { EDUCATION_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-education-intake-20261123.mjs'
import { GALILEODENT_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-galileodent-intake-20261123.mjs'
import { VM_AUTO_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-vm-auto-intake-20261123.mjs'
import { SPORT_EDUCATION_GAP_20261123_RECORDS } from './catalogue-data/neighborhood-sport-education-gap-20261123.mjs'
import { DOICHINOVA_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-doichinova-intake-20261123.mjs'
import { DBROS_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-dbros-intake-20261123.mjs'
import { PRIORITY_DENTAL_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-priority-dental-20261123.mjs'
import { NEKSAS_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-neksas-20261123.mjs'
import { PAKOSTI_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-pakosti-20261123.mjs'
import { ACPOWER_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-acpower-20261123.mjs'
import { MIKRON_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-mikron-20261123.mjs'
import { MY_REFORMER_SPACE_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-my-reformer-space-20261123.mjs'
import { UNIGAS_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-unigas-20261123.mjs'
import { SM_GROUP_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-sm-group-20261123.mjs'
import { SPECIALIST_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-specialist-intake-20261123.mjs'
import { KOBA_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-koba-intake-20261123.mjs'
import { COURSES_RECREATION_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-courses-recreation-20261123.mjs'
import { INFINITY_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-infinity-intake-20261123.mjs'
import { applyDesGeorgievaRefresh20261123 } from './catalogue-data/des-georgieva-refresh-20261123.mjs'
import { applyArhollReformerPriceRefreshNov27 } from './catalogue-data/arholl-reformer-price-refresh-20261127.mjs'
import { applySofiaNorthDogBranchPointNov27 } from './catalogue-data/sofia-north-dog-branch-point-nov27.mjs'
import { applyNeliSlavovaBranchPointNov27 } from './catalogue-data/sofia-neli-slavova-branch-point-nov27.mjs'
import { applyDentalBranchPointsNov27 } from './catalogue-data/sofia-dental-branch-points-nov27.mjs'
import { applyLyulinCommercialBranchPoints20261127 } from './catalogue-data/lyulin-commercial-branch-points-20261127.mjs'
import { applyMetroCityAndLeaLocations20261127 } from './catalogue-data/metro-city-and-lea-locations-20261127.mjs'
import { applyAutotestRepublicaVerifiedLocation20261123 } from './catalogue-data/autotest-republica-verified-location-20261123.mjs'
import { HORO_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-horo-intake-20261123.mjs'
import { SHARENSVYAT_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-sharen-svyat-intake-20261123.mjs'
import { SALT_HUG_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-salt-hug-intake-20261123.mjs'
import { FRANTSOV_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-frantsov-intake-20261123.mjs'
import { SOLUX_AUTO_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-solux-auto-intake-20261123.mjs'
import { MOPART_INTAKE_20261127_RECORDS } from './catalogue-data/neighborhood-mopart-intake-20261127.mjs'
import { VERIFIED_LYULIN_BATCH_20261127_RECORDS } from './catalogue-data/neighborhood-verified-lyulin-batch-20261127.mjs'
import { VERIFIED_SOFIA_CROSS_QUARTER_20261127_RECORDS } from './catalogue-data/neighborhood-verified-sofia-cross-quarter-20261127.mjs'
import { VERIFIED_EDUCATION_GROWTH_20261127_RECORDS } from './catalogue-data/neighborhood-verified-education-growth-20261127.mjs'
import { VERIFIED_CONSULTATIONS_20261127_RECORDS } from './catalogue-data/neighborhood-verified-consultations-20261127.mjs'
import { VERIFIED_BANISHA_SALON_20261127_RECORDS } from './catalogue-data/neighborhood-verified-banisha-salon-20261127.mjs'
import { VERIFIED_DIANABAD_INSPECTION_20261127_RECORDS } from './catalogue-data/neighborhood-verified-dianabad-inspection-20261127.mjs'
import { VERIFIED_HLADILNIKA_NN_20261127_RECORDS } from './catalogue-data/neighborhood-verified-hladilnika-nn-20261127.mjs'
import { VERIFIED_HIPODRUMA_HAIRLESS_20261127_RECORDS } from './catalogue-data/neighborhood-verified-hipodruma-hairless-20261127.mjs'
import { VERIFIED_REDUTA_ABV_20261127_RECORDS } from './catalogue-data/neighborhood-verified-reduta-abv-20261127.mjs'
import { GARAGE46_SERDIKA_20261127_RECORDS } from './catalogue-data/neighborhood-verified-garage46-serdika-20261127.mjs'
import { AURA_B19_20261127_RECORDS, applyAuraCohortLocationFollowupNov27 } from './catalogue-data/neighborhood-verified-aura-b19-20261127.mjs'
import { VERIFIED_MTS_KRASNA_POLYANA3_20261127_RECORDS } from './catalogue-data/neighborhood-verified-mts-krasna-polyana3-20261127.mjs'
import { YAVOROV_GEO_MILEV_20261127_RECORDS } from './catalogue-data/neighborhood-verified-yavorov-geo-milev-20261127.mjs'
import { IVON_GORNA_BANYA_20261127_RECORDS } from './catalogue-data/neighborhood-verified-ivon-gorna-banya-20261127.mjs'
import { FLAIS_NADEZHDA1_20261127_RECORDS } from './catalogue-data/neighborhood-verified-flais-nadezhda1-20261127.mjs'
import { SIHIA_NADEZHDA2_20261127_RECORDS } from './catalogue-data/neighborhood-verified-sihia-nadezhda2-20261127.mjs'
import { VERIFIED_SEDEMCHAKRI_LYULIN5_20261127_RECORDS } from './catalogue-data/neighborhood-verified-sedemchakri-lyulin5-20261127.mjs'
import { VERIFIED_RAMIRUS_LEVSKI_V_20261127_RECORDS } from './catalogue-data/neighborhood-verified-ramirus-levski-v-20261127.mjs'
import { VERIFIED_CLEAN_CARPET_SMIRNENSKI_20261127_RECORDS } from './catalogue-data/neighborhood-verified-clean-carpet-smirnenski-20261127.mjs'
import { VERIFIED_VEDA_JUNIOR_20261127_RECORDS } from './catalogue-data/neighborhood-verified-veda-junior-20261127.mjs'
import { KOTEV_MLADOST1A_20261127_RECORDS } from './catalogue-data/neighborhood-verified-kotev-mladost1a-20261127.mjs'
import { VERIFIED_AVTOSTART_IZGREV_20261127_RECORDS } from './catalogue-data/neighborhood-verified-avtostart-izgrev-20261127.mjs'
import { DENTAART_HLADILNIKA_20261127_RECORDS } from './catalogue-data/neighborhood-verified-dentaart-hladilnika-20261127.mjs'
import { VERIFIED_KRIVA_REKA_DARVENITSA_20261127_RECORDS, applySamaIzgrevNeighborhood20261127 } from './catalogue-data/neighborhood-verified-kriva-reka-darvenitsa-20261127.mjs'
import { ORLYAK_BANISHORA_20261127_RECORDS } from './catalogue-data/neighborhood-verified-orlyak-banishora-20261127.mjs'
import { applySfDentIzgrevPoint20261127 } from './catalogue-data/sf-dent-izgrev-point-20261127.mjs'
import { ASLAN_POLIGONA_20261127_RECORDS } from './catalogue-data/neighborhood-verified-aslan-poligona-20261127.mjs'
import { applyGotseMladostVisitPoints20261127 } from './catalogue-data/gotse-mladost-visit-points-20261127.mjs'
import { ATUES_LYULIN3_20261127_RECORDS } from './catalogue-data/neighborhood-verified-atues-lyulin3-20261127.mjs'
import { ROBOTIKA_KRASTOVA_VADA_20261127_RECORDS } from './catalogue-data/neighborhood-verified-robotika-krastova-vada-20261127.mjs'
import { VERIFIED_CARPAINT_LEVSKI_G_20261127_RECORDS } from './catalogue-data/neighborhood-verified-carpaint-levski-g-20261127.mjs'
import { VERIFIED_SENSE_CENTER_KARPUZITSA_20261127_RECORDS } from './catalogue-data/neighborhood-verified-sense-center-karpuzitsa-20261127.mjs'
import { VERIFIED_GALABOV_ZAHARNA_FABRIKA_20261127_RECORDS } from './catalogue-data/neighborhood-verified-galabov-zaharna-fabrika-20261127.mjs'
import { VERIFIED_KIHON_SUHATA_REKA_20261127_RECORDS } from './catalogue-data/neighborhood-verified-kihon-suhata-reka-20261127.mjs'
import { applyVerifiedSofiaAutoFollowups20261127 } from './catalogue-data/verified-sofia-auto-followups-20261127.mjs'
import { VERIFIED_SISTERS_DOGS_LOZENETS_20261127_RECORDS } from './catalogue-data/neighborhood-verified-sisters-dogs-lozenets-20261127.mjs'
import { applyVerifiedWestSchoolSalonPoints20261127 } from './catalogue-data/verified-west-school-salon-points-20261127.mjs'
import { applyVerifiedNadezhdaPuzzleVisitPoint20261127 } from './catalogue-data/verified-nadezhda-puzzle-visit-point-20261127.mjs'
import { VERIFIED_SOMA_ZAPADEN_PARK_20261127_RECORDS } from './catalogue-data/neighborhood-verified-soma-zapaden-park-20261127.mjs'
import { VERIFIED_DARITA_IZTOK_20261127_RECORDS } from './catalogue-data/neighborhood-verified-darita-iztok-20261127.mjs'
import { applyVerifiedHadzhiBakstonVisitPoints20261127 } from './catalogue-data/verified-hadzhi-bakston-visit-points-20261127.mjs'
import { VERIFIED_TINO_HLADILNIKA_20261127_RECORDS } from './catalogue-data/neighborhood-verified-tino-hladilnika-20261127.mjs'
import { VERIFIED_MITOART_HADZHI_DIMITAR_20261127_RECORDS } from './catalogue-data/neighborhood-verified-mitoart-hadzhi-dimitar-20261127.mjs'
import { VERIFIED_BRATYA_MILADINOVI_KNIAZHEVO_20261127_RECORDS } from './catalogue-data/neighborhood-verified-bratya-miladinovi-kniazhevo-20261127.mjs'
import { VERIFIED_DEKRA_FAKULTETA_20261127_RECORDS } from './catalogue-data/neighborhood-verified-dekra-fakulteta-20261127.mjs'
import { VERIFIED_SOFIA_WEST_APPOINTMENTS_20261127_RECORDS } from './catalogue-data/neighborhood-verified-sofia-west-appointments-20261127.mjs'
import { applyVerifiedTinoNails20261127 } from './catalogue-data/verified-tino-nails-20261127.mjs'
import { applyVerifiedNadezhda1ArtMastersPoint20261127 } from './catalogue-data/verified-nadezhda1-art-masters-point-20261127.mjs'
import { applyVerifiedVitoshaFishPoolPoint20261127 } from './catalogue-data/verified-vitosha-fish-pool-point-20261127.mjs'
import { applySofiaAddressPointsNov27 } from './catalogue-data/sofia-address-points-nov27.mjs'
import { applySofiaOwnerPointsLateNov27 } from './catalogue-data/sofia-owner-points-late-nov27.mjs'
import { applySofiaBranchLocationFollowupNov27 } from './catalogue-data/sofia-branch-location-followup-nov27.mjs'
import { MASTERS_DANCE_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-masters-dance-intake-20261123.mjs'
import { CANDY_HOUSE_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-candy-house-intake-20261123.mjs'
import { KOBA_PARIS_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-koba-paris-intake-20261123.mjs'
import { VITOSHA_PAIR_20261123_RECORDS } from './catalogue-data/neighborhood-vitosha-pair-intake-20261123.mjs'
import { GEMINI4_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-gemini4-intake-20261123.mjs'
import { ALVA_DENTAL_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-alva-dental-intake-20261123.mjs'
import { SPARSE_EAST_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-sparse-east-intake-20261123.mjs'
import { SPARSE_SOUTH_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-sparse-south-intake-20261123.mjs'
import { EMIKA_DRUZHBA2_20261123_RECORDS } from './catalogue-data/neighborhood-emika-druzhba2-20261123.mjs'
import { SILVERSTAR_RING_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-silverstar-ring-intake-20261123.mjs'
import { VERIFIED_SOUTH_NEXT_20261123_RECORDS } from './catalogue-data/neighborhood-verified-south-next-20261123.mjs'
import { NORTH_NEXT_INTAKE_20261123_RECORDS, applyNorthNextExistingCoordinates20261123 } from './catalogue-data/neighborhood-verified-north-next-20261123.mjs'
import { VERIFIED_EAST_NEXT_20261123_RECORDS } from './catalogue-data/neighborhood-verified-east-next-20261123.mjs'
import { applyWaveLyulinHair20261123 } from './catalogue-data/wave-lyulin-hair-growth-20261123.mjs'
import { VERIFIED_EAST_GROWTH_20261123_RECORDS } from './catalogue-data/neighborhood-verified-east-growth-20261123.mjs'
import { VERIFIED_SOUTH_GROWTH_20261123_RECORDS } from './catalogue-data/neighborhood-verified-south-growth-20261123.mjs'
import { NORTH_GROWTH_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-verified-north-growth-20261123.mjs'
import { SPARSE_MARKET_SOUTH_20261123_RECORDS } from './catalogue-data/neighborhood-sparse-market-south-20261123.mjs'
import { DCA_LEVSKI_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-dca-levski-20261123.mjs'
import { ELIT_CHESS_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-elit-chess-20261123.mjs'
import { PRIORITY_DISTINCT_EAST_20261123_RECORDS } from './catalogue-data/neighborhood-priority-distinct-east-20261123.mjs'
import { PRIORITY_DISTINCT_NORTH_20261123_RECORDS } from './catalogue-data/neighborhood-priority-distinct-north-20261123.mjs'
import { PRIORITY_DISTINCT_SOUTH_20261123_RECORDS } from './catalogue-data/neighborhood-priority-distinct-south-20261123.mjs'
import { PRIORITY_CONTINUED_EAST_20261123_RECORDS } from './catalogue-data/neighborhood-priority-continued-east-20261123.mjs'
import { PRIORITY_NEXT_EAST_20261123_RECORDS } from './catalogue-data/neighborhood-priority-next-east-20261123.mjs'
import { PRIORITY_NEXT_NORTH_20261123_RECORDS } from './catalogue-data/neighborhood-priority-next-north-20261123.mjs'
import { PRIORITY_NEXT_SOUTH_20261123_RECORDS } from './catalogue-data/neighborhood-priority-next-south-20261123.mjs'
import { PRIORITY_FRESH_EAST_20261123_RECORDS } from './catalogue-data/neighborhood-priority-fresh-east-20261123.mjs'
import { PRIORITY_FRESH_NORTH_20261123_RECORDS } from './catalogue-data/neighborhood-priority-fresh-north-20261123.mjs'
import { PRIORITY_FRESH_SOUTH_20261123_RECORDS } from './catalogue-data/neighborhood-priority-fresh-south-20261123.mjs'
import { PRIORITY_FOUND_CORE_20261123_RECORDS } from './catalogue-data/neighborhood-priority-found-core-20261123.mjs'
import { PRIORITY_FOUND_EAST_20261123_RECORDS } from './catalogue-data/neighborhood-priority-found-east-20261123.mjs'
import { PRIORITY_FOUND_SOUTH_20261123_RECORDS } from './catalogue-data/neighborhood-priority-found-south-20261123.mjs'
import { PRIORITY_SPARSE2_NORTH_20261123_RECORDS } from './catalogue-data/neighborhood-priority-sparse2-north-20261123.mjs'
import { PRIORITY_SPARSE2_SOUTH_20261123_RECORDS } from './catalogue-data/neighborhood-priority-sparse2-south-20261123.mjs'
import { applyStephanLageraOwnerPoint20261123 } from './catalogue-data/stephan-lagera-owner-point-20261123.mjs'
import { applyWmaaMladost4OwnerPoint20261123 } from './catalogue-data/wmaa-mladost4-owner-point-20261123.mjs'
import { applyAlkomPostalRecovery20261123 } from './catalogue-data/alkom-postal-recovery-20261123.mjs'
import { applyNamedRoadAliasRecovery20261123 } from './catalogue-data/named-road-alias-recovery-20261123.mjs'
import { applyNorthWestEntranceRecovery20261123 } from './catalogue-data/north-west-entrance-recovery-20261123.mjs'
import { applySparseAddressBindings20261123 } from './catalogue-data/sparse-address-bindings-20261123.mjs'
import { applyNorthExactCoverage20261123 } from './catalogue-data/north-exact-coverage-20261123.mjs'
import { applySaltartDruzhbaBinding20261123 } from './catalogue-data/saltart-druzhba-binding-20261123.mjs'
import { applyPriorityAddressRecovery20261123 } from './catalogue-data/priority-address-recovery-20261123.mjs'
import { applyFelixDogsLyulinVerifiedLocation20261123 } from './catalogue-data/felix-dogs-lyulin-verified-location-20261123.mjs'
import { enrichCatalogueDetails } from './catalogue-data/details-enrichment-v2.mjs'
import { enrichCatalogueDetailsV3 } from './catalogue-data/details-enrichment-v3.mjs'
import pricing20261110 from './catalogue-data/pricing-20261110.json' with { type: 'json' }
import { BOOKING_REVIEWED_PRICING } from './catalogue-data/pricing-booking-review-v1.mjs'
import { enrichCataloguePricing } from './catalogue-pricing-enrichment.mjs'
import { applyCatalogueCoordinateBindings } from './catalogue-coordinate-binding.mjs'
import { applyOfficialCatalogueLocations } from './catalogue-official-locations.mjs'
import { applyReviewedNeighborhoodRecovery20261122 } from './catalogue-data/neighborhood-recovery-20261122.mjs'
import { applyReviewedAddressPoints20261122 } from './catalogue-data/address-points-recovery-20261122.mjs'
import { applyReviewedNearbyAddressPoints20261122 } from './catalogue-data/nearby-address-points-20261122.mjs'
import { applyReviewedNeighborhoodRecovery20261123 } from './catalogue-data/neighborhood-recovery-20261123.mjs'
import { applyReviewedAutoAreaRecovery20261123 } from './catalogue-data/auto-area-recovery-20261123.mjs'
import { applyVerifiedAddressRecovery20261123 } from './catalogue-data/verified-address-recovery-20261123.mjs'
import { applyReviewedTennisLyulin6Recovery20261123 } from './catalogue-data/tennis-lyulin-6-recovery-20261123.mjs'
import { applyReviewedCoordinateScopeRecovery20261123 } from './catalogue-data/coordinate-scope-recovery-20261123.mjs'
import { applyReviewedQuarterCorroboration20261123 } from './catalogue-data/quarter-corroboration-20261123.mjs'
import { applyReviewedQuickFitLocation20261123 } from './catalogue-data/quickfit-verified-location-20261123.mjs'
import { applyAgronVerifiedLocation20261123 } from './catalogue-data/agron-verified-location-20261123.mjs'
import { applyReviewedRisuvamLocation20261123 } from './catalogue-data/risuvam-verified-location-20261123.mjs'
import { applyReviewedSwimmingLyulin3Location20261123 } from './catalogue-data/swimming-lyulin3-verified-location-20261123.mjs'
import { applyReviewedDpoolLyulin2Location20261123 } from './catalogue-data/dpool-lyulin2-verified-location-20261123.mjs'
import { applyViksLyulin8VerifiedLocation20261123 } from './catalogue-data/viks-lyulin8-verified-location-20261123.mjs'
import { applyReviewedPaintKillersLocation20261123 } from './catalogue-data/paintkillers-verified-location-20261123.mjs'

// First-party public facts manually checked on 2026-11-05. This is a reviewed
// catalogue, not all Sofia businesses and not a Google/Studio24 data export.
// Only short appointment evidence is retained; no photographs or reviews.
const checkedOn = '2026-11-05', validUntil = '2027-02-03'
const service = (name, category, appointmentModel = 'appointment') => ({ name, category, appointmentModel })
const point = (latitude, longitude, source) => ({ latitude, longitude, source, method: 'first_party_coordinates' })
const reviewed = (url, excerpt, contact = url) => ({ status: 'approved', checkedOn, validUntil, booking: { url, excerpt }, contact })

const baseCatalogue = validateCatalogue([
  {
    id: 'sofia-mokro-nosle', name: 'Мокро Носле', category: 'pets', cityCode: '68134', neighborhood: 'Манастирски ливади',
    address: 'София, Манастирски ливади, ул. Пирин 85', locationKind: 'premises',
    coordinates: point(42.6638205, 23.2846817, 'https://www.mokronosle.com/'), website: 'https://www.mokronosle.com/', phone: '+359884191090',
    services: [service('Груминг за кучета', 'pets'), service('Къпане и подстригване на кучета', 'pets')],
    booking: { kind: 'form', url: 'https://easybook.bg/gruming-studio-mokro-nosle-sofiya-manastirski-livadi' },
    verification: reviewed('https://www.mokronosle.com/', 'Запази час за груминг'),
  },
  {
    id: 'sofia-kaya-grooming', name: 'Kaya Grooming', category: 'pets', cityCode: '68134', neighborhood: 'Борово',
    address: 'София, Борово, ул. Солун 62', locationKind: 'premises',
    coordinates: point(42.670812, 23.289344, 'https://www.kaya-grooming.com/'), website: 'https://www.kaya-grooming.com/', phone: '+359895754360',
    services: [service('Груминг за кучета', 'pets'), service('Къпане и разресване на котки', 'pets')],
    booking: { kind: 'form', url: 'https://www.kaya-grooming.com/book-online' },
    verification: reviewed('https://www.kaya-grooming.com/book-online', 'ЗАПАЗИ ЧАС ПРИ НАС ПРЕЗ НАШИЯ САЙТ ИЛИ СЕ ОБАДИ НА : 0895 75 43 60', 'https://www.kaya-grooming.com/'),
  },
  {
    id: 'sofia-tobbys-grooming', name: 'Tobby’s Grooming House', category: 'pets', cityCode: '68134', neighborhood: null,
    address: 'София, ул. Белмекен 8', locationKind: 'premises', coordinates: null, website: 'https://tobby.bg/', phone: '+359894467070',
    services: [service('Груминг и подстригване на кучета', 'pets'), service('Къпане и сушене на кучета', 'pets')],
    booking: { kind: 'phone', phone: '+359894467070' },
    verification: reviewed('https://tobby.bg/', 'Засега можеш да запазиш час по телефон, имейл или чрез формата.'),
  },
  {
    id: 'sofia-pet-stop-place', name: 'PetStopPlace · груминг', category: 'pets', cityCode: '68134', neighborhood: 'Надежда 4',
    address: 'София, Надежда 4, ул. Бели Дунав 2', locationKind: 'premises', coordinates: null, website: 'https://petstopplace.com/', phone: '+359877755265',
    services: [service('Груминг за кучета', 'pets')], booking: { kind: 'phone', phone: '+359877755265' },
    verification: reviewed('https://petstopplace.com/', 'Час се запазва с обаждане.'),
  },
  {
    id: 'sofia-iq-detailing', name: 'IQ Detailing', category: 'detailing', cityCode: '68134', neighborhood: 'Павлово',
    address: 'София, Павлово, ул. Пелистер 18', locationKind: 'premises', coordinates: null, website: 'https://iq-detailing.com/', phone: '+359889404080',
    services: [service('Автодетайлинг и полиране', 'detailing'), service('PPF защитно фолио', 'detailing')],
    booking: { kind: 'phone', phone: '+359889404080' }, verification: reviewed('https://iq-detailing.com/kontakti/', 'Запиши час за своя автомобил'),
  },
  {
    id: 'sofia-nebula-detailing', name: 'Nebula Detailing Studio', category: 'detailing', cityCode: '68134', neighborhood: 'Младост 3',
    address: 'София, Младост 3, ул. Жечо Гюмюшев 239', locationKind: 'premises',
    coordinates: point(42.6391334, 23.3865838, 'https://www.nebuladetailing.bg/'), website: 'https://www.nebuladetailing.bg/', phone: '+359893314121',
    services: [service('Автодетайлинг и полиране', 'detailing'), service('Интериорен детайлинг', 'detailing')],
    booking: { kind: 'phone', phone: '+359893314121' }, verification: reviewed('https://www.nebuladetailing.bg/contact', 'Приемаме автомобили с предварително записан час'),
  },
  {
    id: 'sofia-autosteamclean-mobile', name: 'AUTOSTEAMCLEAN · мобилна автомивка', category: 'car_wash', cityCode: '68134', neighborhood: null,
    address: null, locationKind: 'service_area', coordinates: null, website: 'https://autosteamclean.com/', phone: '+359895690303',
    services: [service('Мобилна автомивка на адрес в Южна София', 'car_wash', 'home_visit')],
    booking: { kind: 'phone', phone: '+359895690303' },
    verification: reviewed('https://autosteamclean.com/въпроси-faq/', 'За мобилната услуга също е необходимо предварително да бъде уговорен адрес и час.', 'https://autosteamclean.com/'),
  },
  {
    id: 'sofia-cut-n-chill', name: 'Cut N’Chill by R. Yankoff', category: 'barber', cityCode: '68134', neighborhood: 'Разсадника',
    address: 'София, бул. Вардар, бл. 20', locationKind: 'premises',
    coordinates: point(42.6989464, 23.2868141, 'https://www.cutnchill.com/'), website: 'https://www.cutnchill.com/', phone: '+359878958723',
    services: [service('Мъжко подстригване', 'barber'), service('Оформяне на брада', 'barber'), service('Оформяне на вежди', 'beauty')],
    booking: { kind: 'form', url: 'https://www.cutnchill.com/rezervirai' }, verification: reviewed('https://www.cutnchill.com/rezervirai', 'Мъжко подстригване · Запази час', 'https://www.cutnchill.com/'),
  },
  {
    id: 'sofia-bobi-yarchev', name: 'Боби Ярчев', category: 'hair', cityCode: '68134', neighborhood: 'Борово',
    address: 'София, Борово, бул. България 60А', locationKind: 'premises',
    coordinates: point(42.6689253, 23.290778, 'https://bobiyarchev.com/'), website: 'https://bobiyarchev.com/', phone: '+359897975527',
    services: [service('Дамско подстригване', 'hair'), service('Боядисване и балеаж', 'hair'), service('Мъжко подстригване', 'hair')],
    // The official site's booking destination is inaccessible to our checker;
    // use its published appointment phone, not an unverified form redirect.
    booking: { kind: 'phone', phone: '+359897975527' }, verification: reviewed('https://bobiyarchev.com/', 'Вижте цени и запазете час при Боби Ярчев.'),
  },
  {
    id: 'sofia-el-gato', name: 'El Gato', category: 'nails', cityCode: '68134', neighborhood: 'Илинден',
    address: 'София, Илинден, бл. 114А, вход откъм ул. Тодораки Пешев', locationKind: 'premises',
    coordinates: point(42.7034, 23.28869, 'https://www.elgatobeauty.com/'), website: 'https://www.elgatobeauty.com/', phone: '+359876900718',
    services: [service('Маникюр с гел лак', 'nails'), service('Педикюр', 'nails')],
    booking: { kind: 'phone', phone: '+359876900718' }, verification: reviewed('https://www.elgatobeauty.com/', 'Запишете си час за по-сложна процедура на: 0876 900 718'),
  },
  {
    id: 'sofia-nail-cocktail-boutique', name: 'Nail Cocktail Boutique', category: 'nails', cityCode: '68134', neighborhood: null,
    address: 'София, бул. България 73, вход от ул. Св. Иван Кирков', locationKind: 'premises', coordinates: null,
    website: 'https://nailcocktailboutique.com/', phone: '+359876666419',
    services: [service('Маникюр', 'nails'), service('Педикюр', 'nails')],
    booking: { kind: 'phone', phone: '+359876666419' }, verification: reviewed('https://nailcocktailboutique.com/zapazi-chas/', 'Запази час по телефона'),
  },
  {
    id: 'sofia-elmida-beauty', name: 'Elmida Beauty', category: 'beauty', cityCode: '68134', neighborhood: null,
    address: 'София, ул. Софроний Врачански 2, пл. Възраждане', locationKind: 'premises', coordinates: null,
    website: 'https://elmidabeauty.com/', phone: '+359897850322',
    services: [service('Лазерна епилация', 'beauty'), service('Почистване на лице', 'beauty')],
    booking: { kind: 'phone', phone: '+359897850322' }, verification: reviewed('https://elmidabeauty.com/kontakti/', 'Нашата бърза и удобна система за онлайн резервации ви позволява да запазите подходящ за вас час.'),
  },
  {
    id: 'sofia-twisted-hladilnika', name: 'Twisted Jiu Jitsu · Хладилника', category: 'fitness', cityCode: '68134', neighborhood: 'Хладилника',
    address: 'София, бул. Черни връх 47, ет. 5 (за възрастни и юноши)', locationKind: 'premises', coordinates: null,
    website: 'https://twistedjiujitsu.com/', phone: '+359898664490',
    services: [service('Бразилско джу джицу за начинаещи', 'fitness', 'group_reservation'), service('Индивидуални тренировки по джу джицу', 'fitness', 'individual_training')],
    booking: { kind: 'form', url: 'https://twistedjiujitsu.gymdesk.com/signup/v/ArkkO' },
    verification: reviewed('https://twistedjiujitsu.com/probna-sedmica/?lang=en', 'Log into your profile and book as many classes as you wish during your trial period', 'https://twistedjiujitsu.com/contact/?lang=en'),
  },
  {
    id: 'sofia-twisted-slatina', name: 'Twisted Jiu Jitsu · Слатина', category: 'fitness', cityCode: '68134', neighborhood: 'Слатина',
    address: 'София, бул. Шипченски проход 63, ет. 3', locationKind: 'premises', coordinates: null,
    website: 'https://twistedjiujitsu.com/', phone: '+359898664490',
    services: [service('Бразилско джу джицу за начинаещи', 'fitness', 'group_reservation'), service('Индивидуални тренировки по джу джицу', 'fitness', 'individual_training')],
    booking: { kind: 'form', url: 'https://twistedjiujitsu.gymdesk.com/signup/v/ArkkO' },
    verification: reviewed('https://twistedjiujitsu.com/probna-sedmica/?lang=en', 'schedules “BJJ Hladilnika” or “BJJ Slatina”', 'https://twistedjiujitsu.com/contact/?lang=en'),
  },
  {
    id: 'sofia-sofiyski-remonti', name: 'Софийски Ремонти', category: 'home_services', cityCode: '68134', neighborhood: null,
    address: null, locationKind: 'service_area', coordinates: null, website: 'https://sofiaremonti.com/', phone: '+359886746430',
    services: [service('Оглед за ремонт на апартамент', 'home_services', 'home_visit'), service('Оглед за ВиК и електроинсталации', 'home_services', 'home_visit')],
    booking: { kind: 'phone', phone: '+359886746430' },
    verification: reviewed('https://sofiaremonti.com/services/cialostni-remonti/', 'Запази час за безплатен оглед', 'https://sofiaremonti.com/contacts/'),
  },
  {
    id: 'sofia-danyelle-hair-beauty', name: 'Danyell’e Hair & Beauty', category: 'hair', cityCode: '68134', neighborhood: 'Манастирски ливади',
    address: 'София, Манастирски ливади, ул. Родопски извор 64', locationKind: 'premises',
    coordinates: point(42.663980987, 23.280163925, 'https://danyellebeauty.studio/'), website: 'https://danyellebeauty.studio/', phone: '+359890217660',
    services: [service('Дамско подстригване', 'hair'), service('Боядисване и балеаж', 'hair')],
    booking: { kind: 'phone', phone: '+359890217660' }, verification: reviewed('https://danyellebeauty.studio/', 'Запази своя час'),
  },
  ...[
    { id: 'westmall', name: 'WestMall', address: 'бул. Царица Йоанна 15', phone: '+359988319310', coordinates: point(42.710817405762185, 23.27088031093672, 'https://belamistudio.com/') },
    { id: 'park-center', name: 'Park Center', address: 'бул. Арсеналски 2', phone: '+359877711838', coordinates: point(42.67864560866395, 23.320276183951233, 'https://belamistudio.com/') },
  ].map(branch => ({
    id: `sofia-belami-${branch.id}`, name: `Belami Studio · ${branch.name}`, category: 'nails', cityCode: '68134', neighborhood: null,
    address: `София, ${branch.address}`, locationKind: 'premises', coordinates: branch.coordinates, website: 'https://belamistudio.com/', phone: branch.phone,
    services: [service('Маникюр с гел лак', 'nails'), service('Педикюр', 'nails'), service('Дамско подстригване', 'hair'), service('Оформяне на вежди', 'beauty')],
    booking: { kind: 'phone', phone: branch.phone }, verification: reviewed('https://belamistudio.com/', 'Запази час онлайн'),
  })),
  {
    id: 'sofia-salon-fiore', name: 'Салон Фиоре', category: 'nails', cityCode: '68134', neighborhood: null,
    address: 'София, ул. Чарлз Дарвин 8', locationKind: 'premises', coordinates: null, website: 'https://salonfiore.com/', phone: '+359876837860',
    services: [service('Маникюр с гел лак', 'nails'), service('Педикюр', 'nails'), service('Ноктопластика', 'nails')],
    booking: { kind: 'phone', phone: '+359876837860' }, verification: reviewed('https://salonfiore.com/', 'Запази час за процедура'),
  },
  {
    id: 'sofia-nn-hair-design', name: 'NN Hair Design', category: 'hair', cityCode: '68134', neighborhood: null,
    address: 'София, ул. Пъстър свят 11', locationKind: 'premises', coordinates: null, website: 'https://nnhairdesign.eu/', phone: '+359898899873',
    // One premises, not a second listing for the separately published nail specialist.
    services: [service('Дамско подстригване и боядисване', 'hair')],
    booking: { kind: 'phone', phone: '+359898899873' }, verification: reviewed('https://nnhairdesign.eu/', 'Book an Appointment'),
  },
  {
    // Quarter and address-bound Waze destination reviewed on the owner's
    // live /contacts page, 2026-11-16; not a neighborhood-centre geocode.
    id: 'sofia-uli-nails', name: 'Uli Nails', category: 'nails', cityCode: '68134', neighborhood: 'Гео Милев',
    address: 'София, ул. Гео Милев 22', locationKind: 'premises',
    coordinates: { ...point(42.684432, 23.3582824, 'https://uli.bg/contacts'), sourceAddress: 'София, ул. Гео Милев 22' }, website: 'https://uli.bg/', phone: '+359876471110',
    services: [service('Маникюр и гел лак', 'nails'), service('Педикюр', 'nails'), service('Ноктопластика', 'nails')],
    booking: { kind: 'phone', phone: '+359876471110' }, verification: reviewed('https://uli.bg/', 'Запази час'),
  },
  {
    id: 'sofia-lumiere-beauty-club', name: 'Lumière Beauty Club', category: 'nails', cityCode: '68134', neighborhood: 'Надежда 2',
    address: 'София, Надежда 2, ул. Света Никола Нови 2А', locationKind: 'premises', coordinates: null, website: 'https://www.lumierebeautyclub.bg/', phone: '+359899979791',
    services: [service('Маникюр с гел лак', 'nails'), service('Педикюр', 'nails'), service('Ноктопластика', 'nails'), service('Фризьорски услуги', 'hair')],
    booking: { kind: 'phone', phone: '+359899979791' }, verification: reviewed('https://www.lumierebeautyclub.bg/', 'ЗАПАЗИ ЧАС'),
  },
  {
    id: 'sofia-alvien-nails', name: 'AlViEN Beauty Center · маникюр', category: 'nails', cityCode: '68134', neighborhood: 'Васил Левски',
    address: 'София, ул. Бесарабия 52', locationKind: 'premises', coordinates: null, website: 'https://alvienbeauty.com/', phone: '+359898502629',
    services: [service('Маникюр', 'nails'), service('Педикюр', 'nails')],
    booking: { kind: 'phone', phone: '+359898502629' }, verification: reviewed('https://alvienbeauty.com/', 'Резервация с обаждане до специалиста по нокти'),
  },
  {
    id: 'sofia-persia-beauty', name: 'Persia Beauty Sofia', category: 'hair', cityCode: '68134', neighborhood: null,
    address: 'София, бул. Княгиня Мария Луиза 131, Ramada Sofia City Center', locationKind: 'premises', coordinates: null,
    website: 'https://persiabeauty.bg/', phone: '+359876311134',
    services: [service('Фризьорски услуги', 'hair'), service('Маникюр', 'nails')],
    booking: { kind: 'phone', phone: '+359876311134' }, verification: reviewed('https://persiabeauty.bg/contact', 'Запази час'),
  },
  {
    id: 'sofia-bloom-beauty-evelyn', name: 'Bloom Beauty by Evelyn', category: 'nails', cityCode: '68134', neighborhood: null,
    address: 'София, бул. Цариградско шосе 92А, Sofia Outlet Center, ет. 1', locationKind: 'premises', coordinates: null,
    website: 'https://bloombeautybg.com/bg', phone: '+359878889802',
    services: [service('Маникюр с гел лак', 'nails')],
    booking: { kind: 'phone', phone: '+359878889802' }, verification: reviewed('https://bloombeautybg.com/bg', 'Запази час сега'),
  },
  ...beautyExpansion,
  ...autoSportHomeExpansion,
  ...servicesExpansion,
  ...beautyExpansionV2,
  ...autoSportHomeExpansionV2,
  ...servicesExpansionV2,
  ...supplementalExpansionV2,
  ...coverageExpansionV3,
  ...coverageExpansionV4,
  ...coverageExpansionV5,
  ...coverageExpansionV6,
  ...coverageExpansionV7,
  ...coverageExpansionV8,
  ...coverageExpansionV9,
  ...coverageExpansionV10,
  ...PRICING_EXPANSION_RECORDS,
  ...NEIGHBORHOOD_20261111_RECORDS,
  ...NEIGHBORHOOD_20261113_RECORDS,
  ...COVERAGE_20261116_RECORDS,
  ...SUHODOL_20261122_RECORDS,
  ...INTAKE_20261123_RECORDS,
  ...AUTO_INTAKE_20261123_RECORDS,
  ...VERIFIED_INTAKE_20261123_RECORDS,
  ...EDUCATION_INTAKE_20261123_RECORDS,
  ...GALILEODENT_INTAKE_20261123_RECORDS,
  ...VM_AUTO_INTAKE_20261123_RECORDS,
  ...SPORT_EDUCATION_GAP_20261123_RECORDS,
  ...DOICHINOVA_INTAKE_20261123_RECORDS,
  ...DBROS_INTAKE_20261123_RECORDS,
  ...PRIORITY_DENTAL_INTAKE_20261123_RECORDS,
  ...NEKSAS_INTAKE_20261123_RECORDS,
  ...PAKOSTI_INTAKE_20261123_RECORDS,
  ...ACPOWER_INTAKE_20261123_RECORDS,
  ...MIKRON_INTAKE_20261123_RECORDS,
  ...MY_REFORMER_SPACE_INTAKE_20261123_RECORDS,
  ...UNIGAS_INTAKE_20261123_RECORDS,
  ...SM_GROUP_INTAKE_20261123_RECORDS,
  ...SPECIALIST_INTAKE_20261123_RECORDS,
  ...KOBA_INTAKE_20261123_RECORDS,
  ...COURSES_RECREATION_INTAKE_20261123_RECORDS,
  ...INFINITY_INTAKE_20261123_RECORDS,
  ...HORO_INTAKE_20261123_RECORDS,
  ...SHARENSVYAT_INTAKE_20261123_RECORDS,
  ...SALT_HUG_INTAKE_20261123_RECORDS,
  ...FRANTSOV_INTAKE_20261123_RECORDS,
  ...SOLUX_AUTO_INTAKE_20261123_RECORDS,
  ...MOPART_INTAKE_20261127_RECORDS,
  ...VERIFIED_LYULIN_BATCH_20261127_RECORDS,
  ...VERIFIED_SOFIA_CROSS_QUARTER_20261127_RECORDS,
  ...VERIFIED_EDUCATION_GROWTH_20261127_RECORDS,
  ...VERIFIED_CONSULTATIONS_20261127_RECORDS,
  ...VERIFIED_BANISHA_SALON_20261127_RECORDS,
  ...VERIFIED_DIANABAD_INSPECTION_20261127_RECORDS,
  ...VERIFIED_HLADILNIKA_NN_20261127_RECORDS,
  ...VERIFIED_HIPODRUMA_HAIRLESS_20261127_RECORDS,
  ...VERIFIED_REDUTA_ABV_20261127_RECORDS,
  ...GARAGE46_SERDIKA_20261127_RECORDS,
  ...AURA_B19_20261127_RECORDS,
  ...VERIFIED_MTS_KRASNA_POLYANA3_20261127_RECORDS,
  ...YAVOROV_GEO_MILEV_20261127_RECORDS,
  ...IVON_GORNA_BANYA_20261127_RECORDS,
  ...FLAIS_NADEZHDA1_20261127_RECORDS,
  ...SIHIA_NADEZHDA2_20261127_RECORDS,
  ...VERIFIED_SEDEMCHAKRI_LYULIN5_20261127_RECORDS,
  ...VERIFIED_RAMIRUS_LEVSKI_V_20261127_RECORDS,
  ...VERIFIED_CLEAN_CARPET_SMIRNENSKI_20261127_RECORDS,
  ...VERIFIED_VEDA_JUNIOR_20261127_RECORDS,
  ...KOTEV_MLADOST1A_20261127_RECORDS,
  ...VERIFIED_AVTOSTART_IZGREV_20261127_RECORDS,
  ...DENTAART_HLADILNIKA_20261127_RECORDS,
  ...VERIFIED_KRIVA_REKA_DARVENITSA_20261127_RECORDS,
  ...ORLYAK_BANISHORA_20261127_RECORDS,
  ...ASLAN_POLIGONA_20261127_RECORDS,
  ...ATUES_LYULIN3_20261127_RECORDS,
  ...ROBOTIKA_KRASTOVA_VADA_20261127_RECORDS,
  ...VERIFIED_CARPAINT_LEVSKI_G_20261127_RECORDS,
  ...VERIFIED_SENSE_CENTER_KARPUZITSA_20261127_RECORDS,
  ...VERIFIED_GALABOV_ZAHARNA_FABRIKA_20261127_RECORDS,
  ...VERIFIED_KIHON_SUHATA_REKA_20261127_RECORDS,
  ...VERIFIED_SISTERS_DOGS_LOZENETS_20261127_RECORDS,
  ...VERIFIED_SOMA_ZAPADEN_PARK_20261127_RECORDS,
  ...VERIFIED_DARITA_IZTOK_20261127_RECORDS,
  ...VERIFIED_TINO_HLADILNIKA_20261127_RECORDS,
  ...VERIFIED_MITOART_HADZHI_DIMITAR_20261127_RECORDS,
  ...VERIFIED_BRATYA_MILADINOVI_KNIAZHEVO_20261127_RECORDS,
  ...VERIFIED_DEKRA_FAKULTETA_20261127_RECORDS,
  ...VERIFIED_SOFIA_WEST_APPOINTMENTS_20261127_RECORDS,
  ...MASTERS_DANCE_INTAKE_20261123_RECORDS,
  ...CANDY_HOUSE_INTAKE_20261123_RECORDS,
  ...KOBA_PARIS_INTAKE_20261123_RECORDS,
  ...VITOSHA_PAIR_20261123_RECORDS,
  ...GEMINI4_INTAKE_20261123_RECORDS,
  ...ALVA_DENTAL_INTAKE_20261123_RECORDS,
  ...SPARSE_EAST_INTAKE_20261123_RECORDS,
  ...SPARSE_SOUTH_INTAKE_20261123_RECORDS,
  ...EMIKA_DRUZHBA2_20261123_RECORDS,
  ...SILVERSTAR_RING_INTAKE_20261123_RECORDS,
  ...VERIFIED_SOUTH_NEXT_20261123_RECORDS,
  ...NORTH_NEXT_INTAKE_20261123_RECORDS,
  ...VERIFIED_EAST_NEXT_20261123_RECORDS,
  ...VERIFIED_EAST_GROWTH_20261123_RECORDS,
  ...VERIFIED_SOUTH_GROWTH_20261123_RECORDS,
  ...NORTH_GROWTH_INTAKE_20261123_RECORDS,
  ...SPARSE_MARKET_SOUTH_20261123_RECORDS,
  ...DCA_LEVSKI_INTAKE_20261123_RECORDS,
  ...ELIT_CHESS_INTAKE_20261123_RECORDS,
  ...PRIORITY_DISTINCT_EAST_20261123_RECORDS,
  ...PRIORITY_DISTINCT_NORTH_20261123_RECORDS,
  ...PRIORITY_DISTINCT_SOUTH_20261123_RECORDS,
  ...PRIORITY_CONTINUED_EAST_20261123_RECORDS,
  ...PRIORITY_NEXT_EAST_20261123_RECORDS,
  ...PRIORITY_NEXT_NORTH_20261123_RECORDS,
  ...PRIORITY_NEXT_SOUTH_20261123_RECORDS,
  ...PRIORITY_FRESH_EAST_20261123_RECORDS,
  ...PRIORITY_FRESH_NORTH_20261123_RECORDS,
  ...PRIORITY_FRESH_SOUTH_20261123_RECORDS,
  ...PRIORITY_FOUND_CORE_20261123_RECORDS,
  ...PRIORITY_FOUND_EAST_20261123_RECORDS,
  ...PRIORITY_FOUND_SOUTH_20261123_RECORDS,
  ...PRIORITY_SPARSE2_NORTH_20261123_RECORDS,
  ...PRIORITY_SPARSE2_SOUTH_20261123_RECORDS,
])

const geocodes = new Map()
for (const update of [...geocodesV2, ...geocodesV3, ...geocodesV4]) {
  const entry=baseCatalogue.find(row=>row.id===update.id)
  if (!entry || entry.coordinates || geocodes.has(update.id) || update.coordinates?.method!=='verified_address_geocode') throw Error(`Invalid catalogue geocode update: ${update.id}`)
  geocodes.set(update.id,update.coordinates)
}
const reviewedCatalogue = applyVerifiedAddressRecovery20261123(applyReviewedAutoAreaRecovery20261123(applyReviewedNeighborhoodRecovery20261123(applyReviewedNearbyAddressPoints20261122(applyReviewedAddressPoints20261122(applyReviewedNeighborhoodRecovery20261122(applyOfficialCatalogueLocations(enrichCataloguePricing(enrichCataloguePricing(
  enrichCatalogueDetailsV3(enrichCatalogueDetails(baseCatalogue.map(row=>geocodes.has(row.id)?{...row,coordinates:geocodes.get(row.id)}:row))),
  pricing20261110,
), BOOKING_REVIEWED_PRICING, { includeReviewedDescriptions: true }))))))))
const postalReviews = [applyReviewedTennisLyulin6Recovery20261123, applyReviewedCoordinateScopeRecovery20261123,
  applyReviewedQuarterCorroboration20261123, applyReviewedQuickFitLocation20261123,
  applyAgronVerifiedLocation20261123, applyReviewedRisuvamLocation20261123, applyReviewedSwimmingLyulin3Location20261123,
  applyReviewedDpoolLyulin2Location20261123, applyViksLyulin8VerifiedLocation20261123,
  applyReviewedPaintKillersLocation20261123, applyDesGeorgievaRefresh20261123, applyAutotestRepublicaVerifiedLocation20261123,
  applyFelixDogsLyulinVerifiedLocation20261123, applySparseAddressBindings20261123,
  applyNorthExactCoverage20261123, applySaltartDruzhbaBinding20261123,
  applyPriorityAddressRecovery20261123, applyNorthNextExistingCoordinates20261123, applyWaveLyulinHair20261123,
  applyAlkomPostalRecovery20261123, applyNamedRoadAliasRecovery20261123, applyNorthWestEntranceRecovery20261123,
  applyStephanLageraOwnerPoint20261123, applyWmaaMladost4OwnerPoint20261123,
  applySofiaAddressPointsNov27, applySofiaOwnerPointsLateNov27, applySofiaBranchLocationFollowupNov27,
  applyAuraCohortLocationFollowupNov27, applyArhollReformerPriceRefreshNov27, applySofiaNorthDogBranchPointNov27,
  applyNeliSlavovaBranchPointNov27, applyDentalBranchPointsNov27, applyLyulinCommercialBranchPoints20261127,
  applyMetroCityAndLeaLocations20261127, applySamaIzgrevNeighborhood20261127, applySfDentIzgrevPoint20261127,
  applyGotseMladostVisitPoints20261127, applyVerifiedSofiaAutoFollowups20261127,
  applyVerifiedWestSchoolSalonPoints20261127, applyVerifiedNadezhdaPuzzleVisitPoint20261127,
  applyVerifiedHadzhiBakstonVisitPoints20261127, applyVerifiedTinoNails20261127,
  applyVerifiedNadezhda1ArtMastersPoint20261127, applyVerifiedVitoshaFishPoolPoint20261127]
export const RAW_SOFIA_CATALOGUE = validateCatalogue(postalReviews.reduce((rows, apply) => apply(rows), reviewedCatalogue))

// All readers (search, details, directions and partner import) see the same
// address-bound point, rather than independently retaining a stale pin.
// Reuse already validated/frozen rows. Only a retired pin creates a new row;
// reparsing every service a third time would penalize cold-start loading.
export const SOFIA_CATALOGUE = Object.freeze(applyCatalogueCoordinateBindings(RAW_SOFIA_CATALOGUE)
  .map((row, index) => row === RAW_SOFIA_CATALOGUE[index] ? row : validateCatalogue([row])[0]))

export async function readSofiaCatalogue() { return SOFIA_CATALOGUE }
