/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('#controllers/auth_controller')
const WinesController = () => import('#controllers/wines_controller')
const ClientsController = () => import('#controllers/merchant/clients_controller')
const BoxesController = () => import('#controllers/merchant/boxes_controller')
const FeedbackController = () => import('#controllers/merchant/feedback_controller')
const ReordersController = () => import('#controllers/merchant/reorders_controller')
const MerchantStatsController = () => import('#controllers/merchant/stats_controller')
const ClientBoxesController = () => import('#controllers/client/boxes_controller')
const ClientWinesController = () => import('#controllers/client/wines_controller')
const ClientPreferencesController = () => import('#controllers/client/preferences_controller')
const PublicWinesController = () => import('#controllers/public_wines_controller')
const UploadsController = () => import('#controllers/uploads_controller')

const InvitationsController = () => import('#controllers/merchant/invitations_controller')
const NotificationsController = () => import('#controllers/notifications_controller')

// Admin controllers
const AdminStatsController = () => import('#controllers/admin/stats_controller')
const AdminUsersController = () => import('#controllers/admin/users_controller')
const AdminSubscriptionsController = () => import('#controllers/admin/subscriptions_controller')
const AdminDemoController = () => import('#controllers/admin/demo_controller')

// Auth routes
router
  .group(() => {
    router.post('register', [AuthController, 'register'])
    router.post('login', [AuthController, 'login'])
    router.post('logout', [AuthController, 'logout']).use(middleware.auth())
  })
  .prefix('auth')

router.get('me', [AuthController, 'me']).use(middleware.auth())

// Invitation routes (public - no auth)
router.get('auth/invite/:token', [InvitationsController, 'verify'])
router.post('auth/invite/:token/accept', [InvitationsController, 'accept'])

// Merchant routes (requires merchant role)
router
  .group(() => {
    // Clients management
    router.get('clients/stats', [ClientsController, 'stats'])
    router.get('clients', [ClientsController, 'index'])
    router.post('clients', [ClientsController, 'store'])
    router.post('clients/invite', [InvitationsController, 'store'])
    router.get('clients/:id', [ClientsController, 'show'])
    router.patch('clients/:id', [ClientsController, 'update'])

    // Wines catalog
    router.get('wines/stats', [WinesController, 'stats'])
    router.get('wines', [WinesController, 'index'])
    router.post('wines', [WinesController, 'store'])
    router.get('wines/:id', [WinesController, 'show'])
    router.patch('wines/:id', [WinesController, 'update'])
    router.delete('wines/:id', [WinesController, 'destroy'])

    // Boxes management
    router.get('boxes', [BoxesController, 'index'])
    router.post('boxes', [BoxesController, 'store'])
    router.get('boxes/:id', [BoxesController, 'show'])
    router.patch('boxes/:id', [BoxesController, 'update'])
    router.post('boxes/:id/send', [BoxesController, 'send'])
    router.delete('boxes/:id', [BoxesController, 'destroy'])

    // Feedback
    router.get('feedback', [FeedbackController, 'index'])
    router.get('feedback/stats', [FeedbackController, 'stats'])
    router.get('feedback/recent', [FeedbackController, 'recent'])

    // Reorders
    router.get('reorders', [ReordersController, 'index'])
    router.get('reorders/count', [ReordersController, 'count'])

    // Stats
    router.get('stats/overview', [MerchantStatsController, 'overview'])
    router.get('stats/top-wines', [MerchantStatsController, 'topWines'])
    router.get('stats/top-clients', [MerchantStatsController, 'topClients'])
    router.get('stats/monthly', [MerchantStatsController, 'monthly'])
  })
  .prefix('merchant')
  .use([middleware.auth(), middleware.role({ roles: ['merchant'] })])

// Client routes (requires client role)
router
  .group(() => {
    // Boxes
    router.get('boxes', [ClientBoxesController, 'index'])
    router.get('boxes/:id', [ClientBoxesController, 'show'])

    // Wines (cave)
    router.get('wines', [ClientWinesController, 'index'])
    router.get('wines/:id', [ClientWinesController, 'show'])
    router.patch('wines/:id', [ClientWinesController, 'update'])
    router.post('wines/:id/reorder', [ClientWinesController, 'reorder'])

    // Preferences
    router.get('preferences', [ClientPreferencesController, 'show'])
    router.patch('preferences', [ClientPreferencesController, 'update'])
  })
  .prefix('client')
  .use([middleware.auth(), middleware.role({ roles: ['client'] })])

// Upload routes (any authenticated user)
router.post('uploads/wine-photo', [UploadsController, 'winePhoto']).use(middleware.auth())

// Notifications routes (any authenticated user)
router
  .group(() => {
    router.get('/', [NotificationsController, 'index'])
    router.get('unread/count', [NotificationsController, 'unreadCount'])
    router.post(':id/read', [NotificationsController, 'markRead'])
    router.post('read-all', [NotificationsController, 'markAllRead'])
    router.get('preferences', [NotificationsController, 'getPreferences'])
    router.patch('preferences', [NotificationsController, 'updatePreferences'])
  })
  .prefix('notifications')
  .use(middleware.auth())

// Admin routes (requires admin role)
router
  .group(() => {
    // Stats
    router.get('stats', [AdminStatsController, 'index'])

    // Users management
    router.get('users', [AdminUsersController, 'index'])
    router.post('users', [AdminUsersController, 'store'])
    router.get('users/:id', [AdminUsersController, 'show'])
    router.patch('users/:id', [AdminUsersController, 'update'])
    router.delete('users/:id', [AdminUsersController, 'destroy'])
    router.post('users/:id/impersonate', [AdminUsersController, 'impersonate'])

    // Subscriptions management
    router.get('subscriptions', [AdminSubscriptionsController, 'index'])
    router.post('subscriptions', [AdminSubscriptionsController, 'store'])
    router.delete('subscriptions/:id', [AdminSubscriptionsController, 'destroy'])

    // Demo tools
    router.post('demo/setup', [AdminDemoController, 'setup'])
    router.post('demo/reset', [AdminDemoController, 'reset'])
  })
  .prefix('admin')
  .use([middleware.auth(), middleware.admin()])

// Public routes (no auth)
router.get('public/wines/:id', [PublicWinesController, 'show'])

// Health check
router.get('health', async ({ response }) => {
  return response.ok({ status: 'ok', timestamp: new Date().toISOString() })
})
