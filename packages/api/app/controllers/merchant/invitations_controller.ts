import type { HttpContext } from '@adonisjs/core/http'
import { randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import User from '#models/user'
import Subscription from '#models/subscription'
import MailService from '#services/mail_service'
import vine from '@vinejs/vine'

const inviteValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    firstName: vine.string().maxLength(100),
    notes: vine.string().maxLength(500).optional(),
  })
)

export default class InvitationsController {
  /**
   * Inviter un client par email
   * POST /merchant/clients/invite
   */
  async store({ auth, request, response }: HttpContext) {
    const merchant = auth.user!
    const data = await request.validateUsing(inviteValidator)

    await merchant.load('merchantProfile')
    const shopName = merchant.merchantProfile?.shopName || 'Votre caviste'

    const existingUser = await User.findBy('email', data.email)

    if (existingUser) {
      if (existingUser.role !== 'client') {
        return response.badRequest({
          message: 'Cet email est associé à un compte caviste',
        })
      }

      const existingSub = await Subscription.query()
        .where('clientId', existingUser.id)
        .where('merchantId', merchant.id)
        .first()

      if (existingSub) {
        if (existingSub.status === 'pending_invite') {
          return response.badRequest({ message: 'Une invitation a déjà été envoyée à cet email' })
        }
        return response.badRequest({ message: 'Ce client est déjà dans votre liste' })
      }
    }

    const inviteToken = randomBytes(32).toString('hex')

    const subscription = await Subscription.create({
      clientId: existingUser?.id || 0,
      merchantId: merchant.id,
      status: 'pending_invite',
      inviteToken,
      inviteSentAt: DateTime.now(),
      notes: data.notes || null,
    })

    if (existingUser) {
      subscription.clientId = existingUser.id
      await subscription.save()
    }

    const mailService = new MailService()
    await mailService.sendInvitation({
      to: data.email,
      firstName: data.firstName,
      shopName,
      inviteToken,
    })

    return response.created({
      message: 'Invitation envoyée',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        email: data.email,
      },
    })
  }

  /**
   * Vérifier un token d'invitation
   * GET /auth/invite/:token
   */
  async verify({ params, response }: HttpContext) {
    const subscription = await Subscription.query()
      .where('inviteToken', params.token)
      .where('status', 'pending_invite')
      .preload('merchant', (mq) => {
        mq.preload('merchantProfile')
      })
      .first()

    if (!subscription) {
      return response.notFound({ message: 'Invitation invalide ou expirée' })
    }

    return response.ok({
      invitation: {
        id: subscription.id,
        shopName: subscription.merchant.merchantProfile?.shopName || 'Votre caviste',
        merchantName: subscription.merchant.fullName,
      },
    })
  }

  /**
   * Accepter une invitation
   * POST /auth/invite/:token/accept
   */
  async accept({ params, request, response }: HttpContext) {
    const acceptValidator = vine.compile(
      vine.object({
        email: vine.string().email().normalizeEmail(),
        password: vine.string().minLength(8),
        fullName: vine.string().maxLength(100),
      })
    )

    const data = await request.validateUsing(acceptValidator)

    const subscription = await Subscription.query()
      .where('inviteToken', params.token)
      .where('status', 'pending_invite')
      .preload('merchant', (mq) => {
        mq.preload('merchantProfile')
      })
      .first()

    if (!subscription) {
      return response.notFound({ message: 'Invitation invalide ou expirée' })
    }

    let client = await User.findBy('email', data.email)

    if (!client) {
      client = await User.create({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: 'client',
      })
    }

    subscription.clientId = client.id
    subscription.status = 'active'
    subscription.inviteToken = null
    subscription.activatedAt = DateTime.now()
    await subscription.save()

    const token = await User.accessTokens.create(client)

    const shopName = subscription.merchant.merchantProfile?.shopName || 'Votre caviste'

    // Notifier le caviste
    const { default: NotificationService } = await import('#services/notification_service')
    await NotificationService.createInviteAcceptedNotification({
      merchantId: subscription.merchantId,
      clientName: data.fullName,
      subscriptionId: subscription.id,
    })

    // Envoyer email au caviste
    try {
      const mailService = new MailService()
      await mailService.sendInviteAccepted({
        to: subscription.merchant.email,
        clientName: data.fullName,
      })
    } catch {
      // Ne pas bloquer si l'email échoue
    }

    return response.ok({
      message: `Bienvenue chez ${shopName} !`,
      token: token.value!.release(),
      user: {
        id: client.id,
        email: client.email,
        fullName: client.fullName,
        role: client.role,
      },
    })
  }
}
