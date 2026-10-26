import { SITE_ORIGIN } from '../lib/seo.mjs'
export default function robots() {
  return {rules:{userAgent:'*',allow:'/',disallow:['/api/','/admin','/dashboard','/account','/login','/forgot-password','/reset-password','/booking/','/review/','/dev/']},sitemap:`${SITE_ORIGIN}/sitemap.xml`}
}
