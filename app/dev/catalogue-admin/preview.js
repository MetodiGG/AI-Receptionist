'use client'
import { useCallback, useEffect, useRef } from 'react'
import { AdminCatalogue } from '../../../components/admin-catalogue'
import { BrandLogo } from '../../../components/brand-logo'
const initial = [
  { id:'sofia-local-photo-salon',name:'Примерен салон · локален тест',category:'beauty',address:'София · примерен адрес',editable:true,revision:0,photo:null },
  { id:'sofia-local-photo-auto',name:'Примерен автосервиз · локален тест',category:'auto_repair',address:'София · примерен адрес',editable:true,revision:0,photo:null },
]
export function CatalogueAdminPreview({ locale }) {
  const rows = useRef(structuredClone(initial)), urls = useRef(new Set())
  useEffect(() => () => { for (const url of urls.current) URL.revokeObjectURL(url) }, [])
  const send = useCallback(async (path, options = {}) => {
    const url = new URL(path,'http://localhost'), id = url.pathname.split('/')[4]
    if (!id) {
      const category = url.searchParams.get('category'), q = (url.searchParams.get('q') || '').toLowerCase()
      const found = rows.current.filter(row => (!category || row.category === category) && (!q || `${row.name} ${row.address}`.toLowerCase().includes(q)))
      return { entries:structuredClone(found),total:found.length,offset:0,nextOffset:null,categories:[{id:'beauty',bg:'Красота',en:'Beauty',count:1},{id:'auto_repair',bg:'Автосервиз',en:'Auto repair',count:1}] }
    }
    const row = rows.current.find(item => item.id === id)
    if (!row) throw {code:'CATALOGUE_NOT_FOUND'}
    if (options.method === 'POST') {
      const src = URL.createObjectURL(options.body.get('file')); urls.current.add(src)
      row.photo = {src,alt:options.body.get('alt')}; row.revision++
    } else if (options.method === 'PATCH') { row.photo=null; row.revision++ }
    return structuredClone(row)
  }, [])
  return <main className="platform-admin admin-console"><p className="admin-preview-notice">{locale === 'en' ? 'LOCAL TEST · fictional listings · photos stay in this browser only' : 'ЛОКАЛЕН ТЕСТ · измислени обекти · снимките остават само в този браузър'}</p><header className="admin-console-header"><BrandLogo/><h1>{locale === 'en' ? 'Catalogue' : 'Каталог'}</h1></header><AdminCatalogue send={send} locale={locale}/></main>
}
