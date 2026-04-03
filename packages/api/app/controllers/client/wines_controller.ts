import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Box from '#models/box'
import ClientWine from '#models/client_wine'
import Wine from '#models/wine'
import Subscription from '#models/subscription'
import {
  updateClientWineValidator,
  createPersonalWineValidator,
  updatePersonalWineValidator,
} from '#validators/client_wine'

export default class ClientWinesController {
  /**
   * Liste tous les vins du client (box + personnels)
   * GET /client/wines
   */
  async index({ auth, request, response }: HttpContext) {
    const client = auth.user!
    const { status, rated, source, page = 1, limit = 20 } = request.qs()

    let query = ClientWine.query()
      .where('clientId', client.id)
      .preload('boxWine', (bwQuery) => bwQuery.preload('wine').preload('box'))
      .preload('wine')
      .orderBy('createdAt', 'desc')

    if (status) {
      query = query.where('status', status)
    }

    if (source === 'box' || source === 'personal') {
      query = query.where('source', source)
    }

    if (rated === 'true') {
      query = query.whereNotNull('rating')
    } else if (rated === 'false') {
      query = query.whereNull('rating')
    }

    const wines = await query.paginate(page, limit)

    return response.ok({
      wines: wines.all().map((cw) => {
        const wineData =
          cw.source === 'personal'
            ? cw.wine
            : cw.boxWine?.wine

        return {
          id: cw.id,
          status: cw.status,
          rating: cw.rating,
          personalNotes: cw.personalNotes,
          openedAt: cw.openedAt,
          finishedAt: cw.finishedAt,
          wantsReorder: cw.wantsReorder,
          source: cw.source,
          wine: wineData
            ? {
                id: wineData.id,
                name: wineData.name,
                domain: wineData.domain,
                vintage: wineData.vintage,
                color: wineData.color,
                photoUrl: wineData.photoUrl,
              }
            : null,
          boxMonth: cw.source === 'box' ? cw.boxWine?.box?.month : null,
        }
      }),
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
      .preload('wine')
      .firstOrFail()

    if (clientWine.source === 'personal') {
      return response.ok({
        clientWine: {
          id: clientWine.id,
          status: clientWine.status,
          rating: clientWine.rating,
          personalNotes: clientWine.personalNotes,
          openedAt: clientWine.openedAt,
          finishedAt: clientWine.finishedAt,
          wantsReorder: false,
          reorderRequestedAt: null,
          createdAt: clientWine.createdAt,
          source: 'personal',
          merchantNotes: null,
          wine: clientWine.wine,
          box: null,
          merchant: null,
        },
      })
    }

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
        source: 'box',
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
   * Ajouter un vin personnel à la cave
   * POST /client/wines
   */
  async store({ auth, request, response }: HttpContext) {
    const client = auth.user!
    const data = await request.validateUsing(createPersonalWineValidator)

    const { status: wineStatus, rating, personalNotes, ...wineData } = data

    const wine = await Wine.create({
      ...wineData,
      merchantId: null,
    })

    const clientWine = await ClientWine.create({
      wineId: wine.id,
      clientId: client.id,
      source: 'personal',
      status: wineStatus || 'in_cellar',
      rating: rating || null,
      personalNotes: personalNotes || null,
    })

    return response.created({
      clientWine: {
        id: clientWine.id,
        status: clientWine.status,
        source: 'personal',
        wine: {
          id: wine.id,
          name: wine.name,
          domain: wine.domain,
          vintage: wine.vintage,
          color: wine.color,
          photoUrl: wine.photoUrl,
        },
      },
    })
  }

  /**
   * Modifier un vin (statut, rating, notes + détails du vin si personnel)
   * PATCH /client/wines/:id
   */
  async update({ auth, params, request, response }: HttpContext) {
    const client = auth.user!

    const clientWine = await ClientWine.query()
      .where('id', params.id)
      .where('clientId', client.id)
      .preload('boxWine', (bwQuery) => bwQuery.preload('wine'))
      .preload('wine')
      .firstOrFail()

    if (clientWine.source === 'personal') {
      const data = await request.validateUsing(updatePersonalWineValidator)
      const { status: wineStatus, rating, personalNotes, ...wineData } = data

      if (Object.keys(wineData).length > 0 && clientWine.wine) {
        clientWine.wine.merge(wineData)
        await clientWine.wine.save()
      }

      const clientWineUpdate: Partial<typeof clientWine> = {}
      if (wineStatus !== undefined) {
        if (wineStatus === 'opened' && clientWine.status === 'in_cellar') {
          clientWine.openedAt = DateTime.now()
        }
        if (wineStatus === 'finished' && clientWine.status !== 'finished') {
          clientWine.finishedAt = DateTime.now()
        }
        clientWineUpdate.status = wineStatus
      }
      if (rating !== undefined) clientWineUpdate.rating = rating
      if (personalNotes !== undefined) clientWineUpdate.personalNotes = personalNotes

      clientWine.merge(clientWineUpdate)
      await clientWine.save()

      return response.ok({
        clientWine: {
          id: clientWine.id,
          status: clientWine.status,
          rating: clientWine.rating,
          personalNotes: clientWine.personalNotes,
          openedAt: clientWine.openedAt,
          finishedAt: clientWine.finishedAt,
          source: 'personal',
          wine: clientWine.wine,
        },
      })
    }

    const data = await request.validateUsing(updateClientWineValidator)
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
              const merchant = await subscription
                .related('merchant')
                .query()
                .preload('merchantProfile')
                .firstOrFail()
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
   * Supprimer un vin personnel
   * DELETE /client/wines/:id
   */
  async destroy({ auth, params, response }: HttpContext) {
    const client = auth.user!

    const clientWine = await ClientWine.query()
      .where('id', params.id)
      .where('clientId', client.id)
      .firstOrFail()

    if (clientWine.source !== 'personal') {
      return response.forbidden({
        message: 'Seuls les vins personnels peuvent être supprimés',
      })
    }

    const wineId = clientWine.wineId
    await clientWine.delete()

    if (wineId) {
      const wine = await Wine.find(wineId)
      if (wine) {
        await wine.delete()
      }
    }

    return response.ok({ message: 'Vin supprimé' })
  }

  /**
   * Demander une re-commande (uniquement pour les vins de box)
   * POST /client/wines/:id/reorder
   */
  async reorder({ auth, params, response }: HttpContext) {
    const client = auth.user!

    const clientWine = await ClientWine.query()
      .where('id', params.id)
      .where('clientId', client.id)
      .firstOrFail()

    if (clientWine.source === 'personal') {
      return response.badRequest({
        message: 'La re-commande n\'est pas disponible pour les vins personnels',
      })
    }

    if (clientWine.wantsReorder) {
      return response.badRequest({
        message: 'Vous avez déjà demandé ce vin',
      })
    }

    clientWine.wantsReorder = true
    clientWine.reorderRequestedAt = DateTime.now()
    await clientWine.save()

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
