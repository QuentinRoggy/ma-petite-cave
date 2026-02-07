import type { HttpContext } from '@adonisjs/core/http'
import StorageService from '#services/storage_service'

export default class UploadsController {
  async winePhoto({ request, response }: HttpContext) {
    const photo = request.file('photo', {
      size: '10mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
    })

    if (!photo) {
      return response.badRequest({ error: 'Photo is required' })
    }

    if (!photo.isValid) {
      return response.badRequest({ errors: photo.errors })
    }

    const storage = new StorageService()
    const photoUrl = await storage.uploadWinePhoto({
      tmpPath: photo.tmpPath!,
      extname: photo.extname!,
    })

    return { photoUrl }
  }
}
