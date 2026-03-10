import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import User from '#models/user'

export default class CreateAdmin extends BaseCommand {
  static commandName = 'create:admin'
  static description = 'Create an admin user for the platform'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Email address for the admin' })
  declare email: string

  @flags.string({ description: 'Password for the admin (prompted if not provided)' })
  declare password: string

  @flags.string({ description: 'Full name of the admin' })
  declare name: string

  async run() {
    // Check if user already exists
    const existing = await User.findBy('email', this.email)
    if (existing) {
      if (existing.role === 'admin') {
        this.logger.error(`User ${this.email} is already an admin`)
        return
      }

      // Offer to upgrade existing user to admin
      const upgrade = await this.prompt.confirm(
        `User ${this.email} exists with role "${existing.role}". Upgrade to admin?`
      )

      if (upgrade) {
        existing.role = 'admin'
        await existing.save()
        this.logger.success(`User ${this.email} upgraded to admin`)
        return
      }

      this.logger.info('Operation cancelled')
      return
    }

    // Get password if not provided
    let password = this.password
    if (!password) {
      password = await this.prompt.secure('Enter password (min 6 characters)')
      if (password.length < 6) {
        this.logger.error('Password must be at least 6 characters')
        return
      }
    }

    // Get name if not provided
    let fullName = this.name
    if (!fullName) {
      fullName = await this.prompt.ask('Enter full name (optional)', { default: '' })
    }

    // Create admin user (password is auto-hashed by withAuthFinder mixin)
    const admin = await User.create({
      email: this.email,
      password: password,
      role: 'admin' as const,
      fullName: fullName || null,
    })

    this.logger.success(`Admin user created successfully!`)
    this.logger.info(`Email: ${admin.email}`)
    this.logger.info(`Role: ${admin.role}`)
    if (admin.fullName) {
      this.logger.info(`Name: ${admin.fullName}`)
    }
  }
}