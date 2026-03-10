import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Box from '#models/box'
import BoxWine from '#models/box_wine'
import ClientWine from '#models/client_wine'
import Subscription from '#models/subscription'
import { createBoxValidator, updateBoxValidator } from '#validators/box'

export default class BoxesController {
  /**
   * Liste toutes les box du caviste
   * GET /merchant/boxes
   */
  async index({ auth, request, response }: HttpContext) {
    const merchant = auth.user!
    const { clientId, month, status, page = 1, limit = 20 } = request.qs()

    let query = Box.query()

    // Filter by merchant through subscription
    const subscriptionIds = await Subscription.query()
      .where('merchantId', merchant.id)
      .if(clientId, (q) => q.where('clientId', clientId))
      .select('id')

    query = query.whereIn(
      'subscriptionId',
      subscriptionIds.map((s) => s.id)
    )

    if (month) {
      query = query.where('month', month)
    }

    if (status) {
      query = query.where('status', status)
    }

    const boxes = await query
      .preload('subscription', (q) => q.preload('subscriber'))
      .preload('boxWines', (q) => q.preload('wine'))
      .orderBy('month', 'desc')
      .paginate(page, limit)

    return response.ok({
      boxes: boxes.all().map((box) => ({
        id: box.id,
        month: box.month,
        status: box.status,
        sentAt: box.sentAt,
        client: {
          id: box.subscription.subscriber.id,
          fullName: box.subscription.subscriber.fullName,
          email: box.subscription.subscriber.email,
        },
        wines: box.boxWines.map((bw) => ({
          id: bw.id,
          wine: bw.wine,
          merchantNotes: bw.merchantNotes,
          position: bw.position,
        })),
      })),
      meta: boxes.getMeta(),
    })
  }

  /**
   * Détail d'une box
   * GET /merchant/boxes/:id
   */
  async show({ auth, params, response }: HttpContext) {
    const merchant = auth.user!

    // First verify the box belongs to this merchant
    const box = await Box.query()
      .where('id', params.id)
      .preload('subscription', (q) => q.preload('subscriber'))
      .preload('boxWines', (q) => q.preload('wine').preload('clientWines'))
      .firstOrFail()

    // Check ownership
    if (box.subscription.merchantId !== merchant.id) {
      return response.forbidden({ message: 'Accès non autorisé' })
    }

    return response.ok({
      box: {
        id: box.id,
        month: box.month,
        status: box.status,
        sentAt: box.sentAt,
        createdAt: box.createdAt,
        client: {
          id: box.subscription.subscriber.id,
          fullName: box.subscription.subscriber.fullName,
          email: box.subscription.subscriber.email,
        },
        wines: box.boxWines.map((bw) => ({
          id: bw.id,
          wine: bw.wine,
          merchantNotes: bw.merchantNotes,
          position: bw.position,
          clientFeedback: bw.clientWines[0] || null,
        })),
      },
    })
  }

  /**
   * Créer une nouvelle box
   * POST /merchant/boxes
   */
  async store({ auth, request, response }: HttpContext) {
    const merchant = auth.user!
    const data = await request.validateUsing(createBoxValidator)

    // Vérifier que la subscription appartient au merchant
    const subscription = await Subscription.query()
      .where('id', data.subscriptionId)
      .where('merchantId', merchant.id)
      .firstOrFail()

    // Vérifier qu'il n'y a pas déjà une box pour ce mois
    const existingBox = await Box.query()
      .where('subscriptionId', subscription.id)
      .where('month', data.month)
      .first()

    if (existingBox) {
      return response.badRequest({
        message: `Une box existe déjà pour ${data.month}`,
      })
    }

    // Créer la box
    const box = await Box.create({
      subscriptionId: subscription.id,
      month: data.month,
      status: 'draft',
    })

    // Ajouter les vins
    for (let i = 0; i < data.wines.length; i++) {
      const wineData = data.wines[i]
      await BoxWine.create({
        boxId: box.id,
        wineId: wineData.wineId,
        merchantNotes: wineData.merchantNotes,
        position: wineData.position || i + 1,
      })
    }

    await box.load('boxWines', (q) => q.preload('wine'))
    await box.load('subscription', (q) => q.preload('subscriber'))

    return response.created({
      box: {
        id: box.id,
        month: box.month,
        status: box.status,
        client: {
          id: box.subscription.subscriber.id,
          fullName: box.subscription.subscriber.fullName,
        },
        wines: box.boxWines.map((bw) => ({
          id: bw.id,
          wine: bw.wine,
          merchantNotes: bw.merchantNotes,
        })),
      },
    })
  }

  /**
   * Modifier une box (seulement si draft)
   * PATCH /merchant/boxes/:id
   */
  async update({ auth, params, request, response }: HttpContext) {
    const merchant = auth.user!
    const data = await request.validateUsing(updateBoxValidator)

    const box = await Box.query()
      .where('id', params.id)
      .preload('subscription')
      .firstOrFail()

    // Check ownership
    if (box.subscription.merchantId !== merchant.id) {
      return response.forbidden({ message: 'Accès non autorisé' })
    }

    if (box.status !== 'draft') {
      return response.badRequest({
        message: 'Impossible de modifier une box déjà envoyée',
      })
    }

    // Mettre à jour les vins si fournis
    if (data.wines) {
      // Supprimer les anciens
      await BoxWine.query().where('boxId', box.id).delete()

      // Ajouter les nouveaux
      for (let i = 0; i < data.wines.length; i++) {
        const wineData = data.wines[i]
        await BoxWine.create({
          boxId: box.id,
          wineId: wineData.wineId,
          merchantNotes: wineData.merchantNotes,
          position: wineData.position || i + 1,
        })
      }
    }

    await box.load('boxWines', (q) => q.preload('wine'))

    return response.ok({
      box: {
        id: box.id,
        month: box.month,
        status: box.status,
        wines: box.boxWines.map((bw) => ({
          id: bw.id,
          wine: bw.wine,
          merchantNotes: bw.merchantNotes,
        })),
      },
    })
  }

  /**
   * Envoyer une box au client
   * POST /merchant/boxes/:id/send
   */
  async send({ auth, params, response }: HttpContext) {
    const merchant = auth.user!

    const box = await Box.query()
      .where('id', params.id)
      .preload('subscription')
      .preload('boxWines')
      .firstOrFail()

    // Check ownership
    if (box.subscription.merchantId !== merchant.id) {
      return response.forbidden({ message: 'Accès non autorisé' })
    }

    if (box.status === 'sent') {
      return response.badRequest({
        message: 'Cette box a déjà été envoyée',
      })
    }

    if (box.boxWines.length === 0) {
      return response.badRequest({
        message: "Impossible d'envoyer une box vide",
      })
    }

    // Marquer comme envoyée
    box.status = 'sent'
    box.sentAt = DateTime.now()
    await box.save()

    // Créer les ClientWine pour que le client puisse les noter
    for (const boxWine of box.boxWines) {
      await ClientWine.create({
        boxWineId: boxWine.id,
        clientId: box.subscription.clientId,
        status: 'in_cellar',
      })
    }

    return response.ok({
      message: 'Box envoyée avec succès',
      box: {
        id: box.id,
        status: box.status,
        sentAt: box.sentAt,
      },
    })
  }

  /**
   * Supprimer une box (seulement si draft)
   * DELETE /merchant/boxes/:id
   */
  async destroy({ auth, params, response }: HttpContext) {
    const merchant = auth.user!

    const box = await Box.query()
      .where('id', params.id)
      .preload('subscription')
      .firstOrFail()

    // Check ownership
    if (box.subscription.merchantId !== merchant.id) {
      return response.forbidden({ message: 'Accès non autorisé' })
    }

    if (box.status !== 'draft') {
      return response.badRequest({
        message: 'Impossible de supprimer une box déjà envoyée',
      })
    }

    await box.delete()

    return response.noContent()
  }
}
