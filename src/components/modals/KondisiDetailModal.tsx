import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Buttons";
import { type Alat, type KondisiStatus } from "@/services";

const KONDISI_LABELS: Record<KondisiStatus, string> = {
  baik: "Baik",
  rusak_ringan: "Rusak Ringan",
  rusak_berat: "Rusak Berat",
  maintenance: "Maintenance",
};

const KONDISI_BADGE_CLASSES: Record<KondisiStatus, string> = {
  baik: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rusak_ringan: "bg-amber-100 text-amber-800 border-amber-200",
  rusak_berat: "bg-rose-100 text-rose-800 border-rose-200",
  maintenance: "bg-sky-100 text-sky-800 border-sky-200",
};

interface KondisiDetailModalProps {
  alat: Alat;
  isOpen?: boolean;
  onClose: () => void;
}

export default function KondisiDetailModal({
  alat,
  isOpen = true,
  onClose,
}: KondisiDetailModalProps) {
  let unitCounter = 0;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Kondisi"
      className="max-w-md"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-(--md-sys-color-on-surface)">
            {alat.nama_alat}
          </p>
          <p className="font-mono text-xs text-(--md-sys-color-on-surface-variant)">
            {alat.inventaris}
          </p>
        </div>

        <ul className="space-y-3">
          {alat.kondisi.map((entry, index) => {
            const unitAwal = unitCounter + 1;
            unitCounter += entry.jumlah;
            const unitLabel =
              entry.jumlah === 1
                ? `Unit ${unitAwal}`
                : `Unit ${unitAwal}–${unitCounter}`;

            return (
              <li
                key={index}
                className="space-y-2 rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-high) p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-(--md-sys-color-on-surface)">
                    {unitLabel}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                      KONDISI_BADGE_CLASSES[entry.status]
                    }`}
                  >
                    {KONDISI_LABELS[entry.status]}
                    {entry.jumlah > 1 && ` ×${entry.jumlah}`}
                  </span>
                </div>

                {entry.catatan.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {entry.catatan.map((catatan, catatanIndex) => (
                      <span
                        key={catatanIndex}
                        className="rounded-md border border-(--md-sys-color-outline) bg-(--md-sys-color-surface) px-2 py-0.5 text-[11px] text-(--md-sys-color-on-surface)"
                      >
                        <span className="font-medium">{catatan.komponen}:</span>{" "}
                        {catatan.keterangan}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex justify-end border-t border-(--md-sys-color-outline-variant) pt-3">
          <Button type="button" variant="filled" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
