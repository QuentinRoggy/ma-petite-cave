import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(255),
    email: vine.string().trim().email().normalizeEmail(),
    password: vine.string().minLength(8).maxLength(128),
    phone: vine.string().trim().maxLength(20).optional(),
    role: vine.enum(['client', 'merchant']).optional(),
    // Champs pour merchant
    shopName: vine.string().trim().minLength(2).maxLength(255).optional(),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
    password: vine.string(),
  })
)
