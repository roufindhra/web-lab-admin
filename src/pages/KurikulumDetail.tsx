import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  kurikulumService,
  praktikumService,
  ApiError,
  type KurikulumMateri,
  type Praktikum,
} from "@/services";
import MateriFormModal from "../components/modals/MateriFormModal";
import { Button } from "@/components/ui/Buttons";
import { Card } from "@/components/ui/Card";

export default function KurikulumDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [praktikum, setPraktikum] = useState<Praktikum | null>(null);
  const [materiList, setMateriList] = useState<KurikulumMateri[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMateri, setEditingMateri] = useState<KurikulumMateri | null>(
    null,
  );

  const refresh = useCallback(async () => {
    if (!slug) return;
    try {
      const data = await kurikulumService.getAll(slug);
      setMateriList(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal memuat kurikulum.",
      );
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      praktikumService.getBySlug(slug),
      kurikulumService.getAll(slug),
    ])
      .then(([praktikumData, materiData]) => {
        setPraktikum(praktikumData);
        setMateriList(materiData);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Gagal memuat data."),
      )
      .finally(() => setIsLoading(false));
  }, [slug]);

  const handleArsipkan = async (materi: KurikulumMateri) => {
    if (!slug) return;
    try {
      await kurikulumService.destroy(slug, materi.id);
      await refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal mengarsipkan materi.",
      );
    }
  };

  const handlePulihkan = async (materi: KurikulumMateri) => {
    if (!slug) return;
    try {
      await kurikulumService.restore(slug, materi.id);
      await refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal memulihkan materi.",
      );
    }
  };

  const materiAktif = materiList.filter((m) => m.is_active);
  const materiArsip = materiList.filter((m) => !m.is_active);

  if (isLoading) {
    return (
      <div className="text-sm text-(--md-sys-color-on-surface-variant)">
        Memuat...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-(--md-sys-color-on-surface)">
            {praktikum?.label ?? "Kurikulum"}
          </h1>
          <p className="mt-1 text-sm text-(--md-sys-color-on-surface-variant)">
            Susunan materi yang akan diajarkan.
          </p>
        </div>
        <Button
          variant="filled"
          onClick={() => {
            setEditingMateri(null);
            setModalOpen(true);
          }}
        >
          + Tambah Materi
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-(--md-sys-color-on-surface-variant)">
          Materi Aktif ({materiAktif.length})
        </h2>
        <Card variant="outlined" className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-low) text-xs uppercase text-(--md-sys-color-on-surface-variant)">
              <tr>
                <th className="px-4 py-3">No.</th>
                <th className="px-4 py-3">Materi</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--md-sys-color-outline-variant) text-(--md-sys-color-on-surface)">
              {materiAktif.map((materi) => (
                <tr
                  key={materi.id}
                  className="hover:bg-(--md-sys-color-surface-container-high) transition-colors"
                >
                  <td className="px-4 py-3 text-(--md-sys-color-on-surface-variant)">
                    {materi.materi_id}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {materi.materi_nama}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => {
                          setEditingMateri(materi);
                          setModalOpen(true);
                        }}
                        className="hover:underline px-2 py-1"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => void handleArsipkan(materi)}
                        className="text-red-600 dark:text-red-400 hover:underline px-2 py-1"
                      >
                        Arsipkan
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {materiAktif.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-(--md-sys-color-on-surface-variant)"
                  >
                    Belum ada materi. Klik "Tambah Materi" untuk menyusun
                    kurikulum.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {materiArsip.length > 0 && (
        <div className="space-y-2 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-(--md-sys-color-on-surface-variant)">
            Arsip ({materiArsip.length})
          </h2>
          <Card variant="outlined" className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-(--md-sys-color-outline-variant) text-(--md-sys-color-on-surface)">
                {materiArsip.map((materi) => (
                  <tr
                    key={materi.id}
                    className="bg-(--md-sys-color-surface-container-low)/50 hover:bg-(--md-sys-color-surface-container-high) transition-colors"
                  >
                    <td className="px-4 py-3 text-(--md-sys-color-on-surface-variant) opacity-60">
                      {materi.materi_id}
                    </td>
                    <td className="px-4 py-3 text-(--md-sys-color-on-surface-variant) line-through">
                      {materi.materi_nama}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => void handlePulihkan(materi)}
                        className="hover:underline px-2 py-1"
                      >
                        Pulihkan
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {modalOpen && slug && (
        <MateriFormModal
          slug={slug}
          materi={editingMateri}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            void refresh();
          }}
        />
      )}
    </div>
  );
}
