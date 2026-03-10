import vine from '@vinejs/vine'

export const preferencesValidator = vine.compile(
  vine.object({
    colors: vine
      .array(vine.enum(['rouge', 'blanc', 'rosé', 'pétillant']))
      .optional(),
    budgetMin: vine.number().min(0).max(1000).optional(),
    budgetMax: vine.number().min(0).max(1000).optional(),
    regions: vine.array(vine.string().maxLength(100)).optional(),
    aromas: vine.array(vine.string().maxLength(100)).optional(),
    restrictions: vine.array(vine.string().maxLength(100)).optional(),
  })
)
