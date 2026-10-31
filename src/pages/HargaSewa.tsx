import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  hargaSewaService,
  type AlatListMeta,
  type HargaSewa,
} from "@/services";
import { Button } from "@/components/ui/Buttons";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";

interface FormState {
  nama_alat: string;
  tarif_per_hari: string;
}

const EMPTY_FORM: FormState = { nama_alat: "", tarif_per_hari: "" };

const formatTarif = (tarif: string) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(tarif));

export default function HargaSewaPage() {
  const [hargaList, setHargaList] = useState<HargaSewa[]>([]);
  const [meta, setMeta] = useState<AlatListMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HargaSewa | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HargaSewa | null>(null);

  const loadHarga = useCallback(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    hargaSewaService
      .getAll({ page })
      .then((response) => {
        if (cancelled) return;
        setHargaList(response.data);
        setMeta(response.meta);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Gagal memuat daftar harga sewa.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  useEffect(() => loadHarga(), [loadHarga]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (harga: HargaSewa) => {
    setEditTarget(harga);
    setForm({
      nama_alat: harga.nama_alat,
      tarif_per_hari: harga.tarif_per_hari,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setFormError(null);
    try {
      const payload = {
        nama_alat: form.nama_alat.trim(),
        tarif_per_hari: Number(form.tarif_per_hari),
      };
      if (editTarget) {
        await hargaSewaService.update(editTarget.id, payload);
      } else {
        await hargaSewaService.create(payload);
      }
      setIsFormOpen(false);
      loadHarga();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Terjadi kesalahan.",
      );
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || isSaving) return;
    setIsSaving(true);
    setFormError(null);
    try {
      await hargaSewaService.remove(deleteTarget.id);
      setDeleteTarget(null);
      loadHarga();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
      setDeleteTarget(null);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid =
    form.nama_alat.trim() !== "" &&
    Number(form.tarif_per_hari) >= 0 &&
    form.tarif_per_hari !== "";

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-(--md-sys-color-on-surface)">
            Harga Sewa
          </h1>
          <p className="mt-1 text-sm text-(--md-sys-color-on-surface-variant)">
            Daftar tarif sewa per hari. Alat dengan harga di sini yang muncul di
            halaman sewa publik.
          </p>
        </div>
        <Button variant="filled" onClick={openCreate}>
          + Tambah Harga
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Card variant="outlined" className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-low) text-xs uppercase text-(--md-sys-color-on-surface-variant)">
            <tr>
              <th className="px-4 py-3">Nama Alat</th>
              <th className="px-4 py-3">Tarif per Hari</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--md-sys-color-outline-variant) text-(--md-sys-color-on-surface)">
            {isLoading ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-12 text-center text-(--md-sys-color-on-surface-variant)"
                >
                  Memuat...
                </td>
              </tr>
            ) : hargaList.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-12 text-center text-(--md-sys-color-on-surface-variant)"
                >
                  Belum ada daftar harga sewa.
                </td>
              </tr>
            ) : (
              hargaList.map((harga) => (
                <tr
                  key={harga.id}
                  className="hover:bg-(--md-sys-color-surface-container-high) transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{harga.nama_alat}</td>
                  <td className="px-4 py-3 text-(--md-sys-color-on-surface-variant)">
                    {formatTarif(harga.tarif_per_hari)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => openEdit(harga)}
                        className="hover:underline px-2 py-1"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => setDeleteTarget(harga)}
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

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm text-(--md-sys-color-on-surface-variant)">
          <Button
            variant="outlined"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Sebelumnya
          </Button>
          <span>
            Halaman {meta.current_page} / {meta.last_page}
          </span>
          <Button
            variant="outlined"
            size="sm"
            disabled={page >= meta.last_page}
            onClick={() => setPage(page + 1)}
          >
            Berikutnya
          </Button>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editTarget ? "Edit Harga Sewa" : "Tambah Harga Sewa"}
      >
        <div className="space-y-4">
          {formError && <p className="text-sm text-red-500">{formError}</p>}

          <Input
            label="Nama Alat"
            id="nama-alat"
            value={form.nama_alat}
            onChange={(event) =>
              setForm({ ...form, nama_alat: event.target.value })
            }
            placeholder="Harus sama dengan nama grup alat, mis. Total Station"
          />

          <Input
            label="Tarif per Hari (Rp)"
            id="tarif"
            type="number"
            min={0}
            value={form.tarif_per_hari}
            onChange={(event) =>
              setForm({ ...form, tarif_per_hari: event.target.value })
            }
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outlined" onClick={() => setIsFormOpen(false)}>
              Batal
            </Button>
            <Button
              variant="filled"
              onClick={() => void handleSave()}
              disabled={!isFormValid || isSaving}
            >
              {isSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Harga Sewa"
      >
        <div className="space-y-4">
          <p className="text-sm text-(--md-sys-color-on-surface-variant)">
            Hapus tarif untuk{" "}
            <span className="font-medium text-(--md-sys-color-on-surface)">
              {deleteTarget?.nama_alat}
            </span>
            ? Alat ini tidak akan lagi muncul di halaman sewa publik.
          </p>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outlined" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button
              variant="filled"
              onClick={() => void handleDelete()}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSaving ? "Menghapus..." : "Hapus"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
