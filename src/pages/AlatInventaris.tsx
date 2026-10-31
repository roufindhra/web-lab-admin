import { useEffect, useState } from "react";
import {
  alatService,
  ApiError,
  KETERSEDIAAN_STATUSES,
  KONDISI_STATUSES,
  type Alat,
  type AlatListMeta,
  type KondisiStatus,
  type KetersediaanStatus,
} from "@/services";
import AlatFormModal from "../components/modals/AlatFormModal";
import DeleteConfirmModal from "../components/modals/DeleteConfirmModal";
import KondisiDetailModal from "../components/modals/KondisiDetailModal";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/components/ui/Buttons";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const SEARCH_DEBOUNCE_MS = 400;

const KONDISI_LABELS: Record<KondisiStatus, string> = {
  baik: "baik",
  rusak_ringan: "rusak ringan",
  rusak_berat: "rusak berat",
  maintenance: "maintenance",
};

const KETERSEDIAAN_LABELS: Record<KetersediaanStatus, string> = {
  tersedia: "Tersedia",
  dipinjam: "Dipinjam",
  perbaikan: "Perbaikan",
};

const KETERSEDIAAN_BADGE_CLASSES: Record<KetersediaanStatus, string> = {
  tersedia:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  dipinjam:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  perbaikan: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function AlatPage() {
  const { canAlat } = useAdminAuth();
  const canCrud = canAlat("crud_inventaris");
  const canEditKondisi = canAlat("edit_kondisi");
  const canEditStatus = canAlat("edit_status");
  const canEditSomething = canCrud || canEditKondisi || canEditStatus;

  const [alatList, setAlatList] = useState<Alat[]>([]);
  const [meta, setMeta] = useState<AlatListMeta | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ketersediaan, setKetersediaan] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formTarget, setFormTarget] = useState<Alat | null | undefined>(
    undefined,
  );
  const [detailTarget, setDetailTarget] = useState<Alat | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Alat | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    alatService
      .getAll({
        search: debouncedSearch || undefined,
        ketersediaan: (ketersediaan || undefined) as
          | KetersediaanStatus
          | undefined,
        page,
        sortDirection,
      })
      .then((response) => {
        if (cancelled) return;
        setAlatList(response.data);
        setMeta(response.meta);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : "Gagal memuat data alat.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, ketersediaan, page, sortDirection, refreshKey]);

  const hasActiveFilter = debouncedSearch || ketersediaan;

  const handleCloseForm = () => setFormTarget(undefined);

  const handleFormSuccess = () => {
    setFormTarget(undefined);
    setRefreshKey((key) => key + 1);
  };

  const kondisiRingkas = (alat: Alat) =>
    KONDISI_STATUSES.filter((status) => (alat.kondisi_ringkas[status] ?? 0) > 0)
      .map(
        (status) => `${alat.kondisi_ringkas[status]} ${KONDISI_LABELS[status]}`,
      )
      .join(" · ");

  const ketersediaanOptions = [
    { value: "", label: "Semua ketersediaan" },
    ...KETERSEDIAAN_STATUSES.map((status) => ({
      value: status,
      label: KETERSEDIAAN_LABELS[status],
    })),
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-(--md-sys-color-on-surface)">
        Inventarisasi Alat
      </h1>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="filled"
          onClick={() => setFormTarget(null)}
          disabled={!canCrud}
          title={canCrud ? undefined : "Klaim token izin untuk mengedit"}
        >
          + Tambah Alat
        </Button>
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari alat, merk, kode inventaris..."
          containerClassName="w-64"
        />
        <Select
          options={ketersediaanOptions}
          value={ketersediaan}
          onValueChange={(val) => {
            setPage(1);
            setKetersediaan(val);
          }}
          containerClassName="w-52"
        />
        {hasActiveFilter && (
          <Button
            variant="text"
            size="sm"
            onClick={() => {
              setSearch("");
              setKetersediaan("");
              setPage(1);
            }}
          >
            Reset filter
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Card variant="outlined" className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-low) text-xs uppercase text-(--md-sys-color-on-surface-variant)">
            <tr>
              <th className="px-4 py-3">Inventaris</th>
              <th className="px-4 py-3">
                <button
                  onClick={() => {
                    setPage(1);
                    setSortDirection((current) =>
                      current === "asc" ? "desc" : "asc",
                    );
                  }}
                  className="flex items-center gap-1 uppercase hover:text-(--md-sys-color-on-surface) transition-colors"
                >
                  Nama Alat
                  <span className="text-[10px]">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                </button>
              </th>
              <th className="px-4 py-3">Serial Number</th>
              <th className="px-4 py-3">Jumlah</th>
              <th className="px-4 py-3">Kondisi</th>
              <th className="px-4 py-3">Lokasi</th>
              <th className="px-4 py-3">Ketersediaan</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--md-sys-color-outline-variant) text-(--md-sys-color-on-surface)">
            {isLoading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-(--md-sys-color-on-surface-variant)"
                >
                  Memuat...
                </td>
              </tr>
            ) : alatList.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-(--md-sys-color-on-surface-variant)"
                >
                  {hasActiveFilter
                    ? "Tidak ada alat yang cocok dengan filter."
                    : "Belum ada data alat."}
                </td>
              </tr>
            ) : (
              alatList.map((alat) => (
                <tr
                  key={alat.id}
                  className="hover:bg-(--md-sys-color-surface-container-high) transition-colors"
                >
                  <td className="px-4 py-3 font-mono">{alat.inventaris}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{alat.nama_alat}</span>
                    <span className="block text-xs text-(--md-sys-color-on-surface-variant)">
                      {alat.merk} {alat.tipe}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-(--md-sys-color-on-surface-variant)">
                    {alat.serial_number}
                  </td>
                  <td className="px-4 py-3">{alat.jumlah}</td>
                  <td className="px-4 py-3">
                    <span className="text-(--md-sys-color-on-surface-variant)">
                      {kondisiRingkas(alat) || "-"}
                    </span>
                    <Button
                      variant="text"
                      size="sm"
                      onClick={() => setDetailTarget(alat)}
                      className="ml-1 hover:underline px-2 py-0.5 inline-flex"
                    >
                      Detail
                    </Button>
                  </td>
                  <td className="px-4 py-3 text-(--md-sys-color-on-surface-variant)">
                    {alat.lokasi_penyimpanan}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        KETERSEDIAAN_BADGE_CLASSES[alat.ketersediaan] ??
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {KETERSEDIAAN_LABELS[alat.ketersediaan] ??
                        alat.ketersediaan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => setFormTarget(alat)}
                        disabled={!canEditSomething}
                        title={
                          canEditSomething
                            ? undefined
                            : "Klaim token izin untuk mengedit"
                        }
                        className="hover:underline px-2 py-1"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => setDeleteTarget(alat)}
                        disabled={!canCrud}
                        title={
                          canCrud
                            ? undefined
                            : "Klaim token izin untuk mengedit"
                        }
                        className="text-red-600 dark:text-red-400 hover:underline px-2 py-1"
                      >
                        Hapus
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {meta && (
        <div className="flex items-center justify-between text-sm text-(--md-sys-color-on-surface-variant)">
          <span>
            Menampilkan {alatList.length} dari {meta.total} alat
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((current) => current - 1)}
            >
              Sebelumnya
            </Button>
            <span>
              Halaman {meta.current_page} / {meta.last_page}
            </span>
            <Button
              variant="outlined"
              size="sm"
              disabled={page >= meta.last_page || isLoading}
              onClick={() => setPage((current) => current + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}

      {formTarget !== undefined && (
        <AlatFormModal
          alat={formTarget}
          canCrud={canCrud}
          canEditKondisi={canEditKondisi}
          canEditStatus={canEditStatus}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {detailTarget && (
        <KondisiDetailModal
          alat={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          alat={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => {
            setDeleteTarget(null);
            setRefreshKey((key) => key + 1);
          }}
        />
      )}
    </div>
  );
}
