import { useState } from 'react'
import { alatService, ApiError, type Alat } from '@/services'

interface DeleteConfirmModalProps {
  alat: Alat
  onClose: () => void
  onSuccess: () => void
}

export default function DeleteConfirmModal({ alat, onClose, onSuccess }: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = () => {
    setIsDeleting(true)
    setError(null)

    alatService
      .remove(alat.id)
      .then(onSuccess)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Gagal menghapus data alat.')
      })
      .finally(() => {
        setIsDeleting(false)
      })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-bold">Hapus Alat</h2>
        <p className="mt-2 text-sm text-gray-600">
          Yakin ingin menghapus <span className="font-medium">{alat.nama_alat}</span> ({alat.inventaris})? Tindakan ini
          tidak dapat dibatalkan.
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isDeleting ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}
