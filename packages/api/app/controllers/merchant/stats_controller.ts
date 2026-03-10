import type { HttpContext } from '@adonisjs/core/http'
import Box from '#models/box'
import ClientWine from '#models/client_wine'
import Subscription from '#models/subscription'
import Wine from '#models/wine'
import db from '@adonisjs/lucid/services/db'

export default class MerchantStatsController {
  /**
   * Vue d'ensemble des KPIs
   * GET /merchant/stats/overview
   */
  async overview({ auth, response }: HttpContext) {
    const merchant = auth.user!

    const subscriptions = await Subscription.query()
      .where('merchantId', merchant.id)
      .select('id')
    const subscriptionIds = subscriptions.map((s) => s.id)

    if (subscriptionIds.length === 0) {
      return response.ok({
        stats: {
          totalBoxesSent: 0,
          avgRating: 0,
          ratingRate: 0,
          totalReorders: 0,
          totalWines: 0,
          totalClients: 0,
        },
      })
    }

    const [boxesCount, winesCount, clientsCount] = await Promise.all([
      Box.query()
        .whereIn('subscriptionId', subscriptionIds)
        .where('status', 'sent')
        .count('* as total'),
      Wine.query().where('merchantId', merchant.id).count('* as total'),
      Subscription.query()
        .where('merchantId', merchant.id)
        .where('status', 'active')
        .count('* as total'),
    ])

    const clientWines = await ClientWine.query()
      .whereHas('boxWine', (bwQuery) => {
        bwQuery.whereHas('box', (boxQuery) => {
          boxQuery.whereIn('subscriptionId', subscriptionIds)
        })
      })
      .select('rating', 'wantsReorder')

    const total = clientWines.length
    const rated = clientWines.filter((cw) => cw.rating !== null).length
    const avgRating =
      rated > 0
        ? clientWines
            .filter((cw) => cw.rating !== null)
            .reduce((sum, cw) => sum + (cw.rating || 0), 0) / rated
        : 0
    const totalReorders = clientWines.filter((cw) => cw.wantsReorder).length

    return response.ok({
      stats: {
        totalBoxesSent: Number(boxesCount[0].$extras.total),
        avgRating: Math.round(avgRating * 10) / 10,
        ratingRate: total > 0 ? Math.round((rated / total) * 100) : 0,
        totalReorders,
        totalWines: Number(winesCount[0].$extras.total),
        totalClients: Number(clientsCount[0].$extras.total),
      },
    })
  }

  /**
   * Top 5 vins les plus aimés
   * GET /merchant/stats/top-wines
   */
  async topWines({ auth, response }: HttpContext) {
    const merchant = auth.user!

    const subscriptions = await Subscription.query()
      .where('merchantId', merchant.id)
      .select('id')
    const subscriptionIds = subscriptions.map((s) => s.id)

    if (subscriptionIds.length === 0) {
      return response.ok({ wines: [] })
    }

    const results = await db
      .from('client_wines')
      .join('box_wines', 'client_wines.box_wine_id', 'box_wines.id')
      .join('boxes', 'box_wines.box_id', 'boxes.id')
      .join('wines', 'box_wines.wine_id', 'wines.id')
      .whereIn('boxes.subscription_id', subscriptionIds)
      .whereNotNull('client_wines.rating')
      .select('wines.id', 'wines.name', 'wines.domain', 'wines.vintage', 'wines.color', 'wines.photo_url')
      .avg('client_wines.rating as avg_rating')
      .count('client_wines.id as ratings_count')
      .groupBy('wines.id', 'wines.name', 'wines.domain', 'wines.vintage', 'wines.color', 'wines.photo_url')
      .orderBy('avg_rating', 'desc')
      .limit(5)

    return response.ok({
      wines: results.map((row) => ({
        id: row.id,
        name: row.name,
        domain: row.domain,
        vintage: row.vintage,
        color: row.color,
        photoUrl: row.photo_url,
        avgRating: Math.round(Number(row.avg_rating) * 10) / 10,
        ratingsCount: Number(row.ratings_count),
      })),
    })
  }

  /**
   * Clients les plus actifs
   * GET /merchant/stats/top-clients
   */
  async topClients({ auth, response }: HttpContext) {
    const merchant = auth.user!

    const subscriptions = await Subscription.query()
      .where('merchantId', merchant.id)
      .select('id', 'clientId')
    const subscriptionIds = subscriptions.map((s) => s.id)

    if (subscriptionIds.length === 0) {
      return response.ok({ clients: [] })
    }

    const results = await db
      .from('client_wines')
      .join('box_wines', 'client_wines.box_wine_id', 'box_wines.id')
      .join('boxes', 'box_wines.box_id', 'boxes.id')
      .join('users', 'client_wines.client_id', 'users.id')
      .whereIn('boxes.subscription_id', subscriptionIds)
      .whereNotNull('client_wines.rating')
      .select('users.id', 'users.full_name', 'users.email')
      .avg('client_wines.rating as avg_rating')
      .count('client_wines.id as ratings_count')
      .groupBy('users.id', 'users.full_name', 'users.email')
      .orderBy('ratings_count', 'desc')
      .limit(5)

    return response.ok({
      clients: results.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        avgRating: Math.round(Number(row.avg_rating) * 10) / 10,
        ratingsCount: Number(row.ratings_count),
      })),
    })
  }

  /**
   * Évolution mensuelle des box envoyées (12 derniers mois)
   * GET /merchant/stats/monthly
   */
  async monthly({ auth, response }: HttpContext) {
    const merchant = auth.user!

    const subscriptions = await Subscription.query()
      .where('merchantId', merchant.id)
      .select('id')
    const subscriptionIds = subscriptions.map((s) => s.id)

    if (subscriptionIds.length === 0) {
      return response.ok({ months: [] })
    }

    const results = await db
      .from('boxes')
      .whereIn('subscription_id', subscriptionIds)
      .where('status', 'sent')
      .select('month')
      .count('* as count')
      .groupBy('month')
      .orderBy('month', 'asc')

    // Générer les 12 derniers mois pour avoir un graphique complet
    const now = new Date()
    const months: Array<{ month: string; count: number }> = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = date.toISOString().slice(0, 7)
      const found = results.find((r: { month: string; count: string }) => r.month === monthStr)
      months.push({
        month: monthStr,
        count: found ? Number(found.count) : 0,
      })
    }

    return response.ok({ months })
  }
}
