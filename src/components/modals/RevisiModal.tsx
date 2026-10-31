import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Buttons";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  ApiError,
  peminjamanService,
  type AlatOption,
  type Peminjaman,
  type RevisiItemPayload,
} from "@/services";

interface Props {
  peminjaman: Peminjaman;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface DraftRow {
  key: number;
  alat_id: string;
  jumlah: string;
}

export default function RevisiModal({
  peminjaman,
  isOpen = true,
  onClose,
  onSuccess,
}: Props) {
  const [options, setOptions] = useState<AlatOption[]>([]);
  const [rows, setRows] = useState<DraftRow[]>(
    peminjaman.items.map((item, index) => ({
      key: index,
      alat_id: String(item.alat_id),
      jumlah: String(item.jumlah),
    })),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextKey = rows.length ? Math.max(...rows.map((row) => row.key)) + 1 : 1;

  useEffect(() => {
    let cancelled = false;
    peminjamanService
      .alatOptions()
      .then((data) => {
        if (!cancelled) setOptions(data);
      })
      .catch(() => {
        if (!cancelled) setError("Gagal memuat daftar alat.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const optionById = new Map(options.map((option) => [option.id, option]));

  const setRow = (key: number, patch: Partial<DraftRow>) => {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  };

  const isValid =
    rows.length > 0 &&
    rows.every(
      (row) =>
        row.alat_id !== "" &&
        Number(row.jumlah) >= 1 &&
        Number(row.jumlah) <=
          (optionById.get(Number(row.alat_id))?.jumlah ?? 0),
    );

  const handleSubmit = async () => {
    if (!isValid || isSaving) return;
    setIsSaving(true);
    setError(null);
    const items: RevisiItemPayload[] = rows.map((row) => ({
      alat_id: Number(row.alat_id),
      jumlah: Number(row.jumlah),
    }));
    try {
      await peminjamanService.revisiItems(peminjaman.id, items);
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
      title="Revisi Alat"
      className="max-w-2xl"
    >
      <div className="space-y-4">
        <p className="text-sm text-(--md-sys-color-on-surface-variant) leading-relaxed">
          Sesuaikan alat dan jumlah untuk pengajuan #{peminjaman.id} dari{" "}
          <span className="font-semibold text-(--md-sys-color-on-surface)">
            {peminjaman.nama}
          </span>{" "}
          sebelum disetujui. Maksimum jumlah mengikuti stok tiap unit.
        </p>

        <div className="space-y-3">
          {rows.map((row) => {
            const selected = optionById.get(Number(row.alat_id));
            const maxJumlah = selected?.jumlah ?? 0;
            return (
              <div key={row.key} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <Select
                    value={row.alat_id}
                    onValueChange={(val) => setRow(row.key, { alat_id: val })}
                    options={[
                      { value: "", label: "Pilih alat..." },
                      ...options.map((option) => ({
                        value: String(option.id),
                        label: `${option.nama_alat} — ${option.inventaris} (stok ${option.jumlah})`,
                      })),
                    ]}
                  />
                </div>

                <div className="w-20 shrink-0">
                  <Input
                    type="number"
                    min={1}
                    max={maxJumlah || undefined}
                    value={row.jumlah}
                    onChange={(event) =>
                      setRow(row.key, { jumlah: event.target.value })
                    }
                    className="text-center text-xs"
                  />
                </div>

                <Button
                  type="button"
                  variant="text"
                  onClick={() =>
                    setRows((current) =>
                      current.filter((r) => r.key !== row.key),
                    )
                  }
                  className="shrink-0 px-2 py-1.5 text-xs text-red-600 hover:bg-red-500/10"
                >
                  ✕
                </Button>
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outlined"
          onClick={() =>
            setRows((current) => [
              ...current,
              { key: nextKey, alat_id: "", jumlah: "1" },
            ])
          }
          className="text-xs"
        >
          + Tambah Alat
        </Button>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-(--md-sys-color-outline-variant) pt-4">
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
            disabled={!isValid || isSaving}
          >
            {isSaving ? "Menyimpan..." : "Simpan Revisi"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
