import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Buttons";
import { alatService, ApiError, type Alat } from "@/services";

interface DeleteConfirmModalProps {
  alat: Alat;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteConfirmModal({
  alat,
  isOpen = true,
  onClose,
  onSuccess,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setIsDeleting(true);
    setError(null);

    alatService
      .remove(alat.id)
      .then(onSuccess)
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Gagal menghapus data alat.",
        );
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Hapus Data Alat"
      className="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-sm text-(--md-sys-color-on-surface-variant) leading-relaxed">
          Apakah Anda yakin ingin menghapus{" "}
          <span className="font-semibold text-(--md-sys-color-on-surface)">
            {alat.nama_alat}
          </span>{" "}
          (<span className="font-mono text-xs">{alat.inventaris}</span>)?
          Tindakan ini tidak dapat dibatalkan.
        </p>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-(--md-sys-color-outline-variant) pt-4">
          <Button
            type="button"
            variant="outlined"
            onClick={onClose}
            disabled={isDeleting}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="filled"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
          >
            {isDeleting ? "Menghapus..." : "Hapus Data"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
