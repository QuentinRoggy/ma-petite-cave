import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Box from '#models/box'
import { createAdminUserValidator, updateAdminUserValidator } from '#validators/admin/user'

export default class UsersController {
  /**
   * List all users with filters
   * GET /admin/users?role=merchant&search=dupont&page=1
   */
  async index({ request, response }: HttpContext) {
    const { role, search, page = 1, limit = 20 } = request.qs()

    const query = User.query()
      .preload('merchantProfile')
      .orderBy('createdAt', 'desc')

    if (role) {
      query.where('role', role)
    }

    if (search) {
      query.where((q) => {
        q.whereILike('email', `%${search}%`).orWhereILike('fullName', `%${search}%`)
      })
    }

    const users = await query.paginate(page, limit)

    return response.ok({
      users: users.all().map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        shopName: u.merchantProfile?.shopName,
        createdAt: u.createdAt,
      })),
      meta: users.getMeta(),
    })
  }

  /**
   * Create a new user
   * POST /admin/users
   */
  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createAdminUserValidator)

    // Password is auto-hashed by withAuthFinder mixin
    const user = await User.create({
      email: data.email,
      password: data.password,
      role: data.role,
      fullName: data.fullName,
    })

    // If merchant, create the profile
    if (data.role === 'merchant' && data.shopName) {
      await user.related('merchantProfile').create({
        shopName: data.shopName,
        address: data.address,
        phone: data.phone,
      })
    }

    await user.load('merchantProfile')

    return response.created({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        shopName: user.merchantProfile?.shopName,
        createdAt: user.createdAt,
      },
    })
  }

  /**
   * Get user details
   * GET /admin/users/:id
   */
  async show({ params, response }: HttpContext) {
    const user = await User.query()
      .where('id', params.id)
      .preload('merchantProfile')
      .firstOrFail()

    // Load stats based on role
    let stats: Record<string, number> = {}

    if (user.role === 'merchant') {
      const subscriptions = await user.related('merchantSubscriptions').query()
      const wines = await user.related('wines').query().count('* as total')
      const boxes = await Box.query()
        .whereHas('subscription', (q) => q.where('merchantId', user.id))
        .where('status', 'sent')
        .count('* as total')

      stats = {
        clientsCount: subscriptions.length,
        winesCount: Number(wines[0].$extras.total),
        boxesSentCount: Number(boxes[0].$extras.total),
      }
    }

    if (user.role === 'client') {
      const subscriptions = await user.related('clientSubscriptions').query()
      const clientWines = await user.related('clientWines').query()
      const ratedWines = clientWines.filter((cw) => cw.rating !== null)

      stats = {
        merchantsCount: subscriptions.length,
        winesCount: clientWines.length,
        ratedCount: ratedWines.length,
      }
    }

    // Load subscriptions
    let subscriptions: Array<{
      id: number
      status: string
      createdAt: Date
      otherUser: { id: number; email: string; fullName: string | null; shopName?: string | null }
    }> = []

    if (user.role === 'merchant') {
      const subs = await user
        .related('merchantSubscriptions')
        .query()
        .preload('subscriber')
        .orderBy('createdAt', 'desc')

      subscriptions = subs.map((s) => ({
        id: s.id,
        status: s.status,
        createdAt: s.createdAt.toJSDate(),
        otherUser: {
          id: s.subscriber.id,
          email: s.subscriber.email,
          fullName: s.subscriber.fullName,
        },
      }))
    }

    if (user.role === 'client') {
      const subs = await user
        .related('clientSubscriptions')
        .query()
        .preload('merchant', (q) => q.preload('merchantProfile'))
        .orderBy('createdAt', 'desc')

      subscriptions = subs.map((s) => ({
        id: s.id,
        status: s.status,
        createdAt: s.createdAt.toJSDate(),
        otherUser: {
          id: s.merchant.id,
          email: s.merchant.email,
          fullName: s.merchant.fullName,
          shopName: s.merchant.merchantProfile?.shopName,
        },
      }))
    }

    return response.ok({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        shopName: user.merchantProfile?.shopName,
        address: user.merchantProfile?.address,
        phone: user.merchantProfile?.phone,
        createdAt: user.createdAt,
      },
      stats,
      subscriptions,
    })
  }

  /**
   * Update a user
   * PATCH /admin/users/:id
   */
  async update({ params, request, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const data = await request.validateUsing(updateAdminUserValidator)

    if (data.email) user.email = data.email
    if (data.fullName !== undefined) user.fullName = data.fullName
    if (data.role) user.role = data.role
    // Password is auto-hashed by withAuthFinder mixin on save
    if (data.password) user.password = data.password

    await user.save()

    // Update merchant profile if needed
    if (user.role === 'merchant') {
      await user.load('merchantProfile')
      if (user.merchantProfile) {
        if (data.shopName) user.merchantProfile.shopName = data.shopName
        if (data.address !== undefined) user.merchantProfile.address = data.address
        if (data.phone !== undefined) user.merchantProfile.phone = data.phone
        await user.merchantProfile.save()
      } else if (data.shopName) {
        await user.related('merchantProfile').create({
          shopName: data.shopName,
          address: data.address ?? null,
          phone: data.phone ?? null,
        })
      }
    }

    return response.ok({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    })
  }

  /**
   * Delete a user
   * DELETE /admin/users/:id
   */
  async destroy({ params, auth, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const currentUser = auth.user!

    // Prevent self-deletion
    if (user.id === currentUser.id) {
      return response.badRequest({ error: 'Cannot delete yourself' })
    }

    // Prevent deletion of the last admin
    if (user.role === 'admin') {
      const adminCount = await User.query().where('role', 'admin').count('* as total')
      if (Number(adminCount[0].$extras.total) <= 1) {
        return response.badRequest({ error: 'Cannot delete the last admin' })
      }
    }

    await user.delete()

    return response.ok({ message: 'User deleted' })
  }

  /**
   * Impersonate a user
   * POST /admin/users/:id/impersonate
   */
  async impersonate({ params, auth, response }: HttpContext) {
    const admin = auth.user!
    const targetUser = await User.findOrFail(params.id)

    // Prevent impersonating another admin
    if (targetUser.role === 'admin') {
      return response.forbidden({ error: 'Cannot impersonate another admin' })
    }

    // Create a token for the target user
    const token = await User.accessTokens.create(targetUser)

    // Log the action
    console.log(
      `[IMPERSONATE] Admin ${admin.id} (${admin.email}) impersonating user ${targetUser.id} (${targetUser.email})`
    )

    return response.ok({
      token: token.value!.release(),
      user: {
        id: targetUser.id,
        email: targetUser.email,
        fullName: targetUser.fullName,
        role: targetUser.role,
      },
      impersonatedBy: {
        id: admin.id,
        email: admin.email,
      },
    })
  }
}
