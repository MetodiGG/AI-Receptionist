// Public provenance only; never expose private chat identifiers or contents.
export function catalogueProvenance(row) {
  const verification = row.verification
  return {
    kind: verification.sourceKind === 'platform_owner_confirmation' ? 'platform_owner_confirmed' : 'first_party',
    sourceUrl: verification.booking.url, checkedOn: verification.checkedOn,
    ...(verification.sourceKind === 'platform_owner_confirmation' ? { confirmationReference: verification.confirmationReference } : {}),
  }
}
