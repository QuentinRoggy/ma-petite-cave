import vine from '@vinejs/vine'

export const createBoxValidator = vine.compile(
  vine.object({
    subscriptionId: vine.any(),
    month: vine.string().regex(/^\d{4}-\d{2}$/),
    wines: vine
      .array(
        vine.object({
          wineId: vine.any(),
          merchantNotes: vine.string().optional().nullable(),
          position: vine.number().min(1).max(10).optional(),
        })
      )
      .minLength(1)
      .maxLength(10),
  })
)

export const updateBoxValidator = vine.compile(
  vine.object({
    wines: vine
      .array(
        vine.object({
          id: vine.any().optional(),
          wineId: vine.any(),
          merchantNotes: vine.string().optional().nullable(),
          position: vine.number().min(1).max(10).optional(),
        })
      )
      .minLength(1)
      .maxLength(10)
      .optional(),
  })
)

export const addWineToBoxValidator = vine.compile(
  vine.object({
    wineId: vine.any(),
    merchantNotes: vine.string().optional().nullable(),
    position: vine.number().min(1).max(10).optional(),
  })
)
