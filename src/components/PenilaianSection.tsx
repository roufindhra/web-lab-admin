import { useEffect, useState } from "react";
import {
  praktikumService,
  kurikulumService,
  ApiError,
  type KurikulumMateri,
  type Pertemuan,
  type PertemuanPayload,
  type ParameterPenilaian,
} from "@/services";
import { Button } from "@/components/ui/Buttons";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface FormState {
  nomor: string;
  materi: string;
  tanggal: string;
  bobot: string;
  parameter: { nama: string; bobot: string }[];
}

const EMPTY_FORM: FormState = {
  nomor: "",
  materi: "",
  tanggal: "",
  bobot: "1",
  parameter: [{ nama: "", bobot: "" }],
};

export default function PenilaianSection({
  slug,
  pertemuan,
  onChanged,
}: {
  slug: string;
  pertemuan: Pertemuan[];
  onChanged: () => void;
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [materiList, setMateriList] = useState<KurikulumMateri[]>([]);
  const [isLoadingMateri, setIsLoadingMateri] = useState(false);

  const totalBobot = form.parameter.reduce(
    (sum, p) => sum + (Number(p.bobot) || 0),
    0,
  );

  useEffect(() => {
    setIsLoadingMateri(true);
    kurikulumService
      .getAll(slug)
      .then(setMateriList)
      .catch(() => setMateriList([]))
      .finally(() => setIsLoadingMateri(false));
  }, [slug]);

  const materiOptions = materiList.filter(
    (m) => m.is_active || (editingId !== null && m.id === Number(form.materi)),
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, nomor: String(pertemuan.length + 1) });
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (item: Pertemuan) => {
    setEditingId(item.id);
    setForm({
      nomor: String(item.nomor),
      materi: item.materi ? String(item.materi.id) : "",
      tanggal: item.tanggal ?? "",
      bobot: String(item.bobot),
      parameter: item.parameter.map((p) => ({
        nama: p.nama,
        bobot: String(p.bobot),
      })),
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSave = () => {
    setIsSaving(true);
    setFormError(null);

    const parameter: ParameterPenilaian[] = form.parameter
      .filter((p) => p.nama.trim() !== "")
      .map((p) => ({ nama: p.nama.trim(), bobot: Number(p.bobot) }));

    const payload: PertemuanPayload = {
      nomor: Number(form.nomor),
      materi_id: Number(form.materi),
      tanggal: form.tanggal || null,
      bobot: Number(form.bobot),
      parameter,
    };
    const request =
      editingId === null
        ? praktikumService.createPertemuan(slug, payload)
        : praktikumService.updatePertemuan(slug, editingId, payload);

    request
      .then(() => {
        setIsFormOpen(false);
        onChanged();
      })
      .catch((err) => {
        setFormError(
          err instanceof ApiError ? err.message : "Gagal menyimpan pertemuan.",
        );
      })
      .finally(() => setIsSaving(false));
  };

  const handleDelete = (item: Pertemuan) => {
    if (
      !window.confirm(
        `Hapus pertemuan ${item.nomor}? Nilai yang sudah diinput juga akan terhapus.`,
      )
    ) {
      return;
    }

    setDeletingId(item.id);

    praktikumService
      .destroyPertemuan(slug, item.id)
      .then(() => onChanged())
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Gagal menghapus pertemuan.",
        );
      })
      .finally(() => setDeletingId(null));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-(--md-sys-color-on-surface)">
          Rule Penilaian (Pertemuan)
        </h2>
        <Button variant="filled" size="sm" onClick={openCreate}>
          + Tambah Pertemuan
        </Button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Card variant="outlined" className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-low) text-xs uppercase text-(--md-sys-color-on-surface-variant)">
            <tr>
              <th className="px-4 py-3">No.</th>
              <th className="px-4 py-3">Materi</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Bobot</th>
              <th className="px-4 py-3">Parameter</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--md-sys-color-outline-variant) text-(--md-sys-color-on-surface)">
            {pertemuan.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-(--md-sys-color-on-surface-variant)"
                >
                  Belum ada rule penilaian. Tambahkan pertemuan untuk mulai
                  menilai.
                </td>
              </tr>
            ) : (
              pertemuan.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-(--md-sys-color-surface-container-high) transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{item.nomor}</td>
                  <td className="px-4 py-3">
                    {item.materi ? (
                      <span>
                        <span className="mr-1.5 font-mono text-xs text-(--md-sys-color-on-surface-variant)">
                          M{item.materi.materi_id}
                        </span>
                        {item.materi.materi_nama}
                      </span>
                    ) : (
                      <span className="text-(--md-sys-color-on-surface-variant) opacity-50">
                        -
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.tanggal ?? (
                      <span className="text-(--md-sys-color-on-surface-variant) opacity-50">
                        -
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{item.bobot}%</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.parameter.map((p) => (
                        <span
                          key={p.nama}
                          className="rounded-full bg-(--md-sys-color-surface-container) px-2 py-0.5 text-xs text-(--md-sys-color-on-surface-variant)"
                        >
                          {p.nama} {p.bobot}%
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outlined"
                        size="sm"
                        onClick={() => openEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        size="sm"
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item.id}
                        className="border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        {deletingId === item.id ? "Menghapus..." : "Hapus"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={
          editingId === null
            ? "Tambah Pertemuan"
            : `Edit Pertemuan ${form.nomor}`
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Nomor"
              type="number"
              min={1}
              value={form.nomor}
              onChange={(event) =>
                setForm((c) => ({ ...c, nomor: event.target.value }))
              }
            />
            <Input
              label="Bobot (%)"
              type="number"
              min={1}
              max={100}
              value={form.bobot}
              onChange={(event) =>
                setForm((c) => ({ ...c, bobot: event.target.value }))
              }
            />
            <Input
              label="Tanggal"
              type="date"
              value={form.tanggal}
              onChange={(event) =>
                setForm((c) => ({ ...c, tanggal: event.target.value }))
              }
            />
          </div>

          <div>
            {materiOptions.length === 0 ? (
              <p className="text-xs text-red-500">
                Belum ada materi aktif di kurikulum praktikum ini. Deklarasikan
                materi terlebih dulu di menu Kurikulum.
              </p>
            ) : (
              <Select
                label="Materi Kurikulum"
                value={form.materi}
                disabled={isLoadingMateri}
                onValueChange={(val) => setForm((c) => ({ ...c, materi: val }))}
                options={[
                  {
                    value: "",
                    label: isLoadingMateri
                      ? "Memuat materi..."
                      : "Pilih materi...",
                  },
                  ...materiOptions.map((m) => ({
                    value: String(m.id),
                    label: `${m.materi_id}. ${m.materi_nama}`,
                  })),
                ]}
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-(--md-sys-color-on-surface)">
                Parameter &amp; Bobot
              </label>
              <Button
                type="button"
                variant="outlined"
                size="sm"
                onClick={() =>
                  setForm((c) => ({
                    ...c,
                    parameter: [...c.parameter, { nama: "", bobot: "" }],
                  }))
                }
              >
                + Tambah Parameter
              </Button>
            </div>

            <div className="space-y-2">
              {form.parameter.map((param, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={param.nama}
                    onChange={(event) =>
                      setForm((c) => ({
                        ...c,
                        parameter: c.parameter.map((p, i) =>
                          i === index ? { ...p, nama: event.target.value } : p,
                        ),
                      }))
                    }
                    placeholder="mis. kehadiran"
                    containerClassName="flex-1"
                  />
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={param.bobot}
                    onChange={(event) =>
                      setForm((c) => ({
                        ...c,
                        parameter: c.parameter.map((p, i) =>
                          i === index ? { ...p, bobot: event.target.value } : p,
                        ),
                      }))
                    }
                    placeholder="%"
                    containerClassName="w-20"
                  />
                  <Button
                    type="button"
                    variant="text"
                    size="sm"
                    onClick={() =>
                      setForm((c) => ({
                        ...c,
                        parameter: c.parameter.filter((_, i) => i !== index),
                      }))
                    }
                    className="text-red-600 dark:text-red-400 hover:underline px-2 py-1"
                    aria-label={`Hapus parameter baris ${index + 1}`}
                  >
                    Hapus
                  </Button>
                </div>
              ))}
            </div>

            <p
              className={`text-xs font-semibold ${
                totalBobot === 100
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-500"
              }`}
            >
              Total bobot parameter: {totalBobot} / 100
            </p>
          </div>

          {formError && <p className="text-xs text-red-500">{formError}</p>}

          <div className="pt-2 flex justify-end gap-2">
            <Button
              variant="outlined"
              onClick={() => setIsFormOpen(false)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              variant="filled"
              onClick={handleSave}
              disabled={
                !form.materi ||
                !form.nomor ||
                !form.bobot ||
                form.parameter.some((p) => !p.nama || !p.bobot) ||
                totalBobot !== 100 ||
                isSaving
              }
            >
              {isSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
