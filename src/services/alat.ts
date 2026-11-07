import { api } from './api'
import { appendSortParams, type SortSpec } from '../utils/tableSort'

export const KONDISI_STATUSES = ['baik', 'rusak_ringan', 'rusak_berat', 'maintenance'] as const

export type KondisiStatus = (typeof KONDISI_STATUSES)[number]

export type KondisiRingkas = Record<KondisiStatus, number>

export interface KondisiCatatan {
  komponen: string
  keterangan: string
}

export interface KondisiEntry {
  status: KondisiStatus
  jumlah: number
  catatan: KondisiCatatan[]
}

export const KETERSEDIAAN_STATUSES = ['tersedia', 'dipinjam', 'perbaikan'] as const

export type KetersediaanStatus = (typeof KETERSEDIAAN_STATUSES)[number]

export interface Alat {
  id: number
  inventaris: string
  nama_alat: string
  merk: string
  tipe: string
  serial_number: string
  jumlah: number
  kondisi: KondisiEntry[]
  kondisi_ringkas: KondisiRingkas
  lokasi_penyimpanan: string
  ketersediaan: KetersediaanStatus
}

export interface AlatPayload {
  inventaris: string
  nama_alat: string
  merk: string
  tipe: string
  serial_number: string
  jumlah: number
  kondisi: KondisiEntry[]
  lokasi_penyimpanan: string
  ketersediaan: KetersediaanStatus
}

export interface AlatListParams {
  search?: string
  ketersediaan?: KetersediaanStatus
  page?: number
  perPage?: number
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  sorts?: SortSpec[]
}

export interface AlatListMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

interface ListResponse {
  data: Alat[]
  meta: AlatListMeta
}

export const alatService = {
  async getAll(params: AlatListParams = {}): Promise<ListResponse> {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.ketersediaan) query.set('ketersediaan', params.ketersediaan)
    if (params.page !== undefined) query.set('page', String(params.page))
    if (params.perPage !== undefined) query.set('per_page', String(params.perPage))
    if (params.sorts?.length) {
      appendSortParams(query, params.sorts)
    } else {
      if (params.sortBy) query.set('sort_by', params.sortBy)
      if (params.sortDirection) query.set('sort_direction', params.sortDirection)
    }

    const qs = query.toString()
    return api<ListResponse>(`/api/admin/alat${qs ? `?${qs}` : ''}`)
  },

  async create(data: AlatPayload): Promise<Alat> {
    return api<Alat>('/api/admin/alat', { method: 'POST', body: JSON.stringify(data) })
  },

  async update(id: number, data: AlatPayload): Promise<Alat> {
    return api<Alat>(`/api/admin/alat/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },

  async remove(id: number): Promise<void> {
    await api<void>(`/api/admin/alat/${id}`, { method: 'DELETE' })
  },
}
