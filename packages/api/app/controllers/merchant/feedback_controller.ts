import type { HttpContext } from '@adonisjs/core/http'
import ClientWine from '#models/client_wine'
import Subscription from '#models/subscription'

export default class FeedbackController {
  /**
   * Liste tous les feedbacks récents
   * GET /merchant/feedback
   */
  async index({ auth, request, response }: HttpContext) {
    const merchant = auth.user!
    const { page = 1, limit = 20, clientId } = request.qs()

    // Get subscription IDs for this merchant
    const subscriptionQuery = Subscription.query().where('merchantId', merchant.id)
    if (clientId) {
      subscriptionQuery.where('clientId', clientId)
    }
    const subscriptions = await subscriptionQuery.select('id')
    const subscriptionIds = subscriptions.map((s) => s.id)

    if (subscriptionIds.length === 0) {
      return response.ok({ feedbacks: [], meta: { total: 0, perPage: limit, currentPage: page } })
    }

    const feedbacks = await ClientWine.query()
      .whereNotNull('rating')
      .whereHas('boxWine', (bwQuery) => {
        bwQuery.whereHas('box', (boxQuery) => {
          boxQuery.whereIn('subscriptionId', subscriptionIds)
        })
      })
      .preload('client')
      .preload('boxWine', (bwQuery) => {
        bwQuery.preload('wine').preload('box')
      })
      .orderBy('updatedAt', 'desc')
      .paginate(page, limit)

    return response.ok({
      feedbacks: feedbacks.all().map((cw) => ({
        id: cw.id,
        rating: cw.rating,
        personalNotes: cw.personalNotes,
        status: cw.status,
        updatedAt: cw.updatedAt,
        client: {
          id: cw.client.id,
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
        box: {
          month: cw.boxWine.box.month,
        },
      })),
      meta: feedbacks.getMeta(),
    })
  }

  /**
   * Stats des feedbacks
   * GET /merchant/feedback/stats
   */
  async stats({ auth, response }: HttpContext) {
    const merchant = auth.user!

    // Get subscription IDs for this merchant
    const subscriptions = await Subscription.query()
      .where('merchantId', merchant.id)
      .select('id')
    const subscriptionIds = subscriptions.map((s) => s.id)

    if (subscriptionIds.length === 0) {
      return response.ok({
        stats: {
          total: 0,
          rated: 0,
          ratingRate: 0,
          avgRating: 0,
          byRating: [1, 2, 3, 4, 5].map((r) => ({ rating: r, count: 0 })),
          byStatus: { in_cellar: 0, opened: 0, finished: 0 },
        },
      })
    }

    // Get all ClientWines for this merchant
    const clientWines = await ClientWine.query()
      .whereHas('boxWine', (bwQuery) => {
        bwQuery.whereHas('box', (boxQuery) => {
          boxQuery.whereIn('subscriptionId', subscriptionIds)
        })
      })
      .select('rating', 'status')

    const total = clientWines.length
    const rated = clientWines.filter((cw) => cw.rating !== null).length
    const avgRating =
      rated > 0
        ? clientWines
            .filter((cw) => cw.rating !== null)
            .reduce((sum, cw) => sum + (cw.rating || 0), 0) / rated
        : 0

    const byRating = [1, 2, 3, 4, 5].map((r) => ({
      rating: r,
      count: clientWines.filter((cw) => cw.rating === r).length,
    }))

    const byStatus = {
      in_cellar: clientWines.filter((cw) => cw.status === 'in_cellar').length,
      opened: clientWines.filter((cw) => cw.status === 'opened').length,
      finished: clientWines.filter((cw) => cw.status === 'finished').length,
    }

    return response.ok({
      stats: {
        total,
        rated,
        ratingRate: total > 0 ? Math.round((rated / total) * 100) : 0,
        avgRating: Math.round(avgRating * 10) / 10,
        byRating,
        byStatus,
      },
    })
  }

  /**
   * Feedbacks récents pour le dashboard
   * GET /merchant/feedback/recent
   */
  async recent({ auth, response }: HttpContext) {
    const merchant = auth.user!

    // Get subscription IDs for this merchant
    const subscriptions = await Subscription.query()
      .where('merchantId', merchant.id)
      .select('id')
    const subscriptionIds = subscriptions.map((s) => s.id)

    if (subscriptionIds.length === 0) {
      return response.ok({ feedbacks: [] })
    }

    const feedbacks = await ClientWine.query()
      .whereNotNull('rating')
      .whereHas('boxWine', (bwQuery) => {
        bwQuery.whereHas('box', (boxQuery) => {
          boxQuery.whereIn('subscriptionId', subscriptionIds)
        })
      })
      .preload('client')
      .preload('boxWine', (bwQuery) => {
        bwQuery.preload('wine')
      })
      .orderBy('updatedAt', 'desc')
      .limit(5)

    return response.ok({
      feedbacks: feedbacks.map((cw) => ({
        id: cw.id,
        rating: cw.rating,
        personalNotes: cw.personalNotes,
        updatedAt: cw.updatedAt,
        client: {
          fullName: cw.client.fullName,
        },
        wine: {
          name: cw.boxWine.wine.name,
        },
      })),
    })
  }
}
