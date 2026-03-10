import Notification from '#models/notification'

type NotificationType = 'feedback' | 'reorder' | 'invite_accepted' | 'guard_reminder'

export default class NotificationService {
  static async create(params: {
    userId: number
    type: NotificationType
    title: string
    body?: string
    data?: Record<string, unknown>
  }) {
    return Notification.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body || null,
      data: params.data || {},
    })
  }

  static async createFeedbackNotification(params: {
    merchantId: number
    clientName: string
    wineName: string
    rating: number
    clientWineId: number
  }) {
    return this.create({
      userId: params.merchantId,
      type: 'feedback',
      title: `${params.clientName} a noté ${params.wineName}`,
      body: `Note : ${'★'.repeat(params.rating)}${'☆'.repeat(5 - params.rating)}`,
      data: { clientWineId: params.clientWineId, rating: params.rating },
    })
  }

  static async createReorderNotification(params: {
    merchantId: number
    clientName: string
    wineName: string
    clientWineId: number
  }) {
    return this.create({
      userId: params.merchantId,
      type: 'reorder',
      title: `${params.clientName} veut re-commander`,
      body: `${params.wineName}`,
      data: { clientWineId: params.clientWineId },
    })
  }

  static async createInviteAcceptedNotification(params: {
    merchantId: number
    clientName: string
    subscriptionId: number
  }) {
    return this.create({
      userId: params.merchantId,
      type: 'invite_accepted',
      title: `${params.clientName} a rejoint Cuvee !`,
      body: 'Vous pouvez lui envoyer sa première box.',
      data: { subscriptionId: params.subscriptionId },
    })
  }
}
