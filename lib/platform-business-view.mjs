export function businessState(business) {
  return business.platform_status === 'archived' ? 'archived' : business.platform_status === 'suspended' ? 'suspended' : business.active ? 'published' : 'unpublished'
}
export function filterAdminBusinesses(rows, query = '', state = 'all') {
  const needle = query.trim().toLocaleLowerCase()
  return rows.filter(row => (state === 'all' || businessState(row) === state)
    && `${row.name} ${row.slug} ${row.city || ''} ${row.contact_email || ''}`.toLocaleLowerCase().includes(needle))
}
