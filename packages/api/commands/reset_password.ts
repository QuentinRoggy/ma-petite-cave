import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import User from '#models/user'

export default class ResetPassword extends BaseCommand {
  static commandName = 'reset:password'
  static description = 'Reset password for a user'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Email address of the user' })
  declare email: string

  @flags.string({ description: 'New password' })
  declare password: string

  async run() {
    const user = await User.findBy('email', this.email)

    if (!user) {
      this.logger.error(`User ${this.email} not found`)
      return
    }

    let password = this.password
    if (!password) {
      password = await this.prompt.secure('Enter new password (min 6 characters)')
      if (password.length < 6) {
        this.logger.error('Password must be at least 6 characters')
        return
      }
    }

    // Password is auto-hashed by withAuthFinder mixin on save
    user.password = password
    await user.save()

    this.logger.success(`Password updated for ${user.email}`)
  }
}
