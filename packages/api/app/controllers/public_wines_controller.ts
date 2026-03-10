import type { HttpContext } from '@adonisjs/core/http'
import Wine from '#models/wine'

export default class PublicWinesController {
  /**
   * Afficher les infos publiques d'un vin (sans auth)
   * GET /public/wines/:id
   */
  async show({ params, response }: HttpContext) {
    const wine = await Wine.query()
      .where('id', params.id)
      .preload('merchant', (mq) => {
        mq.preload('merchantProfile')
      })
      .firstOrFail()

    return response.ok({
      wine: {
        id: wine.id,
        name: wine.name,
        domain: wine.domain,
        vintage: wine.vintage,
        color: wine.color,
        region: wine.region,
        grapes: wine.grapes,
        alcoholDegree: wine.alcoholDegree,
        aromas: wine.aromas,
        foodPairings: wine.foodPairings,
        guardMin: wine.guardMin,
        guardMax: wine.guardMax,
        photoUrl: wine.photoUrl,
        notes: wine.notes,
        merchant: {
          shopName: wine.merchant.merchantProfile?.shopName || null,
        },
      },
    })
  }
}
