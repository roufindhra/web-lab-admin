import { useState } from 'react'
import { ApiError, peminjamanService, type Peminjaman } from '@/services'

interface Props {
  peminjaman: Peminjaman
  onClose: () => void
  onSuccess: () => void
}

export default function TolakModal({ peminjaman, onClose, onSuccess }: Props) {
  const [catatan, setCatatan] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (catatan.trim() === '' || isSaving) return
    setIsSaving(true)
    setError(null)
    try {
      await peminjamanService.tolak(peminjaman.id, catatan.trim())
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Terjadi kesalahan.')
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white p-6" onClick={(event) => event.stopPropagation()}>
        <h2 className="text-lg font-bold">Tolak Pengajuan</h2>
        <p className="mt-2 text-sm text-gray-600">
          Pengajuan dari {peminjaman.nama} ({peminjaman.nim}). Berikan alasan penolakan — akan tampil di halaman
          mahasiswa.
        </p>

        <label htmlFor="catatan" className="mt-4 block text-sm font-medium">
          Alasan <span className="text-red-600">*</span>
        </label>
        <textarea
          id="catatan"
          value={catatan}
          onChange={(event) => setCatatan(event.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-100">
            Batal
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={catatan.trim() === '' || isSaving}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSaving ? 'Memproses...' : 'Tolak Pengajuan'}
          </button>
        </div>
      </div>
    </div>
  )
}
