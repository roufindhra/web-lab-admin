import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Buttons";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  ApiError,
  KONDISI_STATUSES,
  peminjamanService,
  type KondisiCatatan,
  type KondisiEntry,
  type KondisiStatus,
  type Peminjaman,
  type PeminjamanItem,
} from "@/services";

const KONDISI_LABELS: Record<KondisiStatus, string> = {
  baik: "Baik",
  rusak_ringan: "Rusak Ringan",
  rusak_berat: "Rusak Berat",
  maintenance: "Maintenance",
};

const KETERSEDIAAN_OPTIONS = [
  { value: "tersedia", label: "Tersedia" },
  { value: "perbaikan", label: "Perbaikan" },
] as const;

type KetersediaanPilihan = (typeof KETERSEDIAAN_OPTIONS)[number]["value"];

interface EntryDraft {
  status: KondisiStatus;
  jumlah: string;
  catatan: KondisiCatatan[];
}

interface ItemDraft {
  peminjaman_alat_id: number;
  item: PeminjamanItem;
  entries: EntryDraft[];
  ketersediaan: KetersediaanPilihan;
}

interface KembalikanModalProps {
  peminjaman: Peminjaman;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function draftFromItem(item: PeminjamanItem): ItemDraft {
  return {
    peminjaman_alat_id: item.id,
    item,
    entries:
      item.kondisi.length > 0
        ? item.kondisi.map((entry) => ({
            status: entry.status,
            jumlah: String(entry.jumlah),
            catatan: entry.catatan.map((catatan) => ({ ...catatan })),
          }))
        : [{ status: "baik", jumlah: String(item.jumlah_alat), catatan: [] }],
    ketersediaan: item.ketersediaan === "perbaikan" ? "perbaikan" : "tersedia",
  };
}

export default function KembalikanModal({
  peminjaman,
  isOpen = true,
  onClose,
  onSuccess,
}: KembalikanModalProps) {
  const [drafts, setDrafts] = useState<ItemDraft[]>(() =>
    peminjaman.items.map(draftFromItem),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setDraftsState = (updater: (current: ItemDraft[]) => ItemDraft[]) => {
    setDrafts(updater);
  };

  const updateEntry = (
    itemIndex: number,
    entryIndex: number,
    patch: Partial<EntryDraft>,
  ) => {
    setDraftsState((current) =>
      current.map((draft, i) =>
        i === itemIndex
          ? {
              ...draft,
              entries: draft.entries.map((entry, j) =>
                j === entryIndex ? { ...entry, ...patch } : entry,
              ),
            }
          : draft,
      ),
    );
  };

  const addEntry = (itemIndex: number) => {
    setDraftsState((current) =>
      current.map((draft, i) =>
        i === itemIndex
          ? {
              ...draft,
              entries: [
                ...draft.entries,
                { status: "baik", jumlah: "", catatan: [] },
              ],
            }
          : draft,
      ),
    );
  };

  const removeEntry = (itemIndex: number, entryIndex: number) => {
    setDraftsState((current) =>
      current.map((draft, i) =>
        i === itemIndex
          ? {
              ...draft,
              entries: draft.entries.filter((_, j) => j !== entryIndex),
            }
          : draft,
      ),
    );
  };

  const updateCatatan = (
    itemIndex: number,
    entryIndex: number,
    catatanIndex: number,
    patch: Partial<KondisiCatatan>,
  ) => {
    setDraftsState((current) =>
      current.map((draft, i) =>
        i === itemIndex
          ? {
              ...draft,
              entries: draft.entries.map((entry, j) =>
                j === entryIndex
                  ? {
                      ...entry,
                      catatan: entry.catatan.map((catatan, k) =>
                        k === catatanIndex ? { ...catatan, ...patch } : catatan,
                      ),
                    }
                  : entry,
              ),
            }
          : draft,
      ),
    );
  };

  const addCatatan = (itemIndex: number, entryIndex: number) => {
    setDraftsState((current) =>
      current.map((draft, i) =>
        i === itemIndex
          ? {
              ...draft,
              entries: draft.entries.map((entry, j) =>
                j === entryIndex
                  ? {
                      ...entry,
                      catatan: [
                        ...entry.catatan,
                        { komponen: "", keterangan: "" },
                      ],
                    }
                  : entry,
              ),
            }
          : draft,
      ),
    );
  };

  const removeCatatan = (
    itemIndex: number,
    entryIndex: number,
    catatanIndex: number,
  ) => {
    setDraftsState((current) =>
      current.map((draft, i) =>
        i === itemIndex
          ? {
              ...draft,
              entries: draft.entries.map((entry, j) =>
                j === entryIndex
                  ? {
                      ...entry,
                      catatan: entry.catatan.filter(
                        (_, k) => k !== catatanIndex,
                      ),
                    }
                  : entry,
              ),
            }
          : draft,
      ),
    );
  };

  const itemTotals = drafts.map((draft) =>
    draft.entries.reduce((sum, entry) => sum + (Number(entry.jumlah) || 0), 0),
  );
  const isFormValid = drafts.every((draft, i) => {
    const totalMatch = itemTotals[i] === draft.item.jumlah_alat;
    const entriesValid = draft.entries.every(
      (entry) => Number(entry.jumlah) >= 1,
    );
    return totalMatch && entriesValid;
  });

  const handleSubmit = async () => {
    if (!isFormValid || isSaving) return;

    const payload = {
      items: drafts.map((draft) => ({
        peminjaman_alat_id: draft.peminjaman_alat_id,
        kondisi: draft.entries.map(
          (entry): KondisiEntry => ({
            status: entry.status,
            jumlah: Number(entry.jumlah),
            catatan: entry.catatan.filter(
              (catatan) =>
                catatan.komponen.trim() !== "" &&
                catatan.keterangan.trim() !== "",
            ),
          }),
        ),
        ketersediaan: draft.ketersediaan,
      })),
    };

    setIsSaving(true);
    setError(null);
    try {
      await peminjamanService.kembalikan(peminjaman.id, payload);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Pengecekan Pengembalian Alat"
      className="max-w-2xl"
    >
      <div className="space-y-4">
        <p className="text-sm text-(--md-sys-color-on-surface-variant) leading-relaxed">
          Periksa kondisi alat dari{" "}
          <span className="font-semibold text-(--md-sys-color-on-surface)">
            {peminjaman.nama}
          </span>{" "}
          (<span className="font-mono text-xs">{peminjaman.nim}</span>),
          perbarui bila ada kerusakan, lalu tentukan ketersediaannya.
        </p>

        <div className="space-y-4">
          {drafts.map((draft, itemIndex) => {
            const totalMatch = itemTotals[itemIndex] === draft.item.jumlah_alat;

            return (
              <div
                key={draft.peminjaman_alat_id}
                className="space-y-3 rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-high) p-3.5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-(--md-sys-color-outline-variant) pb-2">
                  <p className="text-sm font-semibold text-(--md-sys-color-on-surface)">
                    <span className="font-mono text-xs opacity-70">
                      [{draft.item.inventaris}]
                    </span>{" "}
                    {draft.item.nama_alat ?? "-"}
                  </p>
                  <p className="text-xs font-medium text-(--md-sys-color-on-surface-variant)">
                    Jumlah Dipinjam: {draft.item.jumlah_alat} Unit
                  </p>
                </div>

                <div className="space-y-2">
                  {draft.entries.map((entry, entryIndex) => (
                    <div
                      key={entryIndex}
                      className="space-y-2 rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline) bg-(--md-sys-color-surface) p-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Select
                            options={KONDISI_STATUSES.map((status) => ({
                              value: status,
                              label: KONDISI_LABELS[status],
                            }))}
                            value={entry.status}
                            onValueChange={(val) =>
                              updateEntry(itemIndex, entryIndex, {
                                status: val as KondisiStatus,
                              })
                            }
                          />
                        </div>

                        <Input
                          type="number"
                          min={1}
                          value={entry.jumlah}
                          onChange={(e) =>
                            updateEntry(itemIndex, entryIndex, {
                              jumlah: e.target.value,
                            })
                          }
                          placeholder="Jumlah"
                          className="w-24 text-xs"
                        />

                        {draft.entries.length > 1 && (
                          <Button
                            type="button"
                            variant="text"
                            onClick={() => removeEntry(itemIndex, entryIndex)}
                            className="px-2 text-xs text-red-600 hover:bg-red-500/10"
                          >
                            Hapus
                          </Button>
                        )}
                      </div>

                      {entry.catatan.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {entry.catatan.map((catatan, catatanIndex) => (
                            <div
                              key={catatanIndex}
                              className="flex w-full items-center gap-2"
                            >
                              <Input
                                value={catatan.komponen}
                                onChange={(e) =>
                                  updateCatatan(
                                    itemIndex,
                                    entryIndex,
                                    catatanIndex,
                                    { komponen: e.target.value },
                                  )
                                }
                                placeholder="Komponen"
                                className="w-32 shrink-0 text-xs"
                              />
                              <Input
                                value={catatan.keterangan}
                                onChange={(e) =>
                                  updateCatatan(
                                    itemIndex,
                                    entryIndex,
                                    catatanIndex,
                                    { keterangan: e.target.value },
                                  )
                                }
                                placeholder="Keterangan kerusakan"
                                className="flex-1 min-w-0 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  removeCatatan(
                                    itemIndex,
                                    entryIndex,
                                    catatanIndex,
                                  )
                                }
                                className="px-1 text-base font-bold text-red-600 hover:text-red-700"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="text"
                        onClick={() => addCatatan(itemIndex, entryIndex)}
                        className="px-0 text-[11px] underline"
                      >
                        + Tambah Catatan Komponen
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => addEntry(itemIndex)}
                    className="px-3 py-1 text-xs"
                  >
                    + Kelompok Kondisi
                  </Button>

                  <p
                    className={`text-xs font-semibold ${
                      totalMatch
                        ? "text-(--md-sys-color-on-surface-variant)"
                        : "text-red-600"
                    }`}
                  >
                    Total kondisi: {itemTotals[itemIndex]} /{" "}
                    {draft.item.jumlah_alat} Unit
                  </p>
                </div>

                <Select
                  label="Ketersediaan Alat Setelah Pengecekan"
                  options={KETERSEDIAAN_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  value={draft.ketersediaan}
                  onValueChange={(val) =>
                    setDraftsState((current) =>
                      current.map((d, i) =>
                        i === itemIndex
                          ? {
                              ...d,
                              ketersediaan: val as KetersediaanPilihan,
                            }
                          : d,
                      ),
                    )
                  }
                />
              </div>
            );
          })}
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-(--md-sys-color-outline-variant) pt-3">
          <Button
            type="button"
            variant="outlined"
            onClick={onClose}
            disabled={isSaving}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="filled"
            onClick={() => void handleSubmit()}
            disabled={!isFormValid || isSaving}
          >
            {isSaving ? "Memproses..." : "Konfirmasi Pengembalian"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
