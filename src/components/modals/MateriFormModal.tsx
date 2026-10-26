import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Buttons";
import { Input } from "@/components/ui/Input";
import { kurikulumService, ApiError, type KurikulumMateri } from "@/services";
import RichTextEditor from "../RichTextEditor";

interface MateriFormModalProps {
  slug: string;
  materi?: KurikulumMateri | null;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MateriFormModal({
  slug,
  materi,
  isOpen = true,
  onClose,
  onSuccess,
}: MateriFormModalProps) {
  const [materiNama, setMateriNama] = useState(materi?.materi_nama ?? "");
  const [deskripsi, setDeskripsi] = useState(materi?.deskripsi ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = materiNama.trim() !== "" && deskripsi.trim() !== "";

  const handleSubmit = async () => {
    if (!isFormValid || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      if (materi) {
        await kurikulumService.update(slug, materi.id, {
          materi_nama: materiNama.trim(),
          deskripsi,
        });
      } else {
        await kurikulumService.create(slug, {
          materi_nama: materiNama.trim(),
          deskripsi,
        });
      }
      onSuccess();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal menyimpan materi.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        materi ? `Edit Materi ${materi.materi_id}` : "Tambah Materi Praktikum"
      }
      className="max-w-2xl"
    >
      <div className="space-y-4">
        <Input
          label="Judul Materi"
          id="materi-nama"
          value={materiNama}
          onChange={(e) => setMateriNama(e.target.value)}
          placeholder="cth. Kerangka Kontrol Vertikal"
        />

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-(--md-sys-color-on-surface)">
            Deskripsi (Materi Ajar & Capaian)
          </label>
          <RichTextEditor
            key={materi?.id ?? "new"}
            content={deskripsi}
            onChange={setDeskripsi}
          />
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
            {isSaving ? "Menyimpan..." : "Simpan Materi"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
