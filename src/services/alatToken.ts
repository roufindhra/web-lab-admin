import { api } from './api'
import type { AlatListMeta } from './alat'

export const ALAT_PERMISSIONS = ['edit_status', 'edit_kondisi', 'crud_inventaris'] as const

export type AlatPermission = (typeof ALAT_PERMISSIONS)[number]

export const ALAT_PERMISSION_LABELS: Record<AlatPermission, string> = {
  edit_status: 'Edit Status Ketersediaan',
  edit_kondisi: 'Edit Catatan Kondisi',
  crud_inventaris: 'Tambah & Hapus Inventaris',
}

export type AlatTokenDuration = '30_mins' | '2_hours' | '1_day'

export const ALAT_TOKEN_DURATIONS: { value: AlatTokenDuration; label: string }[] = [
  { value: '30_mins', label: '30 Menit' },
  { value: '2_hours', label: '2 Jam' },
  { value: '1_day', label: '1 Hari (24 Jam)' },
]

export type AlatTokenStatus = 'belum_diklaim' | 'aktif' | 'kadaluarsa' | 'dicabut'

export interface AlatToken {
  id: number
  token: string
  mahasiswa_id: number
  mahasiswa_nama: string | null
  mahasiswa_nim: number | null
  permissions: AlatPermission[]
  expires_at: string | null
  claimed_at: string | null
  revoked_at: string | null
  status: AlatTokenStatus
}

export interface AlatTokenListResponse {
  data: AlatToken[]
  meta: AlatListMeta
}

export interface GenerateAlatTokenPayload {
  mahasiswa_id: number
  permissions: AlatPermission[]
  duration: AlatTokenDuration
}

export interface ClaimAlatTokenResponse {
  permissions: AlatPermission[]
  expires_at: string
}

export const alatTokenService = {
  async list(): Promise<AlatTokenListResponse> {
    return api<AlatTokenListResponse>('/api/admin/alat-token')
  },

  async generate(payload: GenerateAlatTokenPayload): Promise<AlatToken> {
    return api<AlatToken>('/api/admin/alat-token', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async revoke(id: number): Promise<AlatToken> {
    return api<AlatToken>(`/api/admin/alat-token/${id}/revoke`, { method: 'POST' })
  },

  async claim(code: string): Promise<ClaimAlatTokenResponse> {
    return api<ClaimAlatTokenResponse>('/api/admin/alat-token/claim', {
      method: 'POST',
      body: JSON.stringify({ token: code }),
    })
  },
}
