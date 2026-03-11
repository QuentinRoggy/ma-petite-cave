import { Job } from '@rlanz/bull-queue'
import { DateTime } from 'luxon'
import Notification from '#models/notification'
import NotificationPreference from '#models/notification_preference'
import User from '#models/user'
import MailService from '#services/mail_service'

interface FeedbackDigestPayload {
  frequency: 'daily' | 'weekly'
}

export default class FeedbackDigestJob extends Job {
  static get $$filepath() {
    return import.meta.url
  }

  async rescue(_payload: FeedbackDigestPayload, error: Error) {
    console.error('FeedbackDigestJob failed after all retries:', error)
  }

  async handle(payload: FeedbackDigestPayload) {
    const since =
      payload.frequency === 'daily'
        ? DateTime.now().minus({ days: 1 })
        : DateTime.now().minus({ weeks: 1 })

    const feedbackNotifs = await Notification.query()
      .where('type', 'feedback')
      .where('createdAt', '>=', since.toSQL()!)
      .whereNull('emailDigestSentAt')
      .preload('user')

    const byMerchant = new Map<number, typeof feedbackNotifs>()
    for (const notif of feedbackNotifs) {
      const existing = byMerchant.get(notif.userId) || []
      existing.push(notif)
      byMerchant.set(notif.userId, existing)
    }

    const mailService = new MailService()

    for (const [merchantId, notifs] of byMerchant) {
      const prefs = await NotificationPreference.findBy('userId', merchantId)
      if (prefs && !prefs.emailFeedback) continue
      if (prefs && prefs.emailFeedbackFrequency !== payload.frequency) continue

      const merchant = await User.find(merchantId)
      if (!merchant) continue

      await merchant.load('merchantProfile')

      const feedbacks = notifs.map((n) => ({
        wineName: (n.data as Record<string, string>).wineName || n.title.split(' a noté ')[1] || 'Vin',
        clientName: n.title.split(' a noté ')[0] || 'Client',
        rating: (n.data as Record<string, number>).rating || 0,
        notes: n.body,
      }))

      try {
        await mailService.sendFeedbackDigest({
          to: merchant.email,
          merchantName: merchant.merchantProfile?.shopName || merchant.fullName || '',
          feedbacks,
        })

        const now = DateTime.now()
        for (const notif of notifs) {
          notif.emailDigestSentAt = now
          await notif.save()
        }
      } catch (error) {
        console.error(`Failed to send digest to merchant ${merchantId}:`, error)
      }
    }
  }
}
