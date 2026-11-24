// Usage: unzip -p zeml_sofia.zip zeml_sofia.geojson |
//        node scripts/prepare-sofia-settlement-exclusions.mjs
// stdout only. Input is the licensed GIS Sofia dataset, not a geocoder.
import { readFileSync } from 'node:fs'

const separate = new Set(['Балша', 'Банкя', 'Бистрица', 'Бухово', 'Бусманци', 'Владая', 'Волуяк', 'Войняговци',
  'Герман', 'Гниляне', 'Горни Богров', 'Горни Лозен', 'Доброславци', 'Долни Богров', 'Долни Лозен',
  'Долни Пасарел', 'Железница', 'Желява', 'Житен', 'Иваняне', 'Казичане', 'Клисура', 'Кокаляне',
  'Кривина', 'Кубратово', 'Кумарица', 'Курило', 'Кътина', 'Локорско', 'Мало Бучино', 'Мировяне',
  'Мрамор', 'Мърчаево', 'Негован', 'Панчарево', 'Плана', 'Подгумер', 'Световрачане', 'Славовци', 'Чепинци', 'Яна'])
const source = JSON.parse(readFileSync(0, 'utf8'))
const epsilon = 0.0004
function pointToSegment([x, y], [a, b], [c, d]) {
  const dx = c - a, dy = d - b
  const length = dx ** 2 + dy ** 2
  const t = length ? Math.max(0, Math.min(1, ((x - a) * dx + (y - b) * dy) / length)) : 0
  return Math.hypot(x - a - dx * t, y - b - dy * t)
}
function simplify(ring) {
  let index = 0, worst = epsilon
  for (let i = 1; i < ring.length - 1; i++) {
    const distance = pointToSegment(ring[i], ring[0], ring.at(-1))
    if (distance > worst) { index = i; worst = distance }
  }
  return index ? [...simplify(ring.slice(0, index + 1)).slice(0, -1), ...simplify(ring.slice(index))] : [ring[0], ring.at(-1)]
}
const rounded = ring => {
  const result = simplify(ring)
  return (result.length < 4 ? ring : result).map(([x, y]) => [Number(x.toFixed(6)), Number(y.toFixed(6))])
}
const output = source.features.filter(f => separate.has(f.properties?.boundary_line)).flatMap(f => {
  const polygons = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : []
  return polygons.map(rings => {
    const first = rings[0]
    if (first.length < 4 || !first.every(([x, y]) => x > 22 && x < 25 && y > 41 && y < 44)) throw Error('Unexpected Sofia dataset projection')
    return [f.properties.boundary_line, rings.map(rounded)]
  })
})
if (output.length < separate.size) throw Error('Incomplete municipality source')
console.log(JSON.stringify(output))
