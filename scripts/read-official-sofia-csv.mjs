// Offline-only adapter for the municipality's user-supplied CSV export.
// No network requests, geocoding, business inference or automatic publication.
const HEADER = ['rn', 'region', 'settlement', 'lareaunit', 'block', 'street', 'streetnum', 'entrance', 'n', 'e']

export function readOfficialSofiaCsv(source) {
  if (typeof source !== 'string') throw new TypeError('Expected UTF-8 municipal CSV text')
  const text = source.replace(/^\uFEFF/u, '')
  const rows = [], row = []
  let field = '', quoted = false, closed = false
  const endField = () => { row.push(field); field = ''; closed = false }
  const endRow = () => { endField(); rows.push(row.splice(0)) }
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else { quoted = false; closed = true }
      } else field += ch
      continue
    }
    if (ch === ';') endField()
    else if (ch === '\n') endRow()
    else if (ch === '\r') {
      if (text[i + 1] !== '\n') throw new TypeError('Expected LF or CRLF CSV line endings')
      endRow(); i++
    } else if (ch === '"') {
      if (field || closed) throw new TypeError('Unexpected CSV quote')
      quoted = true
    } else {
      if (closed) throw new TypeError('Unexpected characters after a quoted field')
      field += ch
    }
  }
  if (quoted) throw new TypeError('Unclosed CSV field')
  if (field || row.length || closed) endRow()
  const header = rows.shift()
  if (JSON.stringify(header) !== JSON.stringify(HEADER)) throw new TypeError('Unexpected municipal CSV columns or delimiter')
  const ids = new Set()
  const features = rows.map((values, index) => {
    if (values.length !== HEADER.length) throw new TypeError(`Invalid CSV column count at data row ${index + 1}`)
    const p = Object.fromEntries(HEADER.map((key, col) => [key, values[col]]))
    if (!/^[1-9]\d*$/u.test(p.rn) || ids.has(p.rn)) throw new TypeError(`Invalid or duplicate municipal rn at data row ${index + 1}`)
    ids.add(p.rn)
    if (!/^-?\d+(?:\.\d+)?$/u.test(p.n) || !/^-?\d+(?:\.\d+)?$/u.test(p.e)) throw new TypeError(`Invalid coordinates at data row ${index + 1}`)
    const latitude = Number(p.n), longitude = Number(p.e)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < 41 || latitude > 45 || longitude < 22 || longitude > 29) throw new TypeError(`Coordinates outside Bulgaria at data row ${index + 1}`)
    // Three rows in the supplied export have no settlement. Preserve the
    // missing value; the existing Sofia index excludes them, never imputes Sofia.
    const properties = Object.fromEntries(HEADER.slice(0, 8).map(key => [key, p[key]]))
    return { type: 'Feature', properties, geometry: { type: 'Point', coordinates: [longitude, latitude] } }
  })
  return { type: 'FeatureCollection', features }
}
