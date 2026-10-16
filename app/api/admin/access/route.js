import { isPlatformAdmin, requireUser } from '../../../../lib/server-auth'
import { privateJson } from '../../../../lib/platform-admin.mjs'

export async function GET(request) {
  try {
    const user = await requireUser(request)
    if (!user) return privateJson({ error: { code: 'UNAUTHORIZED' } },401)
    if (!user.email_confirmed_at || user.is_anonymous || !isPlatformAdmin(user)) return privateJson({ error: { code: 'FORBIDDEN' } },403)
    return privateJson({ admin:true,email:user.email })
  }catch{return privateJson({error:{code:'ADMIN_UNAVAILABLE'}},503)}
}
