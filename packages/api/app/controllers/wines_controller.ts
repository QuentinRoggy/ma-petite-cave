import type { HttpContext } from '@adonisjs/core/http'
import Wine from '#models/wine'
import { createWineValidator, updateWineValidator, indexWineValidator } from '#validators/wine'

export default class WinesController {
  async index({ auth, request }: HttpContext) {
    const user = auth.user!
    const filters = await request.validateUsing(indexWineValidator)

    const query = Wine.query()
      .where('merchantId', user.id)
      .orderBy('createdAt', 'desc')

    if (filters.query) {
      const search = `%${filters.query}%`
      query.where((q) => {
        q.whereILike('name', search)
          .orWhereILike('domain', search)
          .orWhereILike('region', search)
      })
    }

    if (filters.color) query.where('color', filters.color)

    const wines = await query
    return { wines }
  }

  async store({ auth, request }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(createWineValidator)
    const wine = await Wine.create({ ...payload, merchantId: user.id })
    return { wine }
  }

  async show({ auth, params }: HttpContext) {
    const wine = await Wine.query()
      .where('id', params.id)
      .where('merchantId', auth.user!.id)
      .firstOrFail()
    return { wine }
  }

  async update({ auth, params, request }: HttpContext) {
    const wine = await Wine.query()
      .where('id', params.id)
      .where('merchantId', auth.user!.id)
      .firstOrFail()
    const payload = await request.validateUsing(updateWineValidator)
    wine.merge(payload)
    await wine.save()
    return { wine }
  }

  async destroy({ auth, params, response }: HttpContext) {
    const wine = await Wine.query()
      .where('id', params.id)
      .where('merchantId', auth.user!.id)
      .firstOrFail()
    await wine.delete()
    return response.noContent()
  }

  async stats({ auth, response }: HttpContext) {
    const merchant = auth.user!

    const wines = await Wine.query().where('merchantId', merchant.id)
    const total = wines.length
    const byColor: Record<string, number> = {}
    for (const wine of wines) {
      const color = wine.color || 'non défini'
      byColor[color] = (byColor[color] || 0) + 1
    }

    return response.ok({ stats: { total, byColor } })
  }
}
