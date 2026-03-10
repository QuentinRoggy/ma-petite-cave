import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: 'smtp',

  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST'),
      port: env.get('SMTP_PORT'),
      auth: env.get('SMTP_USERNAME')
        ? {
            type: 'login',
            user: env.get('SMTP_USERNAME')!,
            pass: env.get('SMTP_PASSWORD')!,
          }
        : undefined,
      tls: {},
    }),
  },

  from: {
    address: env.get('MAIL_FROM'),
    name: 'Cuvee',
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
