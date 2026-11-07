import { api } from './api'
import { appendSortParams, type SortSpec } from '../utils/tableSort'

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
  is_active_user: boolean
  pengampu_praktikum: string[] | null
  pengampu_plug: Record<string, string[]> | null
  role: 'asisten' | 'mahasiswa'
}

export interface MahasiswaListParams {
  search?: string
  angkatan?: number
  role?: 'asisten' | 'asisten_all' | 'mahasiswa' | 'asisten_nonaktif'
  status?: 'active' | 'inactive' | 'all'
  page?: number
  perPage?: number
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  sorts?: SortSpec[]
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

export type MahasiswaImportStatusValue =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'

export interface MahasiswaImportFailure {
  row: number
  message: string
}

export interface MahasiswaImportStatus {
  id: number
  original_filename: string
  status: MahasiswaImportStatusValue
  total_rows: number
  processed_rows: number
  imported: number
  updated: number
  failed_count: number
  failures: MahasiswaImportFailure[]
  error_message: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string | null
}

export const mahasiswaService = {
  async getAll(params: MahasiswaListParams = {}): Promise<ListResponse> {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.angkatan !== undefined) query.set('angkatan', String(params.angkatan))
    if (params.role) query.set('role', params.role)
    if (params.status) query.set('status', params.status)
    if (params.page !== undefined) query.set('page', String(params.page))
    if (params.perPage !== undefined) query.set('per_page', String(params.perPage))
    if (params.sorts?.length) {
      appendSortParams(query, params.sorts)
    } else {
      if (params.sortBy) query.set('sort_by', params.sortBy)
      if (params.sortDirection) query.set('sort_direction', params.sortDirection)
    }

    const qs = query.toString()
    return api<ListResponse>(`/api/admin/mahasiswa${qs ? `?${qs}` : ''}`)
  },

  async startImportCsv(file: File): Promise<MahasiswaImportStatus> {
    const body = new FormData()
    body.append('file', file)

    return api<MahasiswaImportStatus>('/api/admin/mahasiswa/import', { method: 'POST', body })
  },

  async getImportStatus(id: number): Promise<MahasiswaImportStatus> {
    return api<MahasiswaImportStatus>(`/api/admin/mahasiswa/import/${id}`)
  },

  async getLatestImport(): Promise<MahasiswaImportStatus | null> {
    return api<MahasiswaImportStatus | null>('/api/admin/mahasiswa/import/latest')
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

  async updateStatus(id: number, isActive: boolean): Promise<Mahasiswa> {
    return api<Mahasiswa>(`/api/admin/mahasiswa/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active_user: isActive }),
    })
  },

  async resetPassword(id: number): Promise<{ message: string }> {
    return api<{ message: string }>(`/api/admin/mahasiswa/${id}/reset-password`, {
      method: 'POST',
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
