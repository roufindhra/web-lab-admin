import { api } from './api'

export interface KurikulumMateri {
    id: number
    praktikum_id: number
    materi_id: number
    materi_nama: string
    deskripsi: string
    is_active: boolean
}

export interface KurikulumPayload {
    materi_nama: string
    deskripsi: string
}

export const kurikulumService = {
    async getAll(slug: string): Promise<KurikulumMateri[]> {
        const response = await api<{ data: KurikulumMateri[] }>(
            `/api/admin/praktikum/${encodeURIComponent(slug)}/kurikulum`,
        )
        return response.data
    },
    async create(slug: string, payload: KurikulumPayload): Promise<KurikulumMateri> {
        const response = await api<{ data: KurikulumMateri }>(
            `/api/admin/praktikum/${encodeURIComponent(slug)}/kurikulum`,
            {
                method: 'POST',
                body: JSON.stringify(payload),
            },
        )
        return response.data
    },
    async update(slug: string, materiId: number, payload: KurikulumPayload): Promise<KurikulumMateri> {
        const response = await api<{ data: KurikulumMateri }>(
            `/api/admin/praktikum/${encodeURIComponent(slug)}/kurikulum/${materiId}`,
            {
                method: 'PUT',
                body: JSON.stringify(payload),
            },
        )
        return response.data
    },
    async destroy(slug: string, materiId: number): Promise<void> {
        await api<void>(`/api/admin/praktikum/${encodeURIComponent(slug)}/kurikulum/${materiId}`, {
            method: 'DELETE',
        })
    },
    async restore(slug: string, materiId: number): Promise<KurikulumMateri> {
        const response = await api<{ data: KurikulumMateri }>(
            `/api/admin/praktikum/${encodeURIComponent(slug)}/kurikulum/${materiId}/restore`,
            {
                method: 'POST',
            },
        )
        return response.data
    },
}
