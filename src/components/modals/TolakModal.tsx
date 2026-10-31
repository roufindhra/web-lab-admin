import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Buttons";
import { ApiError, peminjamanService, type Peminjaman } from "@/services";

interface Props {
  peminjaman: Peminjaman;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TolakModal({
  peminjaman,
  isOpen = true,
  onClose,
  onSuccess,
}: Props) {
  const [catatan, setCatatan] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (catatan.trim() === "" || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await peminjamanService.tolak(peminjaman.id, catatan.trim());
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
      title="Tolak Pengajuan Peminjaman"
      className="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-sm text-(--md-sys-color-on-surface-variant) leading-relaxed">
          Pengajuan dari{" "}
          <span className="font-semibold text-(--md-sys-color-on-surface)">
            {peminjaman.nama}
          </span>{" "}
          (<span className="font-mono text-xs">{peminjaman.nim}</span>). Berikan
          alasan penolakan — akan tampil di halaman mahasiswa.
        </p>

        <div className="space-y-1">
          <label
            htmlFor="catatan"
            className="block text-xs font-semibold text-(--md-sys-color-on-surface)"
          >
            Alasan Penolakan <span className="text-red-600">*</span>
          </label>
          <textarea
            id="catatan"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={3}
            placeholder="Tuliskan alasan penolakan pengajuan ini..."
            className="w-full rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline) bg-(--md-sys-color-surface) px-3.5 py-2 text-sm text-(--md-sys-color-on-surface) transition-all focus:border-(--md-sys-color-primary) focus:outline-none focus:ring-1 focus:ring-(--md-sys-color-primary)"
          />
        </div>

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
            disabled={catatan.trim() === "" || isSaving}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
          >
            {isSaving ? "Memproses..." : "Tolak Pengajuan"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
