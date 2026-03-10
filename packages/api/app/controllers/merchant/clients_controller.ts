import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import User from '#models/user'
import Subscription from '#models/subscription'
import { createClientValidator, updateClientValidator } from '#validators/client'

export default class ClientsController {
  /**
   * Liste tous les clients du caviste
   * GET /merchant/clients
   */
  async index({ auth, request, response }: HttpContext) {
    const merchant = auth.user!
    const { search, status } = request.qs()

    const query = Subscription.query()
      .where('merchantId', merchant.id)
      .preload('subscriber')
      .preload('boxes', (boxQuery) => {
        boxQuery.orderBy('month', 'desc').limit(1)
      })
      .orderBy('createdAt', 'desc')

    if (status) {
      query.where('status', status)
    }

    if (search) {
      query.whereHas('subscriber', (clientQuery) => {
        clientQuery.whereILike('fullName', `%${search}%`).orWhereILike('email', `%${search}%`)
      })
    }

    const subscriptions = await query

    return response.ok({
      clients: subscriptions.map((sub) => ({
        id: sub.id,
        status: sub.status,
        notes: sub.notes,
        createdAt: sub.createdAt,
        client: {
          id: sub.subscriber.id,
          email: sub.subscriber.email,
          fullName: sub.subscriber.fullName,
          phone: sub.subscriber.phone,
        },
        lastBox: sub.boxes[0] || null,
      })),
    })
  }

  /**
   * Détail d'un client avec son historique
   * GET /merchant/clients/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const merchant = auth.user!

    const subscription = await Subscription.query()
      .where('id', params.id)
      .where('merchantId', merchant.id)
      .preload('subscriber')
      .preload('boxes', (boxQuery) => {
        boxQuery.orderBy('month', 'desc').preload('boxWines', (bwQuery) => {
          bwQuery.preload('wine').preload('clientWines')
        })
      })
      .firstOrFail()

    return response.ok({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        notes: subscription.notes,
        createdAt: subscription.createdAt,
        client: {
          id: subscription.subscriber.id,
          email: subscription.subscriber.email,
          fullName: subscription.subscriber.fullName,
          phone: subscription.subscriber.phone,
          preferences: subscription.subscriber.preferences || {},
        },
        boxes: subscription.boxes.map((box) => ({
          id: box.id,
          month: box.month,
          status: box.status,
          sentAt: box.sentAt,
          wines: box.boxWines.map((bw) => ({
            id: bw.id,
            wine: bw.wine,
            merchantNotes: bw.merchantNotes,
            clientFeedback: bw.clientWines[0] || null,
          })),
        })),
      },
    })
  }

  /**
   * Créer un nouveau client (onboarding magasin)
   * POST /merchant/clients
   */
  async store({ auth, request, response }: HttpContext) {
    const merchant = auth.user!
    const data = await request.validateUsing(createClientValidator)

    // Vérifier si l'email existe déjà
    const existingUser = await User.findBy('email', data.email)

    let client: User

    if (existingUser) {
      // L'utilisateur existe déjà
      if (existingUser.role !== 'client') {
        return response.badRequest({
          message: 'Cet email est associé à un compte caviste',
        })
      }

      // Vérifier s'il n'est pas déjà client de ce caviste
      const existingSub = await Subscription.query()
        .where('clientId', existingUser.id)
        .where('merchantId', merchant.id)
        .first()

      if (existingSub) {
        return response.badRequest({
          message: 'Ce client est déjà dans votre liste',
        })
      }

      client = existingUser
    } else {
      // Créer le nouveau client
      client = await User.create({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone,
        role: 'client',
      })
    }

    // Créer la subscription
    const subscription = await Subscription.create({
      clientId: client.id,
      merchantId: merchant.id,
      status: 'active',
      notes: data.notes,
      activatedAt: DateTime.now(),
    })

    await subscription.load('subscriber')

    return response.created({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        subscriber: {
          id: client.id,
          email: client.email,
          fullName: client.fullName,
        },
      },
    })
  }

  /**
   * Modifier les infos d'un client (notes, status)
   * PATCH /merchant/clients/:id
   */
  async update({ auth, params, request, response }: HttpContext) {
    const merchant = auth.user!
    const data = await request.validateUsing(updateClientValidator)

    const subscription = await Subscription.query()
      .where('id', params.id)
      .where('merchantId', merchant.id)
      .firstOrFail()

    subscription.merge(data)
    await subscription.save()

    return response.ok({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        notes: subscription.notes,
      },
    })
  }

  /**
   * Statistiques des clients
   * GET /merchant/clients/stats
   */
  async stats({ auth, response }: HttpContext) {
    const merchant = auth.user!

    const [total, active, withRecentBox] = await Promise.all([
      Subscription.query().where('merchantId', merchant.id).count('* as count'),
      Subscription.query()
        .where('merchantId', merchant.id)
        .where('status', 'active')
        .count('* as count'),
      // Clients avec une box ce mois-ci
      Subscription.query()
        .where('merchantId', merchant.id)
        .whereHas('boxes', (q) => {
          q.where('month', DateTime.now().toFormat('yyyy-MM'))
        })
        .count('* as count'),
    ])

    return response.ok({
      stats: {
        total: Number(total[0].$extras.count),
        active: Number(active[0].$extras.count),
        withBoxThisMonth: Number(withRecentBox[0].$extras.count),
      },
    })
  }
}
