import vine from '@vinejs/vine'

export const createClientValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    fullName: vine.string().minLength(2),
    phone: vine.string().optional(),
    password: vine.string().minLength(8),
    notes: vine.string().optional(),
  })
)

export const updateClientValidator = vine.compile(
  vine.object({
    notes: vine.string().optional(),
    status: vine.enum(['active', 'paused', 'cancelled']).optional(),
  })
)
