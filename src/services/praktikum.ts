import { api } from './api'

export interface Jadwal {
    id: number
    plug: string
    hari: string
    jam_mulai: string
    jam_selesai: string
    is_active: boolean
    mahasiswa_count?: number
}

export interface Praktikum {
    id: number
    label: string
    semester: string
    is_active: boolean
    slug: string
    plugs: Jadwal[]
}

export type JadwalInput = Omit<Jadwal, 'id'> & { id?: number }

export interface AssignMahasiswa {
    id: number
    nama: string
    nim: number
    assigned: boolean
    kelompok?: string | null
    skor?: Record<string, number>
}

export interface ParameterPenilaian {
    nama: string
    bobot: number
}

export interface PertemuanMateri {
    id: number
    praktikum_id: number
    materi_id: number
    materi_nama: string
    is_active: boolean
}

export interface Pertemuan {
    id: number
    nomor: number
    materi: PertemuanMateri | null
    tanggal: string | null
    bobot: number
    parameter: ParameterPenilaian[]
}

export interface PertemuanPayload {
    nomor: number
    materi_id: number
    tanggal: string | null
    bobot: number
    parameter: ParameterPenilaian[]
}

export interface NilaiMahasiswa {
    mahasiswa_id: number
    // key: pertemuan id, lalu nama parameter
    nilai: Record<string, Record<string, number>>
}

export interface PraktikumPayload {
    praktikum_label: string
    semester: string
    praktikum_slug: string
    is_active: boolean
    plugs: JadwalInput[]
}

interface ListResponse {
    data: Praktikum[]
    meta: {
        current_page: number
        last_page: number
        per_page: number
        total: number
    }

}

export const praktikumService = {
    async getAll(): Promise<Praktikum[]> {
        const response = await api<ListResponse>('/api/admin/praktikum')
        return response.data
    },
    async getBySlug(slug: string): Promise<Praktikum> {
        return api<Praktikum>(`/api/admin/praktikum/${encodeURIComponent(slug)}`)
    },
    async destroy(id: number): Promise<void> {
        await api<void>(`/api/admin/praktikum/${id}`, {
            method: 'DELETE',
        })
    },
    async create(data: PraktikumPayload): Promise<Praktikum> {
        return api<Praktikum>('/api/admin/praktikum', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },
    async update(id: number, data: PraktikumPayload): Promise<Praktikum> {
        return api<Praktikum>(`/api/admin/praktikum/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        })
    },
    async listMahasiswa(slug: string, plug: string, assignedOnly = false): Promise<AssignMahasiswa[]> {
        const query = assignedOnly ? '?assigned=1' : ''
        const response = await api<{ data: AssignMahasiswa[] }>(
            `/api/admin/praktikum/${encodeURIComponent(slug)}/plugs/${encodeURIComponent(plug)}/mahasiswa${query}`,
        )
        return response.data
    },
    async assignMahasiswa(slug: string, plug: string, mahasiswaIds: number[]): Promise<void> {
        await api<void>(`/api/admin/praktikum/${encodeURIComponent(slug)}/plugs/${encodeURIComponent(plug)}/mahasiswa`, {
            method: 'PUT',
            body: JSON.stringify({ mahasiswa_ids: mahasiswaIds }),
        })
    },
    async updateKelompok(slug: string, mahasiswaId: number, kelompok: string): Promise<string | null> {
        const response = await api<{ kelompok: string | null }>(
            `/api/admin/praktikum/${encodeURIComponent(slug)}/mahasiswa/${mahasiswaId}/kelompok`,
            {
                method: 'PUT',
                body: JSON.stringify({ kelompok }),
            },
        )
        return response.kelompok
    },
    async listPertemuan(slug: string): Promise<Pertemuan[]> {
        const response = await api<{ data: Pertemuan[] }>(
            `/api/admin/praktikum/${encodeURIComponent(slug)}/pertemuan`,
        )
        return response.data
    },
    async createPertemuan(slug: string, payload: PertemuanPayload): Promise<Pertemuan> {
        return api<Pertemuan>(`/api/admin/praktikum/${encodeURIComponent(slug)}/pertemuan`, {
            method: 'POST',
            body: JSON.stringify(payload),
        })
    },
    async updatePertemuan(slug: string, pertemuanId: number, payload: PertemuanPayload): Promise<Pertemuan> {
        return api<Pertemuan>(
            `/api/admin/praktikum/${encodeURIComponent(slug)}/pertemuan/${pertemuanId}`,
            {
                method: 'PUT',
                body: JSON.stringify(payload),
            },
        )
    },
    async destroyPertemuan(slug: string, pertemuanId: number): Promise<void> {
        await api<void>(`/api/admin/praktikum/${encodeURIComponent(slug)}/pertemuan/${pertemuanId}`, {
            method: 'DELETE',
        })
    },
    async listNilaiPlug(slug: string, plug: string): Promise<NilaiMahasiswa[]> {
        const response = await api<{ data: NilaiMahasiswa[] }>(
            `/api/admin/praktikum/${encodeURIComponent(slug)}/plugs/${encodeURIComponent(plug)}/nilai`,
        )
        return response.data
    },
    async saveNilaiPlug(
        slug: string,
        plug: string,
        pertemuanId: number,
        nilai: Record<string, Record<string, number | null>>,
    ): Promise<void> {
        await api<void>(
            `/api/admin/praktikum/${encodeURIComponent(slug)}/plugs/${encodeURIComponent(plug)}/pertemuan/${pertemuanId}/nilai`,
            {
                method: 'PUT',
                body: JSON.stringify({ nilai }),
            },
        )
    },
}