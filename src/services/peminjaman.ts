import { api } from './api'
import type { AlatListMeta, KondisiEntry } from './alat'

export const PEMINJAMAN_STATUSES = ['pending', 'disetujui', 'ditolak'] as const

export type PeminjamanStatus = (typeof PEMINJAMAN_STATUSES)[number]

export interface PeminjamanItem {
  id: number
  alat_id: number
  inventaris: string
  nama_alat: string | null
  merk: string | null
  tipe: string | null
  jumlah: number
  jumlah_alat: number
  kondisi: KondisiEntry[]
  ketersediaan: string
}

export interface Peminjaman {
  id: number
  nim: number
  nama: string
  keperluan: string
  keperluan_label: string
  praktikum_slug: string | null
  status: PeminjamanStatus
  catatan: string | null
  approved_by: string | null
  approved_at: string | null
  returned_at: string | null
  dibuat_pada: string
  items: PeminjamanItem[]
}

export interface KembalikanItemPayload {
  peminjaman_alat_id: number
  kondisi: KondisiEntry[]
  ketersediaan: 'tersedia' | 'perbaikan'
}

export interface KembalikanPayload {
  items: KembalikanItemPayload[]
}

export interface PeminjamanListParams {
  search?: string
  status?: PeminjamanStatus
  page?: number
  perPage?: number
}

export interface PeminjamanListResponse {
  data: Peminjaman[]
  meta: AlatListMeta
}

export const peminjamanService = {
  async getAll(params: PeminjamanListParams = {}): Promise<PeminjamanListResponse> {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.status) query.set('status', params.status)
    if (params.page !== undefined) query.set('page', String(params.page))
    if (params.perPage !== undefined) query.set('per_page', String(params.perPage))

    const qs = query.toString()
    return api<PeminjamanListResponse>(`/api/admin/peminjaman${qs ? `?${qs}` : ''}`)
  },

  async setujui(id: number): Promise<Peminjaman> {
    return api<Peminjaman>(`/api/admin/peminjaman/${id}/setujui`, { method: 'POST' })
  },

  async tolak(id: number, catatan: string): Promise<Peminjaman> {
    return api<Peminjaman>(`/api/admin/peminjaman/${id}/tolak`, {
      method: 'POST',
      body: JSON.stringify({ catatan }),
    })
  },

  async kembalikan(id: number, payload: KembalikanPayload): Promise<Peminjaman> {
    return api<Peminjaman>(`/api/admin/peminjaman/${id}/kembalikan`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
