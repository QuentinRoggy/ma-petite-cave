import type { HttpContext } from '@adonisjs/core/http'
import Subscription from '#models/subscription'
import User from '#models/user'
import { DateTime } from 'luxon'

export default class SubscriptionsController {
  /**
   * List all subscriptions
   * GET /admin/subscriptions?merchantId=xxx&clientId=xxx&status=active
   */
  async index({ request, response }: HttpContext) {
    const { merchantId, clientId, status, page = 1, limit = 20 } = request.qs()

    const query = Subscription.query()
      .preload('subscriber')
      .preload('merchant', (q) => q.preload('merchantProfile'))
      .orderBy('createdAt', 'desc')

    if (merchantId) query.where('merchantId', merchantId)
    if (clientId) query.where('clientId', clientId)
    if (status) query.where('status', status)

    const subscriptions = await query.paginate(page, limit)

    return response.ok({
      subscriptions: subscriptions.all().map((s) => ({
        id: s.id,
        status: s.status,
        createdAt: s.createdAt,
        activatedAt: s.activatedAt,
        client: {
          id: s.subscriber.id,
          email: s.subscriber.email,
          fullName: s.subscriber.fullName,
        },
        merchant: {
          id: s.merchant.id,
          email: s.merchant.email,
          fullName: s.merchant.fullName,
          shopName: s.merchant.merchantProfile?.shopName,
        },
      })),
      meta: subscriptions.getMeta(),
    })
  }

  /**
   * Create a subscription (link client to merchant)
   * POST /admin/subscriptions
   */
  async store({ request, response }: HttpContext) {
    const { clientId, merchantId, status = 'active' } = request.body()

    // Verify client exists and is a client
    const client = await User.find(clientId)
    if (!client) {
      return response.notFound({ error: 'Client not found' })
    }
    if (client.role !== 'client') {
      return response.badRequest({ error: 'User is not a client' })
    }

    // Verify merchant exists and is a merchant
    const merchant = await User.find(merchantId)
    if (!merchant) {
      return response.notFound({ error: 'Merchant not found' })
    }
    if (merchant.role !== 'merchant') {
      return response.badRequest({ error: 'User is not a merchant' })
    }

    // Check if subscription already exists
    const existing = await Subscription.query()
      .where('clientId', clientId)
      .where('merchantId', merchantId)
      .first()

    if (existing) {
      return response.conflict({ error: 'Subscription already exists', subscription: existing })
    }

    const subscription = await Subscription.create({
      clientId,
      merchantId,
      status,
      activatedAt: status === 'active' ? DateTime.now() : null,
    })

    await subscription.load('subscriber')
    await subscription.load('merchant', (q) => q.preload('merchantProfile'))

    return response.created({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        createdAt: subscription.createdAt,
        client: {
          id: subscription.subscriber.id,
          email: subscription.subscriber.email,
          fullName: subscription.subscriber.fullName,
        },
        merchant: {
          id: subscription.merchant.id,
          email: subscription.merchant.email,
          shopName: subscription.merchant.merchantProfile?.shopName,
        },
      },
    })
  }

  /**
   * Delete a subscription
   * DELETE /admin/subscriptions/:id
   */
  async destroy({ params, response }: HttpContext) {
    const subscription = await Subscription.find(params.id)

    if (!subscription) {
      return response.notFound({ error: 'Subscription not found' })
    }

    await subscription.delete()

    return response.ok({ message: 'Subscription deleted' })
  }
}
