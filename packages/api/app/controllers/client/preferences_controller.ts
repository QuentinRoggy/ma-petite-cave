import type { HttpContext } from '@adonisjs/core/http'
import { preferencesValidator } from '#validators/preferences'

export default class PreferencesController {
  /**
   * Récupérer les préférences du client
   * GET /client/preferences
   */
  async show({ auth, response }: HttpContext) {
    const user = auth.user!

    return response.ok({
      preferences: user.preferences || {},
    })
  }

  /**
   * Mettre à jour les préférences du client
   * PATCH /client/preferences
   */
  async update({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const data = await request.validateUsing(preferencesValidator)

    user.preferences = {
      ...user.preferences,
      ...data,
    }
    await user.save()

    return response.ok({
      preferences: user.preferences,
    })
  }
}
