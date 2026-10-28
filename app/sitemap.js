import { getSupabaseAdmin } from '../lib/supabase-admin'
import { localizedUrl, languageAlternates } from '../lib/seo.mjs'
export const dynamic='force-dynamic'
export default async function sitemap() {
  const paths=['/','/for-businesses','/privacy','/terms']
  const db=getSupabaseAdmin()
  for(let offset=0;;offset+=500){
    const {data,error}=await db.from('businesses').select('slug').eq('active',true).eq('platform_status','enabled').order('slug').range(offset,offset+499)
    if(error)throw new Error('SITEMAP_UNAVAILABLE')
    for(const row of data||[])if(/^[a-z0-9-]{2,64}$/.test(row.slug))paths.push(`/book/${row.slug}`)
    if(!data||data.length<500)break
  }
  return paths.flatMap(path=>['bg','en'].map(locale=>({url:localizedUrl(path,locale),alternates:{languages:languageAlternates(path).languages}})))
}
