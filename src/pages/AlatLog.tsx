import { useEffect, useState } from "react";
import {
  alatLogService,
  type AlatLog,
  type AlatListMeta,
  type AlatLogStatus,
} from "@/services";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Buttons";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SortSummary } from "@/components/ui/SortSummary";
import { SortableTh } from "@/components/ui/SortableTh";
import { useTableSort } from "@/hooks/useTableSort";

const SEARCH_DEBOUNCE_MS = 400;

const STATUS_LABELS: Record<AlatLogStatus, string> = {
  pengajuan: "Pengajuan",
  keluar: "Keluar",
  masuk: "Masuk",
  tambah: "Tambah",
  hapus: "Hapus",
  edit: "Edit",
};

const STATUS_TONES: Record<
  AlatLogStatus,
  "success" | "warning" | "danger" | "neutral" | "info"
> = {
  pengajuan: "info",
  keluar: "warning",
  masuk: "success",
  tambah: "success",
  hapus: "danger",
  edit: "neutral",
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
  const { sorts, toggleSort, removeSort, resetSort } = useTableSort(
    { column: "created_at", direction: "desc" },
    () => setPage(1),
  );
  const [isLoading, setIsLoading] = useState(true);
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

    alatLogService
      .getAll({
        search: debouncedSearch || undefined,
        status: (status || undefined) as AlatLogStatus | undefined,
        page,
        sorts,
      })
      .then((response) => {
        if (cancelled) return;
        setLogList(response.data);
        setMeta(response.meta);
      })
      .catch(() => {
        // Error sudah ditampilkan otomatis di modal global.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, status, page, sorts, refreshKey]);

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

      <SortSummary
        sorts={sorts}
        onRemove={removeSort}
        onReset={resetSort}
      />

      <Card variant="outlined" className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-low) text-xs uppercase text-(--md-sys-color-on-surface-variant)">
            <tr>
              <SortableTh
                label="Waktu"
                column="created_at"
                sorts={sorts}
                onSort={toggleSort}
                align="center"
              />
              <SortableTh
                label="ID Log"
                column="id_log"
                sorts={sorts}
                onSort={toggleSort}
                align="center"
              />
              <SortableTh
                label="Keperluan"
                column="keperluan"
                sorts={sorts}
                onSort={toggleSort}
                align="center"
              />
              <SortableTh
                label="PIC"
                column="nama_pic"
                sorts={sorts}
                onSort={toggleSort}
                align="center"
              />
              <SortableTh
                label="Alat"
                column="inventaris"
                sorts={sorts}
                onSort={toggleSort}
                align="center"
              />
              <SortableTh
                label="Status"
                column="status"
                sorts={sorts}
                onSort={toggleSort}
                align="center"
              />
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
                  <td className="px-4 py-3 whitespace-nowrap text-center text-(--md-sys-color-on-surface-variant)">
                    {formatWaktu(log.waktu)}
                  </td>
                  <td className="px-4 py-3 text-center font-mono">{log.id_log}</td>
                  <td className="px-4 py-3 text-center">{log.keperluan}</td>
                  <td className="px-4 py-3 text-center">
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
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono">{log.inventaris}</span>
                    <span className="block text-xs text-(--md-sys-color-on-surface-variant)">
                      {log.nama_alat ?? "(alat dihapus)"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge tone={STATUS_TONES[log.status] ?? "neutral"}>
                      {STATUS_LABELS[log.status] ?? log.status}
                    </Badge>
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
