import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Buttons";
import { ApiError } from "@/services";

interface Props {
  isOpen?: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass?: string;
  variant?: "filled" | "outlined" | "text";
  onConfirm: () => Promise<void>;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConfirmActionModal({
  isOpen = true,
  title,
  description,
  confirmLabel,
  confirmClass = "",
  variant = "filled",
  onConfirm,
  onClose,
  onSuccess,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await onConfirm();
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
      title={title}
      className="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-sm text-(--md-sys-color-on-surface) opacity-80">
          {description}
        </p>

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
            variant={variant}
            onClick={() => void handleConfirm()}
            disabled={isSaving}
            className={confirmClass}
          >
            {isSaving ? "Memproses..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
