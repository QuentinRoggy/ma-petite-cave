import type { HttpContext } from '@adonisjs/core/http'
import ClientWine from '#models/client_wine'
import Subscription from '#models/subscription'
import db from '@adonisjs/lucid/services/db'

export default class ReordersController {
  /**
   * Liste les demandes de re-commande
   * GET /merchant/reorders
   */
  async index({ auth, request, response }: HttpContext) {
    const merchant = auth.user!
    const { page = 1, limit = 20 } = request.qs()

    // Get subscription IDs for this merchant
    const subscriptions = await Subscription.query()
      .where('merchantId', merchant.id)
      .select('id')
    const subscriptionIds = subscriptions.map((s) => s.id)

    if (subscriptionIds.length === 0) {
      return response.ok({ reorders: [], meta: { total: 0, perPage: limit, currentPage: page } })
    }

    const reorders = await ClientWine.query()
      .where('wantsReorder', true)
      .whereHas('boxWine', (bwQuery) => {
        bwQuery.whereHas('box', (boxQuery) => {
          boxQuery.whereIn('subscriptionId', subscriptionIds)
        })
      })
      .preload('client')
      .preload('boxWine', (bwQuery) => {
        bwQuery.preload('wine')
      })
      .orderBy('reorderRequestedAt', 'desc')
      .paginate(page, limit)

    return response.ok({
      reorders: reorders.all().map((cw) => ({
        id: cw.id,
        requestedAt: cw.reorderRequestedAt,
        rating: cw.rating,
        personalNotes: cw.personalNotes,
        client: {
          id: cw.clientId,
          fullName: cw.client.fullName,
          email: cw.client.email,
        },
        wine: {
          id: cw.boxWine.wine.id,
          name: cw.boxWine.wine.name,
          domain: cw.boxWine.wine.domain,
          vintage: cw.boxWine.wine.vintage,
          photoUrl: cw.boxWine.wine.photoUrl,
        },
      })),
      meta: reorders.getMeta(),
    })
  }

  /**
   * Nombre de demandes en attente
   * GET /merchant/reorders/count
   */
  async count({ auth, response }: HttpContext) {
    const merchant = auth.user!

    // Get subscription IDs for this merchant
    const subscriptions = await Subscription.query()
      .where('merchantId', merchant.id)
      .select('id')
    const subscriptionIds = subscriptions.map((s) => s.id)

    if (subscriptionIds.length === 0) {
      return response.ok({ count: 0 })
    }

    const result = await db
      .from('client_wines')
      .where('wants_reorder', true)
      .whereIn('box_wine_id', (subquery) => {
        subquery
          .from('box_wines')
          .select('id')
          .whereIn('box_id', (boxSubquery) => {
            boxSubquery
              .from('boxes')
              .select('id')
              .whereIn('subscription_id', subscriptionIds)
          })
      })
      .count('* as total')

    return response.ok({
      count: Number(result[0].total),
    })
  }
}
