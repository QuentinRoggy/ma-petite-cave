import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Role Guard Middleware
 *
 * Restricts access to routes based on user role.
 * Must be used after auth middleware.
 */
export default class RoleGuardMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: { roles: ('client' | 'merchant' | 'admin')[] }
  ) {
    const user = ctx.auth.user!

    if (!options.roles.includes(user.role)) {
      return ctx.response.forbidden({
        message: "Vous n'avez pas accès à cette ressource",
        error: 'FORBIDDEN_ROLE',
      })
    }

    return next()
  }
}
