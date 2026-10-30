import { useEffect, useState } from "react";
import {
  ApiError,
  PEMINJAMAN_STATUSES,
  peminjamanService,
  type AlatListMeta,
  type Peminjaman,
  type PeminjamanStatus,
} from "@/services";
import ConfirmActionModal from "../components/modals/ConfirmActionModal";
import KembalikanModal from "../components/modals/KembalikanModal";
import RevisiModal from "../components/modals/RevisiModal";
import TolakModal from "../components/modals/TolakModal";
import { Button } from "@/components/ui/Buttons";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const SEARCH_DEBOUNCE_MS = 400;

const STATUS_LABELS: Record<PeminjamanStatus, string> = {
  pending: "Menunggu",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
};

const STATUS_BADGE_CLASSES: Record<PeminjamanStatus, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  disetujui:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  ditolak: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

function formatWaktu(value: string): string {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PeminjamanPage() {
  const [peminjamanList, setPeminjamanList] = useState<Peminjaman[]>([]);
  const [meta, setMeta] = useState<AlatListMeta | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [approveTarget, setApproveTarget] = useState<Peminjaman | null>(null);
  const [tolakTarget, setTolakTarget] = useState<Peminjaman | null>(null);
  const [kembalikanTarget, setKembalikanTarget] = useState<Peminjaman | null>(
    null,
  );
  const [revisiTarget, setRevisiTarget] = useState<Peminjaman | null>(null);

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

    peminjamanService
      .getAll({
        search: debouncedSearch || undefined,
        status: (status || undefined) as PeminjamanStatus | undefined,
        page,
      })
      .then((response) => {
        if (cancelled) return;
        setPeminjamanList(response.data);
        setMeta(response.meta);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Gagal memuat data peminjaman.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, status, page, refreshKey]);

  const hasActiveFilter = debouncedSearch || status;

  const statusOptions = [
    { value: "", label: "Semua status" },
    ...PEMINJAMAN_STATUSES.map((value) => ({
      value,
      label: STATUS_LABELS[value],
    })),
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-(--md-sys-color-on-surface)">
        Peminjaman Alat
      </h1>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama, NIM, keperluan, inventaris..."
          containerClassName="w-64"
        />
        <Select
          options={statusOptions}
          value={status}
          onValueChange={(val) => {
            setPage(1);
            setStatus(val);
          }}
          containerClassName="w-48"
        />
        {hasActiveFilter && (
          <Button
            variant="text"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatus("");
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
              <th className="px-4 py-3">Diajukan</th>
              <th className="px-4 py-3">Peminjam</th>
              <th className="px-4 py-3">Keperluan</th>
              <th className="px-4 py-3">Alat</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--md-sys-color-outline-variant) text-(--md-sys-color-on-surface)">
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-(--md-sys-color-on-surface-variant)"
                >
                  Memuat...
                </td>
              </tr>
            ) : peminjamanList.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-(--md-sys-color-on-surface-variant)"
                >
                  {hasActiveFilter
                    ? "Tidak ada peminjaman yang cocok dengan filter."
                    : "Belum ada pengajuan peminjaman."}
                </td>
              </tr>
            ) : (
              peminjamanList.map((peminjaman) => {
                const sedangBerjalan =
                  peminjaman.status === "disetujui" &&
                  peminjaman.returned_at === null;

                return (
                  <tr
                    key={peminjaman.id}
                    className="hover:bg-(--md-sys-color-surface-container-high) transition-colors"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-(--md-sys-color-on-surface-variant)">
                      {formatWaktu(peminjaman.dibuat_pada)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{peminjaman.nama}</span>
                      {peminjaman.keperluan === "penyewaan_komersil" ? (
                        <span className="block text-xs text-(--md-sys-color-on-surface-variant)">
                          {peminjaman.no_hp ?? "-"}
                          {peminjaman.institusi && ` · ${peminjaman.institusi}`}
                        </span>
                      ) : (
                        <span className="block font-mono text-xs text-(--md-sys-color-on-surface-variant)">
                          {peminjaman.nim}
                        </span>
                      )}
                    </td>
                    <td className="max-w-48 px-4 py-3">
                      {peminjaman.keperluan_label}
                      {peminjaman.praktikum_slug && (
                        <span className="block font-mono text-xs text-(--md-sys-color-on-surface-variant)">
                          {peminjaman.praktikum_slug}
                        </span>
                      )}
                      {peminjaman.keperluan === "penyewaan_komersil" &&
                        peminjaman.tanggal_pinjam &&
                        peminjaman.tanggal_kembali && (
                          <span className="block text-xs text-(--md-sys-color-on-surface-variant)">
                            {peminjaman.tanggal_pinjam} →{" "}
                            {peminjaman.tanggal_kembali}
                          </span>
                        )}
                    </td>
                    <td className="px-4 py-3">
                      <ul className="space-y-0.5">
                        {peminjaman.items.map((item) => (
                          <li
                            key={item.id}
                            className="text-(--md-sys-color-on-surface-variant)"
                          >
                            <span className="font-mono text-xs">
                              {item.inventaris}
                            </span>{" "}
                            {item.nama_alat ?? "-"} ×{item.jumlah}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_BADGE_CLASSES[peminjaman.status]
                        }`}
                      >
                        {STATUS_LABELS[peminjaman.status]}
                      </span>
                      {peminjaman.status === "disetujui" && (
                        <span className="mt-1 block text-xs text-(--md-sys-color-on-surface-variant)">
                          {peminjaman.returned_at
                            ? `Dikembalikan ${formatWaktu(peminjaman.returned_at)}`
                            : `Disetujui ${peminjaman.approved_by ?? "-"} — sedang dipinjam`}
                        </span>
                      )}
                      {peminjaman.status === "ditolak" &&
                        peminjaman.catatan && (
                          <span className="mt-1 block text-xs text-red-500">
                            {peminjaman.catatan}
                          </span>
                        )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {peminjaman.status === "pending" &&
                          (peminjaman.can_process ? (
                            <>
                              <Button
                                variant="text"
                                size="sm"
                                onClick={() => setApproveTarget(peminjaman)}
                                className="text-green-600 dark:text-green-400 hover:underline px-2 py-1"
                              >
                                Setujui
                              </Button>
                              <Button
                                variant="text"
                                size="sm"
                                onClick={() => setRevisiTarget(peminjaman)}
                                className="hover:underline px-2 py-1"
                              >
                                Revisi
                              </Button>
                              <Button
                                variant="text"
                                size="sm"
                                onClick={() => setTolakTarget(peminjaman)}
                                className="text-red-600 dark:text-red-400 hover:underline px-2 py-1"
                              >
                                Tolak
                              </Button>
                            </>
                          ) : (
                            <span
                              className="text-xs text-(--md-sys-color-on-surface-variant) opacity-60"
                              title="Di luar plug ampuan Anda"
                            >
                              Menunggu persetujuan dosen
                            </span>
                          ))}
                        {sedangBerjalan &&
                          (peminjaman.can_process ? (
                            <Button
                              variant="text"
                              size="sm"
                              onClick={() => setKembalikanTarget(peminjaman)}
                              className="hover:underline px-2 py-1"
                            >
                              Konfirmasi Pengembalian
                            </Button>
                          ) : (
                            <span
                              className="text-xs text-(--md-sys-color-on-surface-variant) opacity-60"
                              title="Di luar plug ampuan Anda"
                            >
                              Menunggu dosen
                            </span>
                          ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {meta && (
        <div className="flex items-center justify-between text-sm text-(--md-sys-color-on-surface-variant)">
          <span>
            Menampilkan {peminjamanList.length} dari {meta.total} peminjaman
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

      {approveTarget && (
        <ConfirmActionModal
          title="Setujui Pengajuan"
          description={`Setujui peminjaman ${approveTarget.items.length} alat oleh ${approveTarget.nama}${approveTarget.nim !== null ? ` (${approveTarget.nim})` : ""}? Stok alat akan dicek dan log pengeluaran tercatat otomatis.`}
          confirmLabel="Setujui"
          confirmClass="bg-green-600 hover:bg-green-500"
          onConfirm={() =>
            peminjamanService.setujui(approveTarget.id).then(() => undefined)
          }
          onClose={() => setApproveTarget(null)}
          onSuccess={() => {
            setApproveTarget(null);
            setRefreshKey((key) => key + 1);
          }}
        />
      )}

      {revisiTarget && (
        <RevisiModal
          peminjaman={revisiTarget}
          onClose={() => setRevisiTarget(null)}
          onSuccess={() => {
            setRevisiTarget(null);
            setRefreshKey((key) => key + 1);
          }}
        />
      )}

      {tolakTarget && (
        <TolakModal
          peminjaman={tolakTarget}
          onClose={() => setTolakTarget(null)}
          onSuccess={() => {
            setTolakTarget(null);
            setRefreshKey((key) => key + 1);
          }}
        />
      )}

      {kembalikanTarget && (
        <KembalikanModal
          peminjaman={kembalikanTarget}
          onClose={() => setKembalikanTarget(null)}
          onSuccess={() => {
            setKembalikanTarget(null);
            setRefreshKey((key) => key + 1);
          }}
        />
      )}
    </div>
  );
}
