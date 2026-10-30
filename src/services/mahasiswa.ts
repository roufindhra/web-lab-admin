import { api } from './api'

export interface Mahasiswa {
  id: number
  nama: string
  nim: number
  surel: string | null
  angkatan: number
  praktikum: string[] | null
  praktikum_plug: Record<string, string> | null
  is_asisten: boolean
  is_active_asisten: boolean
  pengampu_praktikum: string[] | null
  pengampu_plug: Record<string, string[]> | null
  role: 'asisten' | 'mahasiswa'
}

export interface MahasiswaListParams {
  search?: string
  angkatan?: number
  role?: 'asisten' | 'asisten_all' | 'mahasiswa' | 'asisten_nonaktif'
  page?: number
  perPage?: number
  sortDirection?: 'asc' | 'desc'
}

export interface MahasiswaListMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

interface ListResponse {
  data: Mahasiswa[]
  meta: MahasiswaListMeta
}

export interface MahasiswaImportResult {
  message: string
  imported: number
  updated: number
  failed: { row: number; message: string }[]
}

export const mahasiswaService = {
  async getAll(params: MahasiswaListParams = {}): Promise<ListResponse> {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.angkatan !== undefined) query.set('angkatan', String(params.angkatan))
    if (params.role) query.set('role', params.role)
    if (params.page !== undefined) query.set('page', String(params.page))
    if (params.perPage !== undefined) query.set('per_page', String(params.perPage))
    if (params.sortDirection) query.set('sort_direction', params.sortDirection)

    const qs = query.toString()
    return api<ListResponse>(`/api/admin/mahasiswa${qs ? `?${qs}` : ''}`)
  },

  async importCsv(file: File): Promise<MahasiswaImportResult> {
    const body = new FormData()
    body.append('file', file)

    return api<MahasiswaImportResult>('/api/admin/mahasiswa/import', { method: 'POST', body })
  },

  async update(
    id: number,
    data: { praktikum: string[]; praktikum_plug: Record<string, string> },
  ): Promise<Mahasiswa> {
    return api<Mahasiswa>(`/api/admin/mahasiswa/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async updateAsisten(
    id: number,
    data: {
      is_asisten: boolean
      is_active_asisten: boolean
      pengampu_praktikum: string[]
      pengampu_plug: Record<string, string[]>
    },
  ): Promise<Mahasiswa> {
    return api<Mahasiswa>(`/api/admin/mahasiswa/${id}/asisten`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}
