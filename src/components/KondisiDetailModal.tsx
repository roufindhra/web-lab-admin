import { type Alat, type KondisiStatus } from '@/services'

const KONDISI_LABELS: Record<KondisiStatus, string> = {
  baik: 'Baik',
  rusak_ringan: 'Rusak Ringan',
  rusak_berat: 'Rusak Berat',
  maintenance: 'Maintenance',
}

const KONDISI_BADGE_CLASSES: Record<KondisiStatus, string> = {
  baik: 'bg-green-100 text-green-800',
  rusak_ringan: 'bg-yellow-100 text-yellow-800',
  rusak_berat: 'bg-red-100 text-red-800',
  maintenance: 'bg-blue-100 text-blue-800',
}

interface KondisiDetailModalProps {
  alat: Alat
  onClose: () => void
}

export default function KondisiDetailModal({ alat, onClose }: KondisiDetailModalProps) {
  let unitCounter = 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-bold">Detail Kondisi</h2>
        <p className="mt-1 text-sm text-gray-600">
          {alat.nama_alat} ({alat.inventaris})
        </p>

        <ul className="mt-4 space-y-3">
          {alat.kondisi.map((entry, index) => {
            const unitAwal = unitCounter + 1
            unitCounter += entry.jumlah
            const unitLabel = entry.jumlah === 1 ? `Unit ${unitAwal}` : `Unit ${unitAwal}–${unitCounter}`

            return (
              <li key={index} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{unitLabel}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${KONDISI_BADGE_CLASSES[entry.status]}`}>
                    {KONDISI_LABELS[entry.status]}
                    {entry.jumlah > 1 && ` ×${entry.jumlah}`}
                  </span>
                </div>
                {entry.catatan.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {entry.catatan.map((catatan, catatanIndex) => (
                      <span
                        key={catatanIndex}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                      >
                        {catatan.komponen}: {catatan.keterangan}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
