import { api } from './api'
import type { KondisiEntry, AlatListMeta } from './alat'

export type AlatLogStatus = 'pengajuan' | 'keluar' | 'masuk' | 'tambah' | 'hapus' | 'edit'

export interface AlatLog {
  id: number
  id_log: string
  keperluan: string
  nim_pic: number | null
  nama_pic: string | null
  inventaris: string
  nama_alat: string | null
  kondisi: KondisiEntry[]
  status: AlatLogStatus
  waktu: string
}

export interface AlatLogListParams {
  search?: string
  status?: AlatLogStatus
  keperluan?: string
  page?: number
  perPage?: number
}

interface ListResponse {
  data: AlatLog[]
  meta: AlatListMeta
}

export const alatLogService = {
  async getAll(params: AlatLogListParams = {}): Promise<ListResponse> {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.status) query.set('status', params.status)
    if (params.keperluan) query.set('keperluan', params.keperluan)
    if (params.page !== undefined) query.set('page', String(params.page))
    if (params.perPage !== undefined) query.set('per_page', String(params.perPage))

    const qs = query.toString()
    return api<ListResponse>(`/api/admin/alat-log${qs ? `?${qs}` : ''}`)
  },
}
