import { api, getToken, removeToken, setToken } from './api'

export interface AdminUser {
  id: number
  nama: string
  nip?: number
  nim?: number
  surel: string | null
  role: 'dosen' | 'asisten'
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

  async changePassword(payload: {
    password: string
    password_baru: string
    password_baru_confirmation: string
  }): Promise<void> {
    await api<{ message: string }>('/api/admin/ubah-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
