import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Notification from '#models/notification'
import NotificationPreference from '#models/notification_preference'
import vine from '@vinejs/vine'

export default class NotificationsController {
  /**
   * GET /notifications
   */
  async index({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { page = 1, limit = 20 } = request.qs()

    const notifications = await Notification.query()
      .where('userId', user.id)
      .orderBy('createdAt', 'desc')
      .paginate(page, limit)

    return response.ok({
      notifications: notifications.all().map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
      meta: notifications.getMeta(),
    })
  }

  /**
   * GET /notifications/unread/count
   */
  async unreadCount({ auth, response }: HttpContext) {
    const user = auth.user!

    const result = await Notification.query()
      .where('userId', user.id)
      .whereNull('readAt')
      .count('* as total')

    return response.ok({ count: Number(result[0].$extras.total) })
  }

  /**
   * POST /notifications/:id/read
   */
  async markRead({ auth, params, response }: HttpContext) {
    const user = auth.user!

    const notification = await Notification.query()
      .where('id', params.id)
      .where('userId', user.id)
      .firstOrFail()

    notification.readAt = DateTime.now()
    await notification.save()

    return response.ok({ notification: { id: notification.id, readAt: notification.readAt } })
  }

  /**
   * POST /notifications/read-all
   */
  async markAllRead({ auth, response }: HttpContext) {
    const user = auth.user!

    await Notification.query()
      .where('userId', user.id)
      .whereNull('readAt')
      .update({ readAt: DateTime.now().toSQL() })

    return response.ok({ message: 'Toutes les notifications marquées comme lues' })
  }

  /**
   * GET /notifications/preferences
   */
  async getPreferences({ auth, response }: HttpContext) {
    const user = auth.user!

    let prefs = await NotificationPreference.findBy('userId', user.id)
    if (!prefs) {
      prefs = await NotificationPreference.create({ userId: user.id })
    }

    return response.ok({
      preferences: {
        emailFeedback: prefs.emailFeedback,
        emailFeedbackFrequency: prefs.emailFeedbackFrequency,
        emailReorder: prefs.emailReorder,
        emailInviteAccepted: prefs.emailInviteAccepted,
        emailGuardReminder: prefs.emailGuardReminder,
      },
    })
  }

  /**
   * PATCH /notifications/preferences
   */
  async updatePreferences({ auth, request, response }: HttpContext) {
    const user = auth.user!

    const prefsValidator = vine.compile(
      vine.object({
        emailFeedback: vine.boolean().optional(),
        emailFeedbackFrequency: vine.enum(['instant', 'daily', 'weekly'] as const).optional(),
        emailReorder: vine.boolean().optional(),
        emailInviteAccepted: vine.boolean().optional(),
        emailGuardReminder: vine.boolean().optional(),
      })
    )

    const data = await request.validateUsing(prefsValidator)

    let prefs = await NotificationPreference.findBy('userId', user.id)
    if (!prefs) {
      prefs = await NotificationPreference.create({ userId: user.id })
    }

    prefs.merge(data)
    await prefs.save()

    return response.ok({
      preferences: {
        emailFeedback: prefs.emailFeedback,
        emailFeedbackFrequency: prefs.emailFeedbackFrequency,
        emailReorder: prefs.emailReorder,
        emailInviteAccepted: prefs.emailInviteAccepted,
        emailGuardReminder: prefs.emailGuardReminder,
      },
    })
  }
}
