import { useState } from 'react'
import { ApiError } from '@/services'

interface Props {
  title: string
  description: string
  confirmLabel: string
  confirmClass: string
  onConfirm: () => Promise<void>
  onClose: () => void
  onSuccess: () => void
}

export default function ConfirmActionModal({
  title,
  description,
  confirmLabel,
  confirmClass,
  onConfirm,
  onClose,
  onSuccess,
}: Props) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (isSaving) return
    setIsSaving(true)
    setError(null)
    try {
      await onConfirm()
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Terjadi kesalahan.')
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white p-6" onClick={(event) => event.stopPropagation()}>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{description}</p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-100">
            Batal
          </button>
          <button
            onClick={() => void handleConfirm()}
            disabled={isSaving}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 ${confirmClass}`}
          >
            {isSaving ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
