import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import { emailLayout, invitationEmail, feedbackDigestEmail, guardReminderEmail, reorderRequestEmail, inviteAcceptedEmail } from './email_templates.js'

export default class MailService {
  private from = env.get('MAIL_FROM')
  private appUrl = env.get('APP_URL')

  async sendInvitation(params: {
    to: string
    firstName: string
    shopName: string
    inviteToken: string
  }) {
    const inviteUrl = `${this.appUrl}/invite/${params.inviteToken}`
    const html = emailLayout(
      invitationEmail({
        firstName: params.firstName,
        shopName: params.shopName,
        inviteUrl,
      })
    )

    await mail.send((message) => {
      message
        .from(this.from, 'Cuvee')
        .to(params.to)
        .subject(`${params.shopName} vous invite à rejoindre Cuvee`)
        .html(html)
    })
  }

  async sendFeedbackDigest(params: {
    to: string
    merchantName: string
    feedbacks: Array<{
      wineName: string
      clientName: string
      rating: number
      notes: string | null
    }>
  }) {
    const html = emailLayout(
      feedbackDigestEmail({
        merchantName: params.merchantName,
        feedbacks: params.feedbacks,
        feedbackUrl: `${this.appUrl}/feedback`,
      })
    )

    await mail.send((message) => {
      message
        .from(this.from, 'Cuvee')
        .to(params.to)
        .subject(`${params.feedbacks.length} nouvel${params.feedbacks.length > 1 ? 's' : ''} avis sur vos vins`)
        .html(html)
    })
  }

  async sendGuardReminder(params: {
    to: string
    clientName: string
    wines: Array<{
      name: string
      domain: string | null
      vintage: number | null
      guardMin: number | null
      guardMax: number | null
      wineId: number
    }>
  }) {
    const html = emailLayout(
      guardReminderEmail({
        clientName: params.clientName,
        wines: params.wines,
        caveUrl: `${this.appUrl}/cave`,
      })
    )

    await mail.send((message) => {
      message
        .from(this.from, 'Cuvee')
        .to(params.to)
        .subject(
          params.wines.length === 1
            ? `Un vin est prêt à déguster !`
            : `${params.wines.length} vins sont prêts à déguster !`
        )
        .html(html)
    })
  }

  async sendReorderRequest(params: {
    to: string
    clientName: string
    wineName: string
  }) {
    const html = emailLayout(
      reorderRequestEmail({
        clientName: params.clientName,
        wineName: params.wineName,
        reordersUrl: `${this.appUrl}/reorders`,
      })
    )

    await mail.send((message) => {
      message
        .from(this.from, 'Cuvee')
        .to(params.to)
        .subject(`${params.clientName} souhaite re-commander un vin`)
        .html(html)
    })
  }

  async sendInviteAccepted(params: {
    to: string
    clientName: string
  }) {
    const html = emailLayout(
      inviteAcceptedEmail({
        clientName: params.clientName,
        clientsUrl: `${this.appUrl}/clients`,
      })
    )

    await mail.send((message) => {
      message
        .from(this.from, 'Cuvee')
        .to(params.to)
        .subject(`${params.clientName} a rejoint Cuvee !`)
        .html(html)
    })
  }
}
