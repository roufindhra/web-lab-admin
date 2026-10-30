import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { dashboardService, ApiError, type DashboardStats } from "@/services";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { Card } from "@/components/ui/Card";

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
    <div className="w-full space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-(--md-sys-color-on-surface)">
        Dashboard Admin
      </h1>

      {/* Profil Pengguna Card */}
      {user && (
        <Card variant="outlined">
          <p className="text-xl font-bold text-(--md-sys-color-on-surface)">
            {user.nama}
          </p>
          <p className="mt-1 text-sm font-medium text-(--md-sys-color-on-surface-variant)">
            {user.nip ? `NIP: ${user.nip}` : `NIM: ${user.nim}`} · Role:{" "}
            <span className="font-semibold capitalize text-(--md-sys-color-primary)">
              {user.role}
            </span>
          </p>
        </Card>
      )}

      {isLoading && <DashboardSkeleton />}
      {error && <p className="text-sm font-semibold text-red-500">{error}</p>}

      {!isLoading && stats && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* CARD 1: Pengajuan Menunggu Persetujuan */}
          <Link to="/alat-peminjaman" className="block">
            <Card
              variant="outlined"
              className="flex h-80 flex-col transition-all hover:border-(--md-sys-color-primary) hover:shadow-md"
            >
              <h2 className="shrink-0 text-xl font-bold text-(--md-sys-color-on-surface)">
                Pengajuan Menunggu Persetujuan
              </h2>

              {stats.pending.items.length > 0 ? (
                <ul className="mt-3 flex-1 space-y-2.5 overflow-y-auto pr-1">
                  {stats.pending.items.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-high) p-2.5"
                    >
                      <p className="text-base font-bold text-(--md-sys-color-on-surface)">
                        {item.nama}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-(--md-sys-color-on-surface-variant)">
                        {item.keperluan_label}
                        {item.alat.length > 0 &&
                          ` · ${item.alat.map((a) => a.nama_alat).join(", ")}`}
                      </p>
                    </li>
                  ))}
                  {stats.pending.total > stats.pending.items.length && (
                    <li className="pt-1 text-xs font-bold text-(--md-sys-color-primary)">
                      +{stats.pending.total - stats.pending.items.length}{" "}
                      pengajuan lainnya
                    </li>
                  )}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-(--md-sys-color-on-surface-variant)">
                  Tidak ada pengajuan yang menunggu persetujuan.
                </p>
              )}
            </Card>
          </Link>

          {/* CARD 2: Alat Sedang Keluar */}
          <Card variant="outlined" className="flex h-80 flex-col">
            <h2 className="shrink-0 text-xl font-bold text-(--md-sys-color-on-surface)">
              Alat Sedang Keluar
            </h2>

            {stats.alat_keluar.items && stats.alat_keluar.items.length > 0 ? (
              <ul className="mt-3 flex-1 space-y-2.5 overflow-y-auto pr-1">
                {stats.alat_keluar.items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-high) p-2.5"
                  >
                    <p className="text-base font-bold text-(--md-sys-color-on-surface)">
                      {item.nama}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-(--md-sys-color-on-surface-variant)">
                      {item.alat
                        .map((a) => `${a.nama_alat} (${a.jumlah}x)`)
                        .join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-(--md-sys-color-on-surface-variant)">
                Tidak ada alat yang sedang keluar.
              </p>
            )}
          </Card>

          {/* CARD 3: Jadwal Praktikum 8 Hari ke Depan */}
          <Card variant="outlined" className="flex h-80 flex-col">
            <h2 className="shrink-0 text-xl font-bold text-(--md-sys-color-on-surface)">
              Jadwal Praktikum 8 Hari ke Depan
            </h2>

            <ul className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
              {stats.jadwal_mendatang.map((hari, index) => (
                <li key={hari.tanggal}>
                  <p
                    className={`text-xs font-bold uppercase tracking-wider ${
                      index === 0
                        ? "text-(--md-sys-color-primary)"
                        : "text-(--md-sys-color-on-surface-variant)"
                    }`}
                  >
                    {index === 0 ? "Hari Ini" : hari.hari} ·{" "}
                    {formatTanggal(hari.tanggal)}
                  </p>

                  {hari.sesi.length === 0 ? (
                    <p className="mt-0.5 text-xs text-(--md-sys-color-on-surface-variant) opacity-70">
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
                            className="block rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-high) p-2 text-xs transition-colors hover:border-(--md-sys-color-primary)"
                          >
                            <span className="font-bold text-(--md-sys-color-on-surface)">
                              {sesi.praktikum}
                            </span>
                            <span className="mt-0.5 block text-xs text-(--md-sys-color-on-surface-variant)">
                              Plug {sesi.plug} ({sesi.jam_mulai}–
                              {sesi.jam_selesai})
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
