// Call ONLY after Auth getUser(token) has accepted this exact bearer token.
// Parsing a JWT alone is never authentication. A recent OTP AMR proves mailbox
// access even for legacy accounts that Auth previously auto-confirmed.
export function validatedTokenHasEmailProof(request,user,now=Date.now()) {
  try {
    const token=request.headers.get('authorization')?.slice(7)
    const claims=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString('utf8'))
    return claims.sub===user.id && claims.email?.trim().toLowerCase()===user.email.trim().toLowerCase()
      && claims.exp>now/1000 && Array.isArray(claims.amr)
      && claims.amr.some(item=>['otp','magiclink'].includes(item.method) && Number.isFinite(item.timestamp) && item.timestamp<=now/1000+30 && item.timestamp>=now/1000-900)
  } catch {return false}
}

export async function ensureCustomerEmailProof({request,user,store,now=Date.now()}) {
  const email=user.email.trim().toLowerCase()
  if(await store.has(user.id,email))return true
  if(!validatedTokenHasEmailProof(request,user,now))return false
  await store.save({user_id:user.id,email,verified_at:new Date(now).toISOString()})
  return true
}
