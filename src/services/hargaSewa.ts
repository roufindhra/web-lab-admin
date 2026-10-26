import { api } from './api'
import type { AlatListMeta } from './alat'

export interface HargaSewa {
  id: number
  nama_alat: string
  tarif_per_hari: string
}

export interface HargaSewaListParams {
  search?: string
  page?: number
  perPage?: number
}

export interface HargaSewaListResponse {
  data: HargaSewa[]
  meta: AlatListMeta
}

export interface HargaSewaPayload {
  nama_alat: string
  tarif_per_hari: number
}

export const hargaSewaService = {
  async getAll(params: HargaSewaListParams = {}): Promise<HargaSewaListResponse> {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.page !== undefined) query.set('page', String(params.page))
    if (params.perPage !== undefined) query.set('per_page', String(params.perPage))

    const qs = query.toString()
    return api<HargaSewaListResponse>(`/api/admin/harga-sewa${qs ? `?${qs}` : ''}`)
  },

  async create(payload: HargaSewaPayload): Promise<HargaSewa> {
    return api<HargaSewa>('/api/admin/harga-sewa', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async update(id: number, payload: HargaSewaPayload): Promise<HargaSewa> {
    return api<HargaSewa>(`/api/admin/harga-sewa/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  async remove(id: number): Promise<void> {
    await api<void>(`/api/admin/harga-sewa/${id}`, { method: 'DELETE' })
  },
}
