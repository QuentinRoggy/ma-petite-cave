import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Wine from '#models/wine'
import Box from '#models/box'
import ClientWine from '#models/client_wine'

export default class StatsController {
  /**
   * Get platform statistics
   * GET /admin/stats
   */
  async index({ response }: HttpContext) {
    const [usersCount, merchantsCount, clientsCount, winesCount, boxesCount, ratingsCount] =
      await Promise.all([
        User.query().count('* as total'),
        User.query().where('role', 'merchant').count('* as total'),
        User.query().where('role', 'client').count('* as total'),
        Wine.query().count('* as total'),
        Box.query().where('status', 'sent').count('* as total'),
        ClientWine.query().whereNotNull('rating').count('* as total'),
      ])

    // Recent users
    const recentUsers = await User.query()
      .orderBy('createdAt', 'desc')
      .limit(5)
      .select('id', 'email', 'fullName', 'role', 'createdAt')

    // Recent boxes
    const recentBoxes = await Box.query()
      .where('status', 'sent')
      .orderBy('sentAt', 'desc')
      .limit(5)
      .preload('subscription', (q) => {
        q.preload('merchant', (mq) => mq.preload('merchantProfile'))
        q.preload('subscriber')
      })

    const adminsCount = await User.query().where('role', 'admin').count('* as total')

    return response.ok({
      stats: {
        totalUsers: Number(usersCount[0].$extras.total),
        adminCount: Number(adminsCount[0].$extras.total),
        merchantCount: Number(merchantsCount[0].$extras.total),
        clientCount: Number(clientsCount[0].$extras.total),
        totalWines: Number(winesCount[0].$extras.total),
        totalBoxesSent: Number(boxesCount[0].$extras.total),
        totalRatings: Number(ratingsCount[0].$extras.total),
      },
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        createdAt: u.createdAt,
      })),
      recentBoxes: recentBoxes.map((b) => ({
        id: b.id,
        month: b.month,
        sentAt: b.sentAt,
        merchant: b.subscription?.merchant?.merchantProfile?.shopName || 'N/A',
        client: b.subscription?.subscriber?.fullName || b.subscription?.subscriber?.email || 'N/A',
      })),
    })
  }
}
