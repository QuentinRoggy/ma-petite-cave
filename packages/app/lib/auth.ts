export const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mpc_token'

export type MerchantProfile = {
  id: number
  userId: number
  shopName: string
  address: string | null
  phone: string | null
  logoUrl: string | null
}

export type User = {
  id: number
  email: string
  fullName: string | null
  phone: string | null
  role: 'client' | 'merchant'
  merchantProfile?: MerchantProfile
  createdAt: string
  updatedAt: string | null
}

export type AuthResponse = {
  user: User
  token: {
    type: string
    token: string
    expiresAt: string | null
  }
}
