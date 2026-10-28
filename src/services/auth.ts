import { api, getToken, removeToken, setToken } from './api'

export interface AdminUser {
  id: number
  nama: string
  nip?: number
  nim?: number
  surel: string | null
  role: 'dosen' | 'asisten'
  pengampu_praktikum?: string[]
  pengampu_plug?: Record<string, string[]>
  alat_permissions?: string[]
  alat_token_expires_at?: string | null
}

interface LoginResponse {
  user: AdminUser
  token: string
}

interface MeResponse {
  user: AdminUser
}

export const adminAuthService = {
  async login(nomorInduk: string, password: string): Promise<AdminUser> {
    const response = await api<LoginResponse>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ nomor_induk: nomorInduk, password }),
    })
    setToken(response.token)
    return response.user
  },

  async getUser(): Promise<AdminUser> {
    const response = await api<MeResponse>('/api/admin/me')
    return response.user
  },

  async logout(): Promise<void> {
    try {
      if (getToken()) {
        await api('/api/admin/logout', { method: 'POST' })
      }
    } finally {
      removeToken()
    }
  },
}
