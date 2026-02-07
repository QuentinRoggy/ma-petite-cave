import vine from '@vinejs/vine'

export const createWineValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255),
    domain: vine.string().trim().maxLength(255).optional(),
    vintage: vine.number().min(1900).max(2100).optional(),
    color: vine.enum(['rouge', 'blanc', 'rosé', 'pétillant']).optional(),
    merchantNotes: vine.string().trim().optional(),
    personalNotes: vine.string().trim().optional(),
    rating: vine.number().min(0).max(5).optional(),
    photoUrl: vine.string().trim().url(),
  })
)

export const updateWineValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255).optional(),
    domain: vine.string().trim().maxLength(255).nullable().optional(),
    vintage: vine.number().min(1900).max(2100).nullable().optional(),
    color: vine.enum(['rouge', 'blanc', 'rosé', 'pétillant']).nullable().optional(),
    merchantNotes: vine.string().trim().nullable().optional(),
    personalNotes: vine.string().trim().nullable().optional(),
    rating: vine.number().min(0).max(5).nullable().optional(),
    photoUrl: vine.string().trim().url().optional(),
  })
)

export const indexWineValidator = vine.compile(
  vine.object({
    query: vine.string().trim().optional(),
    rated: vine.enum(['true', 'false']).optional(),
    color: vine.enum(['rouge', 'blanc', 'rosé', 'pétillant']).optional(),
  })
)
