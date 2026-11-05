// New registrations receive a page address automatically. The random suffix
// prevents two businesses with the same name needing a hidden manual field.
// This is a public identifier, never an authentication secret.
export function businessPageSlug(name, nonce) {
  if (!/^[a-f0-9]{12}$/i.test(nonce || '')) throw new Error('INVALID_SLUG_NONCE')
  const map = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sht',ъ:'a',ь:'',ю:'yu',я:'ya' }
  const base = String(name || '').toLowerCase().split('').map(char => map[char] ?? char).join('')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0,35).replace(/-+$/g, '') || 'business'
  return `${base}-${nonce.toLowerCase()}`
}
