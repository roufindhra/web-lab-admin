import { api } from "./api";

export interface PendingAlat {
  nama_alat: string;
  jumlah: number;
}

export interface PendingPeminjaman {
  id: number;
  nim: number;
  nama: string;
  keperluan: string;
  keperluan_label: string;
  praktikum_slug: string | null;
  created_at: string | null;
  alat: PendingAlat[];
}

export interface AlatKeluarDetailAlat {
  nama_alat: string;
  jumlah: number;
}

export interface AlatKeluarItem {
  id: number;
  nama: string;
  alat: AlatKeluarDetailAlat[];
}

export interface JadwalMendatangSesi {
  praktikum: string;
  slug: string;
  plug: string;
  jam_mulai: string;
  jam_selesai: string;
}

export interface JadwalMendatangHari {
  tanggal: string;
  hari: string;
  sesi: JadwalMendatangSesi[];
}

export interface DashboardStats {
  pending: {
    total: number;
    items: PendingPeminjaman[];
  };
  alat_keluar: {
    total: number;
    items: AlatKeluarItem[];
    maintain: number;
  };
  jadwal_mendatang: JadwalMendatangHari[];
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api<{ data: DashboardStats }>(
      "/api/admin/dashboard",
    );
    return response.data;
  },
};
