import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Buttons";
import { Input } from "@/components/ui/Input";
import {
  alatService,
  ApiError,
  KONDISI_STATUSES,
  KETERSEDIAAN_STATUSES,
  type Alat,
  type KondisiCatatan,
  type KondisiEntry,
  type KondisiStatus,
  type KetersediaanStatus,
} from "@/services";

const KONDISI_LABELS: Record<KondisiStatus, string> = {
  baik: "Baik",
  rusak_ringan: "Rusak Ringan",
  rusak_berat: "Rusak Berat",
  maintenance: "Maintenance",
};

const KETERSEDIAAN_LABELS: Record<KetersediaanStatus, string> = {
  tersedia: "Tersedia",
  dipinjam: "Dipinjam",
  perbaikan: "Perbaikan",
};

interface EntryDraft {
  status: KondisiStatus;
  jumlah: string;
  catatan: { komponen: string; keterangan: string }[];
}

interface AlatFormModalProps {
  alat?: Alat | null;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function draftFromAlat(alat: Alat | null | undefined): EntryDraft[] {
  if (!alat) {
    return [{ status: "baik", jumlah: "", catatan: [] }];
  }
  return alat.kondisi.map((entry) => ({
    status: entry.status,
    jumlah: String(entry.jumlah),
    catatan: entry.catatan.map((catatan) => ({ ...catatan })),
  }));
}

export default function AlatFormModal({
  alat,
  isOpen = true,
  onClose,
  onSuccess,
}: AlatFormModalProps) {
  const [inventaris, setInventaris] = useState(alat?.inventaris ?? "");
  const [namaAlat, setNamaAlat] = useState(alat?.nama_alat ?? "");
  const [merk, setMerk] = useState(alat?.merk ?? "");
  const [tipe, setTipe] = useState(alat?.tipe ?? "");
  const [serialNumber, setSerialNumber] = useState(alat?.serial_number ?? "");
  const [lokasiPenyimpanan, setLokasiPenyimpanan] = useState(
    alat?.lokasi_penyimpanan ?? "",
  );
  const [jumlah, setJumlah] = useState(String(alat?.jumlah ?? ""));
  const [entries, setEntries] = useState<EntryDraft[]>(() =>
    draftFromAlat(alat),
  );
  const [ketersediaan, setKetersediaan] = useState<KetersediaanStatus>(
    alat?.ketersediaan ?? "tersedia",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jumlahValue = Number(jumlah);
  const totalKondisi = entries.reduce(
    (sum, entry) => sum + (Number(entry.jumlah) || 0),
    0,
  );
  const isJumlahValid =
    jumlah !== "" && Number.isInteger(jumlahValue) && jumlahValue >= 1;
  const isKondisiMatch = isJumlahValid && totalKondisi === jumlahValue;
  const isFormValid =
    inventaris.trim() !== "" &&
    namaAlat.trim() !== "" &&
    merk.trim() !== "" &&
    tipe.trim() !== "" &&
    serialNumber.trim() !== "" &&
    lokasiPenyimpanan.trim() !== "" &&
    isKondisiMatch &&
    entries.every((entry) => Number(entry.jumlah) >= 1);

  const setEntriesState = (
    updater: (current: EntryDraft[]) => EntryDraft[],
  ) => {
    setEntries(updater);
  };

  const updateEntry = (index: number, patch: Partial<EntryDraft>) => {
    setEntriesState((current) =>
      current.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    );
  };

  const addEntry = () => {
    setEntriesState((current) => [
      ...current,
      { status: "baik", jumlah: "", catatan: [] },
    ]);
  };

  const removeEntry = (index: number) => {
    setEntriesState((current) => current.filter((_, i) => i !== index));
  };

  const updateCatatan = (
    entryIndex: number,
    catatanIndex: number,
    patch: Partial<KondisiCatatan>,
  ) => {
    setEntriesState((current) =>
      current.map((entry, i) =>
        i === entryIndex
          ? {
              ...entry,
              catatan: entry.catatan.map((catatan, j) =>
                j === catatanIndex ? { ...catatan, ...patch } : catatan,
              ),
            }
          : entry,
      ),
    );
  };

  const addCatatan = (entryIndex: number) => {
    setEntriesState((current) =>
      current.map((entry, i) =>
        i === entryIndex
          ? {
              ...entry,
              catatan: [...entry.catatan, { komponen: "", keterangan: "" }],
            }
          : entry,
      ),
    );
  };

  const removeCatatan = (entryIndex: number, catatanIndex: number) => {
    setEntriesState((current) =>
      current.map((entry, i) =>
        i === entryIndex
          ? {
              ...entry,
              catatan: entry.catatan.filter((_, j) => j !== catatanIndex),
            }
          : entry,
      ),
    );
  };

  const handleSave = () => {
    if (!isFormValid) return;

    const payloadKondisi: KondisiEntry[] = entries.map((entry) => ({
      status: entry.status,
      jumlah: Number(entry.jumlah),
      catatan: entry.catatan.filter(
        (catatan) =>
          catatan.komponen.trim() !== "" && catatan.keterangan.trim() !== "",
      ),
    }));

    setIsSaving(true);
    setError(null);

    const payload = {
      inventaris: inventaris.trim(),
      nama_alat: namaAlat.trim(),
      merk: merk.trim(),
      tipe: tipe.trim(),
      serial_number: serialNumber.trim(),
      lokasi_penyimpanan: lokasiPenyimpanan.trim(),
      jumlah: jumlahValue,
      kondisi: payloadKondisi,
      ketersediaan,
    };

    const request = alat
      ? alatService.update(alat.id, payload)
      : alatService.create(payload);

    request
      .then(onSuccess)
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Gagal menyimpan data alat.",
        );
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={alat ? "Edit Data Alat" : "Tambah Inventaris Alat"}
    >
      <div className="space-y-4">
        <Input
          label="Kode Inventaris"
          value={inventaris}
          onChange={(e) => setInventaris(e.target.value)}
          placeholder="Misal: INV/SGG/2026/001"
        />

        <Input
          label="Nama Alat"
          value={namaAlat}
          onChange={(e) => setNamaAlat(e.target.value)}
          placeholder="Misal: Total Station Hi-Target"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Merk"
            value={merk}
            onChange={(e) => setMerk(e.target.value)}
            placeholder="Misal: Topcon / Leica"
          />
          <Input
            label="Tipe"
            value={tipe}
            onChange={(e) => setTipe(e.target.value)}
            placeholder="Misal: HTS-420R"
          />
        </div>

        <Input
          label="Serial Number"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          placeholder="Nomor Seri Perangkat"
        />

        <Input
          label="Lokasi Penyimpanan"
          value={lokasiPenyimpanan}
          onChange={(e) => setLokasiPenyimpanan(e.target.value)}
          placeholder="Misal: Lemari A3 Lab SGG"
        />

        <Input
          label="Total Jumlah Unit"
          type="number"
          min={1}
          value={jumlah}
          onChange={(e) => setJumlah(e.target.value)}
        />

        {/* --- KONDISI PER UNIT SECTION --- */}
        <div className="space-y-2 rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-high) p-3">
          <p className="text-xs font-semibold text-(--md-sys-color-on-surface)">
            Kondisi Per Unit
          </p>

          <div className="space-y-3">
            {entries.map((entry, entryIndex) => (
              <div
                key={entryIndex}
                className="space-y-2 rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline) bg-(--md-sys-color-surface) p-3"
              >
                <div className="flex items-center gap-2">
                  <select
                    value={entry.status}
                    onChange={(e) =>
                      updateEntry(entryIndex, {
                        status: e.target.value as KondisiStatus,
                      })
                    }
                    className="flex-1 rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline) bg-(--md-sys-color-surface) px-2.5 py-1.5 text-xs text-(--md-sys-color-on-surface) focus:outline-none focus:ring-1 focus:ring-(--md-sys-color-primary)"
                  >
                    {KONDISI_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {KONDISI_LABELS[status]}
                      </option>
                    ))}
                  </select>

                  <Input
                    type="number"
                    min={1}
                    value={entry.jumlah}
                    onChange={(e) =>
                      updateEntry(entryIndex, { jumlah: e.target.value })
                    }
                    placeholder="Jumlah"
                    className="w-24 text-xs"
                  />

                  {entries.length > 1 && (
                    <Button
                      type="button"
                      variant="text"
                      onClick={() => removeEntry(entryIndex)}
                      className="px-2 text-xs text-red-600 hover:bg-red-50"
                    >
                      Hapus
                    </Button>
                  )}
                </div>

                {/* Sub-Catatan Komponen */}
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
                            updateCatatan(entryIndex, catatanIndex, {
                              komponen: e.target.value,
                            })
                          }
                          placeholder="Komponen"
                          className="w-32 shrink-0 text-xs" // Gunakan w-32 shrink-0 agar tidak menyusut/gepeng
                        />
                        <Input
                          value={catatan.keterangan}
                          onChange={(e) =>
                            updateCatatan(entryIndex, catatanIndex, {
                              keterangan: e.target.value,
                            })
                          }
                          placeholder="Keterangan kerusakan"
                          className="flex-1 min-w-0 text-xs" // flex-1 min-w-0 agar mengambil sisa ruang dengan aman
                        />
                        <button
                          type="button"
                          onClick={() =>
                            removeCatatan(entryIndex, catatanIndex)
                          }
                          className="px-1 text-base font-bold text-red-600 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  type="button"
                  variant="text"
                  onClick={() => addCatatan(entryIndex)}
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
              onClick={addEntry}
              className="px-3 py-1 text-xs"
            >
              + Kelompok Kondisi
            </Button>

            <p
              className={`text-xs font-semibold ${
                isKondisiMatch ? "text-gray-500" : "text-red-600"
              }`}
            >
              Total: {totalKondisi} / {isJumlahValid ? jumlahValue : "?"} Unit
            </p>
          </div>
        </div>

        {/* --- STATUS KETERSEDIAAN --- */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-(--md-sys-color-on-surface)">
            Status Ketersediaan
          </label>
          <select
            value={ketersediaan}
            onChange={(e) =>
              setKetersediaan(e.target.value as KetersediaanStatus)
            }
            className="w-full rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline) bg-(--md-sys-color-surface) px-3 py-2 text-sm text-(--md-sys-color-on-surface) focus:border-(--md-sys-color-primary) focus:outline-none focus:ring-1 focus:ring-(--md-sys-color-primary)"
          >
            {KETERSEDIAAN_STATUSES.map((status) => (
              <option key={status} value={status}>
                {KETERSEDIAAN_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        {/* --- ACTIONS FOOTER --- */}
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
            onClick={handleSave}
            disabled={!isFormValid || isSaving}
          >
            {isSaving ? "Menyimpan..." : "Simpan Data"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
