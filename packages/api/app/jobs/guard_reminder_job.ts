import { Job } from '@rlanz/bull-queue'
import { DateTime } from 'luxon'
import ClientWine from '#models/client_wine'
import NotificationPreference from '#models/notification_preference'
import MailService from '#services/mail_service'
import NotificationService from '#services/notification_service'

export default class GuardReminderJob extends Job {
  static get $$filepath() {
    return import.meta.url
  }

  async rescue(_payload: Record<string, never>, error: Error) {
    console.error('GuardReminderJob failed after all retries:', error)
  }

  async handle() {
    const currentYear = new Date().getFullYear()

    // Trouver les vins en cave dont la garde min est atteinte
    const readyWines = await ClientWine.query()
      .where('status', 'in_cellar')
      .whereNull('guardReminderSentAt')
      .whereHas('boxWine', (bwQuery) => {
        bwQuery.whereHas('wine', (wineQuery) => {
          wineQuery
            .whereNotNull('vintage')
            .whereNotNull('guard_min')
            .whereRaw('vintage + guard_min <= ?', [currentYear])
        })
      })
      .preload('client')
      .preload('boxWine', (bwQuery) => bwQuery.preload('wine'))

    // Grouper par client
    const byClient = new Map<number, typeof readyWines>()
    for (const cw of readyWines) {
      const existing = byClient.get(cw.clientId) || []
      existing.push(cw)
      byClient.set(cw.clientId, existing)
    }

    const mailService = new MailService()

    for (const [clientId, clientWines] of byClient) {
      const client = clientWines[0].client

      // Vérifier les préférences
      const prefs = await NotificationPreference.findBy('userId', clientId)
      if (prefs && !prefs.emailGuardReminder) continue

      const wines = clientWines.map((cw) => ({
        name: cw.boxWine.wine.name,
        domain: cw.boxWine.wine.domain,
        vintage: cw.boxWine.wine.vintage,
        guardMin: cw.boxWine.wine.guardMin,
        guardMax: cw.boxWine.wine.guardMax,
        wineId: cw.id,
      }))

      // Créer les notifications in-app
      for (const wine of wines) {
        await NotificationService.create({
          userId: clientId,
          type: 'guard_reminder',
          title: `${wine.name} est prêt à déguster !`,
          body: wine.domain ? `${wine.domain} - Millésime ${wine.vintage}` : undefined,
          data: { clientWineId: wine.wineId },
        })
      }

      // Envoyer l'email groupé
      try {
        await mailService.sendGuardReminder({
          to: client.email,
          clientName: client.fullName || 'Client',
          wines,
        })
      } catch (error) {
        console.error(`Failed to send guard reminder to client ${clientId}:`, error)
      }

      // Marquer comme notifié
      for (const cw of clientWines) {
        cw.guardReminderSentAt = DateTime.now()
        await cw.save()
      }
    }
  }
}
