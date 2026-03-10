import type { HttpContext } from '@adonisjs/core/http'
import Box from '#models/box'
import Subscription from '#models/subscription'

export default class ClientBoxesController {
  /**
   * Liste les box du client
   * GET /client/boxes
   */
  async index({ auth, request, response }: HttpContext) {
    const client = auth.user!
    const { page = 1, limit = 20 } = request.qs()

    const subscriptionIds = await Subscription.query()
      .where('clientId', client.id)
      .where('status', 'active')
      .select('id')

    const boxes = await Box.query()
      .whereIn(
        'subscriptionId',
        subscriptionIds.map((s) => s.id)
      )
      .where('status', 'sent')
      .preload('subscription', (q) => q.preload('merchant', (mq) => mq.preload('merchantProfile')))
      .preload('boxWines', (bwQuery) =>
        bwQuery.preload('wine').preload('clientWines', (cwQuery) => cwQuery.where('clientId', client.id))
      )
      .orderBy('sentAt', 'desc')
      .paginate(page, limit)

    return response.ok({
      boxes: boxes.all().map((box) => ({
        id: box.id,
        month: box.month,
        sentAt: box.sentAt,
        merchant: {
          shopName: box.subscription.merchant.merchantProfile?.shopName || box.subscription.merchant.fullName,
        },
        wines: box.boxWines.map((bw) => ({
          id: bw.id,
          wine: {
            id: bw.wine.id,
            name: bw.wine.name,
            domain: bw.wine.domain,
            vintage: bw.wine.vintage,
            color: bw.wine.color,
            photoUrl: bw.wine.photoUrl,
          },
          clientWine: bw.clientWines[0] || null,
        })),
        totalWines: box.boxWines.length,
        ratedWines: box.boxWines.filter((bw) => bw.clientWines[0]?.rating).length,
      })),
      meta: boxes.getMeta(),
    })
  }

  /**
   * Détail d'une box
   * GET /client/boxes/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const client = auth.user!

    const box = await Box.query()
      .where('id', params.id)
      .where('status', 'sent')
      .preload('subscription', (q) => q.preload('merchant', (mq) => mq.preload('merchantProfile')))
      .preload('boxWines', (bwQuery) =>
        bwQuery.preload('wine').preload('clientWines', (cwQuery) => cwQuery.where('clientId', client.id))
      )
      .firstOrFail()

    // Verify ownership
    if (box.subscription.clientId !== client.id) {
      return response.forbidden({ message: 'Accès non autorisé' })
    }

    return response.ok({
      box: {
        id: box.id,
        month: box.month,
        sentAt: box.sentAt,
        merchant: {
          shopName: box.subscription.merchant.merchantProfile?.shopName || box.subscription.merchant.fullName,
        },
        wines: box.boxWines.map((bw) => ({
          id: bw.id,
          merchantNotes: bw.merchantNotes,
          wine: bw.wine,
          clientWine: bw.clientWines[0] || null,
        })),
      },
    })
  }
}
