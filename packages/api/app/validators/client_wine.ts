import vine from '@vinejs/vine'

export const updateClientWineValidator = vine.compile(
  vine.object({
    status: vine.enum(['in_cellar', 'opened', 'finished']).optional(),
    rating: vine.number().min(1).max(5).optional().nullable(),
    personalNotes: vine.string().optional().nullable(),
  })
)

export const createPersonalWineValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255),
    domain: vine.string().trim().maxLength(255).optional(),
    vintage: vine.number().min(1900).max(2100).optional(),
    color: vine.enum(['rouge', 'blanc', 'rosé', 'pétillant']).optional(),
    region: vine.string().trim().maxLength(255).optional(),
    grapes: vine.string().trim().maxLength(255).optional(),
    alcoholDegree: vine.number().min(0).max(20).optional(),
    aromas: vine.array(vine.string()).optional(),
    foodPairings: vine.array(vine.string()).optional(),
    guardMin: vine.number().min(0).max(50).optional(),
    guardMax: vine.number().min(0).max(50).optional(),
    photoUrl: vine.string().trim().url().optional(),
    notes: vine.string().trim().optional(),
    status: vine.enum(['in_cellar', 'opened', 'finished']).optional(),
    rating: vine.number().min(1).max(5).optional(),
    personalNotes: vine.string().optional(),
  })
)

export const updatePersonalWineValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(1).maxLength(255).optional(),
    domain: vine.string().trim().maxLength(255).nullable().optional(),
    vintage: vine.number().min(1900).max(2100).nullable().optional(),
    color: vine.enum(['rouge', 'blanc', 'rosé', 'pétillant']).nullable().optional(),
    region: vine.string().trim().maxLength(255).nullable().optional(),
    grapes: vine.string().trim().maxLength(255).nullable().optional(),
    alcoholDegree: vine.number().min(0).max(20).nullable().optional(),
    aromas: vine.array(vine.string()).nullable().optional(),
    foodPairings: vine.array(vine.string()).nullable().optional(),
    guardMin: vine.number().min(0).max(50).nullable().optional(),
    guardMax: vine.number().min(0).max(50).nullable().optional(),
    photoUrl: vine.string().trim().url().nullable().optional(),
    notes: vine.string().trim().nullable().optional(),
    status: vine.enum(['in_cellar', 'opened', 'finished']).optional(),
    rating: vine.number().min(1).max(5).optional().nullable(),
    personalNotes: vine.string().optional().nullable(),
  })
)
