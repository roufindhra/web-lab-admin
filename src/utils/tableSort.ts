export type SortDirection = "asc" | "desc";

export interface SortSpec {
  column: string;
  direction: SortDirection;
}

export const MAX_SORT_LEVELS = 5;

export const SORT_LABELS: Record<string, string> = {
  nim: "NIM",
  nama: "Nama",
  angkatan: "Angkatan",
  surel: "Email",
  is_active_user: "Status",
  is_active_asisten: "Status",
  inventaris: "Inventaris",
  nama_alat: "Nama Alat",
  serial_number: "Serial Number",
  jumlah: "Jumlah",
  lokasi_penyimpanan: "Lokasi",
  ketersediaan: "Ketersediaan",
  created_at: "Waktu",
  id_log: "ID Log",
  keperluan: "Keperluan",
  nama_pic: "PIC",
  status: "Status",
  tanggal_pinjam: "Tanggal Pinjam",
  tanggal_kembali: "Tanggal Kembali",
  tarif_per_hari: "Tarif per Hari",
  semester: "Semester",
  praktikum_slug: "Slug",
  praktikum_label: "Praktikum",
  is_active: "Status",
  materi: "Materi",
  tanggal: "Tanggal",
  tanggal_mulai: "Tanggal Mulai",
  tanggal_selesai: "Tanggal Selesai",
  bobot: "Bobot",
  nomor: "No.",
  kelompok: "Kelompok",
};

const toggleDirection = (direction: SortDirection): SortDirection =>
  direction === "asc" ? "desc" : "asc";

export function toggleSortSpec(
  current: SortSpec[],
  column: string,
  additive = false,
): SortSpec[] {
  if (!additive) {
    const primary = current[0];

    if (primary?.column === column) {
      return [{ column, direction: toggleDirection(primary.direction) }];
    }

    return [{ column, direction: "asc" }];
  }

  const index = current.findIndex((sort) => sort.column === column);

  if (index >= 0) {
    return current.map((sort, sortIndex) =>
      sortIndex === index
        ? { ...sort, direction: toggleDirection(sort.direction) }
        : sort,
    );
  }

  if (current.length >= MAX_SORT_LEVELS) return current;

  return [...current, { column, direction: "asc" }];
}

export function compareValues(a: unknown, b: unknown): number {
  if (a === null || a === undefined) {
    return b === null || b === undefined ? 0 : 1;
  }

  if (b === null || b === undefined) return -1;

  if (typeof a === "number" && typeof b === "number") return a - b;

  return String(a).localeCompare(String(b), "id", {
    numeric: true,
    sensitivity: "base",
  });
}

export function sortRows<T>(
  rows: T[],
  sorts: SortSpec[],
  getValue: (row: T, column: string) => string | number | null | undefined,
): T[] {
  return [...rows].sort((a, b) => {
    for (const sort of sorts) {
      const result = compareValues(
        getValue(a, sort.column),
        getValue(b, sort.column),
      );

      if (result !== 0) {
        return sort.direction === "asc" ? result : -result;
      }
    }

    return 0;
  });
}

export function appendSortParams(
  query: URLSearchParams,
  sorts?: SortSpec[],
): void {
  sorts?.forEach((sort, index) => {
    query.set(`sort[${index}][column]`, sort.column);
    query.set(`sort[${index}][direction]`, sort.direction);
  });
}
