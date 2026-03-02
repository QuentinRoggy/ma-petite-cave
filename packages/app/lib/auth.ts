export const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mpc_token'

export type User = {
  id: number
  fullName: string | null
  email: string
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
