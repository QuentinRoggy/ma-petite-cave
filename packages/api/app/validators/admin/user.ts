import vine from '@vinejs/vine'

/**
 * Validator for creating a user via admin
 */
export const createAdminUserValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string().minLength(6),
    role: vine.enum(['client', 'merchant', 'admin']),
    fullName: vine.string().optional(),
    // Merchant specific
    shopName: vine.string().optional(),
    address: vine.string().optional(),
    phone: vine.string().optional(),
  })
)

/**
 * Validator for updating a user via admin
 */
export const updateAdminUserValidator = vine.compile(
  vine.object({
    email: vine.string().email().optional(),
    password: vine.string().minLength(6).optional(),
    role: vine.enum(['client', 'merchant', 'admin']).optional(),
    fullName: vine.string().optional().nullable(),
    // Merchant specific
    shopName: vine.string().optional().nullable(),
    address: vine.string().optional().nullable(),
    phone: vine.string().optional().nullable(),
  })
)
