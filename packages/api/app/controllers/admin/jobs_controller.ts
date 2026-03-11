import type { HttpContext } from '@adonisjs/core/http'
import queue from '@rlanz/bull-queue/services/main'

const ALLOWED_JOBS = ['feedback-digest', 'guard-reminder'] as const
type JobType = (typeof ALLOWED_JOBS)[number]

export default class JobsController {
  async dispatch({ params, request, response }: HttpContext) {
    const jobType = params.jobType as string

    if (!ALLOWED_JOBS.includes(jobType as JobType)) {
      return response.badRequest({
        message: `Job inconnu : ${jobType}. Jobs disponibles : ${ALLOWED_JOBS.join(', ')}`,
      })
    }

    switch (jobType) {
      case 'feedback-digest': {
        const frequency = (request.qs().frequency as string) || 'daily'
        if (!['daily', 'weekly'].includes(frequency)) {
          return response.badRequest({ message: 'frequency doit être "daily" ou "weekly"' })
        }
        const { default: FeedbackDigestJob } = await import('#jobs/feedback_digest_job')
        await queue.dispatch(FeedbackDigestJob, { frequency })
        return response.ok({ message: `Job feedback-digest (${frequency}) dispatché avec succès` })
      }

      case 'guard-reminder': {
        const { default: GuardReminderJob } = await import('#jobs/guard_reminder_job')
        await queue.dispatch(GuardReminderJob, {})
        return response.ok({ message: 'Job guard-reminder dispatché avec succès' })
      }
    }
  }
}
