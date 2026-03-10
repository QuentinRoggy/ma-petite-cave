import vine from '@vinejs/vine'

export const updateClientWineValidator = vine.compile(
  vine.object({
    status: vine.enum(['in_cellar', 'opened', 'finished']).optional(),
    rating: vine.number().min(1).max(5).optional().nullable(),
    personalNotes: vine.string().optional().nullable(),
  })
)
