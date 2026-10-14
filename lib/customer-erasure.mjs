function check(result) {
  if (result.error) throw result.error
  return result.data
}

// Run only after the HTTP handler has verified business ownership. Every
// operation is tenant-scoped and retryable; never report success mid-cleanup.
export async function eraseCustomerData(supabase, businessId, customerId) {
  check(await supabase.from('conversations').delete().eq('business_id', businessId).eq('customer_id', customerId))
  check(await supabase.from('messages').delete().eq('business_id', businessId).eq('customer_id', customerId))

  // Paginate rather than silently leaving data behind at PostgREST's row cap.
  for (let offset = 0; ; offset += 500) {
    const rows = check(await supabase.from('appointments').select('id').eq('business_id', businessId).eq('customer_id', customerId).order('id').range(offset, offset + 499)) || []
    if (rows.length) {
      check(await supabase.from('notification_outbox').delete().eq('business_id', businessId).in('appointment_id', rows.map((row) => row.id)))
    }
    if (rows.length < 500) break
  }
  check(await supabase.from('appointments').update({ notes: null, updated_at: new Date().toISOString() }).eq('business_id', businessId).eq('customer_id', customerId))
  const customer = check(await supabase.from('customers').update({ name: 'Изтрит клиент', phone: null, email: null, notes: null, external_id: null, last_seen_at: null }).eq('business_id', businessId).eq('id', customerId).select('id').maybeSingle())
  if (!customer) throw new Error('Customer changed during erasure')
}
