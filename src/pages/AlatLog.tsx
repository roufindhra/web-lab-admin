import { useEffect, useState } from "react";
import {
  alatLogService,
  ApiError,
  type AlatLog,
  type AlatListMeta,
  type AlatLogStatus,
} from "@/services";
import { Button } from "@/components/ui/Buttons";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const SEARCH_DEBOUNCE_MS = 400;

const STATUS_LABELS: Record<AlatLogStatus, string> = {
  pengajuan: "Pengajuan",
  keluar: "Keluar",
  masuk: "Masuk",
  tambah: "Tambah",
  hapus: "Hapus",
  edit: "Edit",
};

const STATUS_BADGE_CLASSES: Record<AlatLogStatus, string> = {
  pengajuan: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  keluar:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  masuk: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  tambah:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  hapus: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  edit: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const formatWaktu = (waktu: string) =>
  new Date(waktu).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AlatLogPage() {
  const [logList, setLogList] = useState<AlatLog[]>([]);
  const [meta, setMeta] = useState<AlatListMeta | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

    alatLogService
      .getAll({
        search: debouncedSearch || undefined,
        status: (status || undefined) as AlatLogStatus | undefined,
        page,
      })
      .then((response) => {
        if (cancelled) return;
        setLogList(response.data);
        setMeta(response.meta);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : "Gagal memuat log alat.",
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
    ...(Object.keys(STATUS_LABELS) as AlatLogStatus[]).map((value) => ({
      value,
      label: STATUS_LABELS[value],
    })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-(--md-sys-color-on-surface)">
          Riwayat Alat
        </h1>
        <Button
          variant="outlined"
          size="sm"
          onClick={() => setRefreshKey((key) => key + 1)}
        >
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari id log, inventaris, PIC..."
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
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">ID Log</th>
              <th className="px-4 py-3">Keperluan</th>
              <th className="px-4 py-3">PIC</th>
              <th className="px-4 py-3">Alat</th>
              <th className="px-4 py-3">Status</th>
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
            ) : logList.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-(--md-sys-color-on-surface-variant)"
                >
                  {hasActiveFilter
                    ? "Tidak ada log yang cocok dengan filter."
                    : "Belum ada riwayat alat."}
                </td>
              </tr>
            ) : (
              logList.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-(--md-sys-color-surface-container-high) transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-(--md-sys-color-on-surface-variant)">
                    {formatWaktu(log.waktu)}
                  </td>
                  <td className="px-4 py-3 font-mono">{log.id_log}</td>
                  <td className="px-4 py-3">{log.keperluan}</td>
                  <td className="px-4 py-3">
                    {log.nim_pic ? (
                      <>
                        <span className="font-medium">{log.nim_pic}</span>
                        <span className="block text-xs text-(--md-sys-color-on-surface-variant)">
                          Mahasiswa
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium">
                          {log.nama_pic ?? "-"}
                        </span>
                        <span className="block text-xs text-(--md-sys-color-on-surface-variant)">
                          Non-mahasiswa
                        </span>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono">{log.inventaris}</span>
                    <span className="block text-xs text-(--md-sys-color-on-surface-variant)">
                      {log.nama_alat ?? "(alat dihapus)"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGE_CLASSES[log.status] ??
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {STATUS_LABELS[log.status] ?? log.status}
                    </span>
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
            Menampilkan {logList.length} dari {meta.total} log
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
    </div>
  );
}
