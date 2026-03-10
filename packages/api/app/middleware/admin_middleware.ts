import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Admin middleware to restrict access to admin-only routes
 */
export default class AdminMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    const user = auth.user

    if (!user || user.role !== 'admin') {
      return response.forbidden({ error: 'Admin access required' })
    }

    await next()
  }
}
