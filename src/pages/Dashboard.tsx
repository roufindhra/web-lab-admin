import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { dashboardService, ApiError, type DashboardStats } from "@/services";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";

const formatTanggal = (tanggal: string) =>
  new Date(`${tanggal}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });

export default function Dashboard() {
  const { user } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    dashboardService
      .getStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof ApiError ? err.message : "Gagal memuat statistik.",
          );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {user && (
        <div className="mt-6 rounded-lg border bg-white p-6">
          <p className="text-lg font-semibold">{user.nama}</p>
          <p className="mt-1 text-sm text-gray-600">
            {user.nip ? `NIP: ${user.nip}` : `NIM: ${user.nim}`} · Role:{" "}
            {user.role}
          </p>
        </div>
      )}

      {isLoading && <DashboardSkeleton />}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!isLoading && stats && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Link
            to="/alat-peminjaman"
            className="flex h-80 flex-col rounded-lg border bg-white p-6 transition-colors hover:bg-gray-50"
          >
            <p className="shrink-0 text-sm text-gray-600">
              Pengajuan Menunggu Persetujuan
            </p>
            {/* <p className="mt-2 shrink-0 text-3xl font-bold">
              {stats.pending.total}
            </p> */}
            {stats.pending.items.length > 0 && (
              <ul className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1">
                {stats.pending.items.map((item) => (
                  <li key={item.id}>
                    <p className="text-sm font-semibold">{item.nama}</p>
                    <p className="text-xs text-gray-500">
                      {item.keperluan_label}
                      {item.alat.length > 0 &&
                        ` · ${item.alat.map((a) => a.nama_alat).join(", ")}`}
                    </p>
                  </li>
                ))}
                {stats.pending.total > stats.pending.items.length && (
                  <li className="text-xs text-gray-400">
                    +{stats.pending.total - stats.pending.items.length}{" "}
                    pengajuan lainnya
                  </li>
                )}
              </ul>
            )}
          </Link>

          <div className="flex h-80 flex-col rounded-lg border bg-white p-6">
            <p className="shrink-0 text-sm text-gray-600">Alat Sedang Keluar</p>

            {stats.alat_keluar.items && stats.alat_keluar.items.length > 0 ? (
              <ul className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1">
                {stats.alat_keluar.items.map((item) => (
                  <li key={item.id}>
                    <p className="text-sm font-semibold">{item.nama}</p>

                    <p className="text-xs text-gray-500">
                      {item.alat
                        .map((a) => `${a.nama_alat} ${a.jumlah}x`)
                        .join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                Tidak ada alat yang sedang keluar.
              </p>
            )}
          </div>

          <div className="flex h-80 flex-col rounded-lg border bg-white p-6">
            <p className="shrink-0 text-sm text-gray-600">
              Jadwal Praktikum 8 Hari ke Depan
            </p>
            <ul className="mt-3 flex-1 overflow-y-auto space-y-3 pr-1">
              {stats.jadwal_mendatang.map((hari, index) => (
                <li key={hari.tanggal}>
                  <p
                    className={`text-xs font-semibold ${index === 0 ? "text-blue-600" : "text-gray-700"}`}
                  >
                    {index === 0 ? "Hari Ini" : hari.hari} ·{" "}
                    {formatTanggal(hari.tanggal)}
                  </p>
                  {hari.sesi.length === 0 ? (
                    <p className="mt-1 text-xs text-gray-400">
                      Tidak ada sesi.
                    </p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {hari.sesi.map((sesi, sesiIndex) => (
                        <li
                          key={`${sesi.slug}-${sesi.plug}-${sesi.jam_mulai}-${sesiIndex}`}
                        >
                          <Link
                            to={`/praktikum/${sesi.slug}`}
                            className="block rounded p-1 text-xs transition-colors hover:bg-blue-100"
                          >
                            <span className="font-semibold text-gray-800">
                              {sesi.praktikum}
                            </span>
                            <span className="text-gray-500">
                              {" "}
                              · Plug {sesi.plug} · {sesi.jam_mulai}–
                              {sesi.jam_selesai}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
