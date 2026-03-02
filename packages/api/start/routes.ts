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
const UploadsController = () => import('#controllers/uploads_controller')

// Auth routes
router
  .group(() => {
    router.post('register', [AuthController, 'register'])
    router.post('login', [AuthController, 'login'])
    router.post('logout', [AuthController, 'logout']).use(middleware.auth())
  })
  .prefix('auth')

router.get('me', [AuthController, 'me']).use(middleware.auth())

// Wine routes
router
  .group(() => {
    router.get('wines', [WinesController, 'index'])
    router.post('wines', [WinesController, 'store'])
    router.get('wines/:id', [WinesController, 'show'])
    router.patch('wines/:id', [WinesController, 'update'])
    router.delete('wines/:id', [WinesController, 'destroy'])
    router.post('wines/:id/move-to-cave', [WinesController, 'moveToCave'])
  })
  .use(middleware.auth())

// Upload routes
router.post('uploads/wine-photo', [UploadsController, 'winePhoto']).use(middleware.auth())
