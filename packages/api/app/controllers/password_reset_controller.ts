import { randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import vine from '@vinejs/vine'
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import MailService from '#services/mail_service'

const forgotPasswordValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
  })
)

const resetPasswordValidator = vine.compile(
  vine.object({
    token: vine.string(),
    password: vine.string().minLength(8),
  })
)

export default class PasswordResetController {
  async requestReset({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)

    const user = await User.findBy('email', email)

    if (user) {
      const token = randomBytes(32).toString('hex')
      user.passwordResetToken = token
      user.passwordResetExpiresAt = DateTime.now().plus({ hours: 1 })
      await user.save()

      const mailService = new MailService()
      await mailService.sendPasswordReset({ to: user.email, resetToken: token })
    }

    return response.ok({
      message: 'Si cet email est associé à un compte, vous recevrez un lien de réinitialisation.',
    })
  }

  async resetPassword({ request, response }: HttpContext) {
    const { token, password } = await request.validateUsing(resetPasswordValidator)

    const user = await User.query()
      .where('password_reset_token', token)
      .where('password_reset_expires_at', '>', DateTime.now().toSQL())
      .first()

    if (!user) {
      return response.badRequest({ message: 'Ce lien est invalide ou a expiré.' })
    }

    user.password = password
    user.passwordResetToken = null
    user.passwordResetExpiresAt = null
    await user.save()

    return response.ok({ message: 'Mot de passe mis à jour avec succès.' })
  }
}
