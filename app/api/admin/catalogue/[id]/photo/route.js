import { catalogueAdminHandlers } from '../../../../../../lib/catalogue-admin-server'
export const runtime = 'nodejs'
export async function GET(request, context) { return catalogueAdminHandlers.GET(request, (await context.params).id) }
export async function POST(request, context) { return catalogueAdminHandlers.POST(request, (await context.params).id) }
export async function PATCH(request, context) { return catalogueAdminHandlers.PATCH(request, (await context.params).id) }
