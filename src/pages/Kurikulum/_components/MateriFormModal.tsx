import { useState } from 'react'
import {
  kurikulumService,
  ApiError,
  type KurikulumMateri,
} from '@/services'
import RichTextEditor from './RichTextEditor'

interface MateriFormModalProps {
  slug: string
  materi?: KurikulumMateri | null
  onClose: () => void
  onSuccess: () => void
}

export default function MateriFormModal({ slug, materi, onClose, onSuccess }: MateriFormModalProps) {
  const [materiNama, setMateriNama] = useState(materi?.materi_nama ?? '')
  const [deskripsi, setDeskripsi] = useState(materi?.deskripsi ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFormValid = materiNama.trim() !== '' && deskripsi.trim() !== ''

  const handleSubmit = async () => {
    if (!isFormValid || isSaving) return
    setIsSaving(true)
    setError(null)
    try {
      if (materi) {
        await kurikulumService.update(slug, materi.id, {
          materi_nama: materiNama.trim(),
          deskripsi,
        })
      } else {
        await kurikulumService.create(slug, {
          materi_nama: materiNama.trim(),
          deskripsi,
        })
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan materi.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">
          {materi ? `Edit Materi ${materi.materi_id}` : 'Tambah Materi'}
        </h2>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="materi-nama" className="mb-1 block text-sm font-medium text-gray-700">
              Judul Materi
            </label>
            <input
              id="materi-nama"
              type="text"
              value={materiNama}
              onChange={(e) => setMateriNama(e.target.value)}
              placeholder="cth. Kerangka Kontrol Vertikal"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Deskripsi (materi ajar & capaian)
            </label>
            <RichTextEditor key={materi?.id ?? 'new'} content={deskripsi} onChange={setDeskripsi} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!isFormValid || isSaving}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}
