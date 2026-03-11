import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Box from '#models/box'
import ClientWine from '#models/client_wine'
import Subscription from '#models/subscription'
import { updateClientWineValidator } from '#validators/client_wine'

export default class ClientWinesController {
  /**
   * Liste tous les vins du client
   * GET /client/wines
   */
  async index({ auth, request, response }: HttpContext) {
    const client = auth.user!
    const { status, rated, page = 1, limit = 20 } = request.qs()

    let query = ClientWine.query()
      .where('clientId', client.id)
      .preload('boxWine', (bwQuery) => bwQuery.preload('wine').preload('box'))
      .orderBy('createdAt', 'desc')

    if (status) {
      query = query.where('status', status)
    }

    if (rated === 'true') {
      query = query.whereNotNull('rating')
    } else if (rated === 'false') {
      query = query.whereNull('rating')
    }

    const wines = await query.paginate(page, limit)

    return response.ok({
      wines: wines.all().map((cw) => ({
        id: cw.id,
        status: cw.status,
        rating: cw.rating,
        personalNotes: cw.personalNotes,
        openedAt: cw.openedAt,
        finishedAt: cw.finishedAt,
        wantsReorder: cw.wantsReorder,
        wine: {
          id: cw.boxWine.wine.id,
          name: cw.boxWine.wine.name,
          domain: cw.boxWine.wine.domain,
          vintage: cw.boxWine.wine.vintage,
          color: cw.boxWine.wine.color,
          photoUrl: cw.boxWine.wine.photoUrl,
        },
        boxMonth: cw.boxWine.box.month,
      })),
      meta: wines.getMeta(),
    })
  }

  /**
   * Détail d'un vin avec toutes les infos
   * GET /client/wines/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const client = auth.user!

    const clientWine = await ClientWine.query()
      .where('id', params.id)
      .where('clientId', client.id)
      .preload('boxWine', (bwQuery) =>
        bwQuery.preload('wine').preload('box', (boxQuery) =>
          boxQuery.preload('subscription', (subQuery) =>
            subQuery.preload('merchant', (mQuery) => mQuery.preload('merchantProfile'))
          )
        )
      )
      .firstOrFail()

    return response.ok({
      clientWine: {
        id: clientWine.id,
        status: clientWine.status,
        rating: clientWine.rating,
        personalNotes: clientWine.personalNotes,
        openedAt: clientWine.openedAt,
        finishedAt: clientWine.finishedAt,
        wantsReorder: clientWine.wantsReorder,
        reorderRequestedAt: clientWine.reorderRequestedAt,
        createdAt: clientWine.createdAt,
        merchantNotes: clientWine.boxWine.merchantNotes,
        wine: clientWine.boxWine.wine,
        box: {
          month: clientWine.boxWine.box.month,
        },
        merchant: {
          shopName:
            clientWine.boxWine.box.subscription.merchant.merchantProfile?.shopName ||
            clientWine.boxWine.box.subscription.merchant.fullName,
        },
      },
    })
  }

  /**
   * Modifier un vin (statut, rating, notes)
   * PATCH /client/wines/:id
   */
  async update({ auth, params, request, response }: HttpContext) {
    const client = auth.user!
    const data = await request.validateUsing(updateClientWineValidator)

    const clientWine = await ClientWine.query()
      .where('id', params.id)
      .where('clientId', client.id)
      .preload('boxWine', (bwQuery) => bwQuery.preload('wine'))
      .firstOrFail()

    const hadRating = clientWine.rating !== null
    const newRating = data.rating !== undefined && data.rating !== null

    if (data.status === 'opened' && clientWine.status === 'in_cellar') {
      clientWine.openedAt = DateTime.now()
    }
    if (data.status === 'finished' && clientWine.status !== 'finished') {
      clientWine.finishedAt = DateTime.now()
    }

    clientWine.merge(data)
    await clientWine.save()

    // Créer une notification pour le caviste si nouvelle note
    if (!hadRating && newRating) {
      try {
        const box = await Box.find(clientWine.boxWine.boxId)
        if (box) {
          const subscription = await Subscription.find(box.subscriptionId)
          if (subscription) {
            const { default: NotificationService } = await import('#services/notification_service')
            await NotificationService.createFeedbackNotification({
              merchantId: subscription.merchantId,
              clientName: client.fullName || client.email,
              wineName: clientWine.boxWine.wine.name,
              rating: data.rating!,
              clientWineId: clientWine.id,
            })

            const { default: NotificationPreference } = await import(
              '#models/notification_preference'
            )
            const prefs = await NotificationPreference.findBy('userId', subscription.merchantId)
            const shouldSendInstant =
              (!prefs || prefs.emailFeedback) &&
              prefs?.emailFeedbackFrequency === 'instant'

            if (shouldSendInstant) {
              const { default: MailService } = await import('#services/mail_service')
              const merchant = await subscription.related('merchant').query().preload('merchantProfile').firstOrFail()
              const mailService = new MailService()
              await mailService.sendFeedbackDigest({
                to: merchant.email,
                merchantName: merchant.merchantProfile?.shopName || merchant.fullName || '',
                feedbacks: [
                  {
                    wineName: clientWine.boxWine.wine.name,
                    clientName: client.fullName || client.email,
                    rating: data.rating!,
                    notes: data.personalNotes || null,
                  },
                ],
              })
            }
          }
        }
      } catch {
        // Ne pas bloquer si la notif/email échoue
      }
    }

    return response.ok({
      clientWine: {
        id: clientWine.id,
        status: clientWine.status,
        rating: clientWine.rating,
        personalNotes: clientWine.personalNotes,
        openedAt: clientWine.openedAt,
        finishedAt: clientWine.finishedAt,
      },
    })
  }

  /**
   * Demander une re-commande
   * POST /client/wines/:id/reorder
   */
  async reorder({ auth, params, response }: HttpContext) {
    const client = auth.user!

    const clientWine = await ClientWine.query()
      .where('id', params.id)
      .where('clientId', client.id)
      .firstOrFail()

    if (clientWine.wantsReorder) {
      return response.badRequest({
        message: 'Vous avez déjà demandé ce vin',
      })
    }

    clientWine.wantsReorder = true
    clientWine.reorderRequestedAt = DateTime.now()
    await clientWine.save()

    // Notifier le caviste (in-app + email)
    try {
      await clientWine.load('boxWine', (bwQuery) => bwQuery.preload('wine'))
      const box = await Box.find(clientWine.boxWine.boxId)
      if (box) {
        const subscription = await Subscription.find(box.subscriptionId)
        if (subscription) {
          const { default: NotificationService } = await import('#services/notification_service')
          await NotificationService.createReorderNotification({
            merchantId: subscription.merchantId,
            clientName: client.fullName || client.email,
            wineName: clientWine.boxWine.wine.name,
            clientWineId: clientWine.id,
          })

          const { default: NotificationPreference } = await import(
            '#models/notification_preference'
          )
          const prefs = await NotificationPreference.findBy('userId', subscription.merchantId)
          const shouldSendEmail = !prefs || prefs.emailReorder

          if (shouldSendEmail) {
            const { default: MailService } = await import('#services/mail_service')
            const merchant = await subscription.related('merchant').query().firstOrFail()
            const mailService = new MailService()
            await mailService.sendReorderRequest({
              to: merchant.email,
              clientName: client.fullName || client.email,
              wineName: clientWine.boxWine.wine.name,
            })
          }
        }
      }
    } catch {
      // Ne pas bloquer si la notif/email échoue
    }

    return response.ok({
      message: 'Demande de re-commande enregistrée',
      clientWine: {
        id: clientWine.id,
        wantsReorder: clientWine.wantsReorder,
      },
    })
  }
}
