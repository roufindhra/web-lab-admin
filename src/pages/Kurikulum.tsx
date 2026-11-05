import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { praktikumService, type Praktikum } from "@/services";
import { Card } from "@/components/ui/Card";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useLocation } from "react-router-dom";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const KURIKULUM_STORAGE_KEY = "sudah_lihat_walkthrough_kurikulum";

export default function Kurikulum() {
  const [praktikumList, setPraktikumList] = useState<Praktikum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const location = useLocation();

  useEffect(() => {
    praktikumService
      .getAll()
      .then(setPraktikumList)
      .catch(() => setError("Gagal memuat daftar praktikum."))
      .finally(() => setIsLoading(false));
  }, []);

  // driver.js buat walkthrough

  useEffect(() => {
    if (!user || location.pathname !== "/kurikulum") return;

    const hasSeenTour = localStorage.getItem(KURIKULUM_STORAGE_KEY);
    if (hasSeenTour === "true") return;

    const driverObj = driver({
      showProgress: false,
      onDestroyStarted: () => {
        localStorage.setItem(KURIKULUM_STORAGE_KEY, "true");
        driverObj.destroy();
      },
      steps: [
        {
          popover: {
            title: "Kurikulum Laboratorium SGG",
            description: "Kelola susunan materi praktikum yang akan diajarkan.",
          },
        },
        {
          element: "#daftar-materi",
          popover: {
            title: "Lihat Daftar Materi Praktikum",
            description: "Ketuk praktikum untuk melihat daftar materi.",
            side: "right",
            align: "start",
          },
        },
      ],
    });

    const timer = setTimeout(() => {
      driverObj.drive();
    }, 100);

    return () => {
      clearTimeout(timer);
      driverObj.destroy();
    };
  }, [location.pathname, user]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-(--md-sys-color-on-surface)">
          Kurikulum
        </h1>
        <p className="mt-1 text-sm text-(--md-sys-color-on-surface-variant)">
          Pilih praktikum untuk mengelola susunan materi yang akan diajarkan.
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {isLoading && (
        <p className="text-sm text-(--md-sys-color-on-surface-variant)">
          Memuat...
        </p>
      )}

      <div
        id="daftar-materi"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {praktikumList.map((praktikum) => (
          <button
            key={praktikum.id}
            type="button"
            onClick={() => navigate(`/kurikulum/${praktikum.slug}`)}
            className="w-full text-left transition-transform active:scale-[0.99]"
          >
            <Card
              variant="outlined"
              className="h-full transition-all hover:border-(--md-sys-color-primary) hover:shadow-md cursor-pointer"
            >
              <h2 className="font-semibold text-(--md-sys-color-on-surface)">
                {praktikum.label}
              </h2>
              <span className="mt-3 inline-block rounded-full bg-(--md-sys-color-surface-container-high) px-2.5 py-0.5 text-xs font-medium text-(--md-sys-color-on-surface-variant)">
                Semester {praktikum.semester}
              </span>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
