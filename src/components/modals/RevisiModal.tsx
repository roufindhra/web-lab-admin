import { useEffect, useState } from 'react'
import {
  ApiError,
  peminjamanService,
  type AlatOption,
  type Peminjaman,
  type RevisiItemPayload,
} from '@/services'

interface Props {
  peminjaman: Peminjaman
  onClose: () => void
  onSuccess: () => void
}

interface DraftRow {
  key: number
  alat_id: string
  jumlah: string
}

export default function RevisiModal({ peminjaman, onClose, onSuccess }: Props) {
  const [options, setOptions] = useState<AlatOption[]>([])
  const [rows, setRows] = useState<DraftRow[]>(
    peminjaman.items.map((item, index) => ({
      key: index,
      alat_id: String(item.alat_id),
      jumlah: String(item.jumlah),
    })),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nextKey = rows.length
    ? Math.max(...rows.map((row) => row.key)) + 1
    : 1

  useEffect(() => {
    let cancelled = false
    peminjamanService
      .alatOptions()
      .then((data) => {
        if (!cancelled) setOptions(data)
      })
      .catch(() => {
        if (!cancelled) setError('Gagal memuat daftar alat.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const optionById = new Map(options.map((option) => [option.id, option]))

  const setRow = (key: number, patch: Partial<DraftRow>) => {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    )
  }

  const isValid =
    rows.length > 0 &&
    rows.every(
      (row) =>
        row.alat_id !== '' &&
        Number(row.jumlah) >= 1 &&
        Number(row.jumlah) <= (optionById.get(Number(row.alat_id))?.jumlah ?? 0),
    )

  const handleSubmit = async () => {
    if (!isValid || isSaving) return
    setIsSaving(true)
    setError(null)
    const items: RevisiItemPayload[] = rows.map((row) => ({
      alat_id: Number(row.alat_id),
      jumlah: Number(row.jumlah),
    }))
    try {
      await peminjamanService.revisiItems(peminjaman.id, items)
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Terjadi kesalahan.')
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-bold">Revisi Alat</h2>
        <p className="mt-2 text-sm text-gray-600">
          Sesuaikan alat dan jumlah untuk pengajuan #{peminjaman.id} dari {peminjaman.nama} sebelum disetujui.
          Maksimum jumlah mengikuti stok tiap unit.
        </p>

        <div className="mt-4 space-y-2">
          {rows.map((row) => {
            const selected = optionById.get(Number(row.alat_id))
            const maxJumlah = selected?.jumlah ?? 0
            return (
              <div key={row.key} className="flex items-center gap-2">
                <select
                  value={row.alat_id}
                  onChange={(event) => setRow(row.key, { alat_id: event.target.value })}
                  className="min-w-0 flex-1 rounded-md border px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  aria-label="Alat"
                >
                  <option value="">Pilih alat...</option>
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.nama_alat} — {option.inventaris} (stok {option.jumlah})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={maxJumlah || undefined}
                  value={row.jumlah}
                  onChange={(event) => setRow(row.key, { jumlah: event.target.value })}
                  className="w-20 rounded-md border px-2 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  aria-label="Jumlah"
                />
                <button
                  onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
                  className="rounded p-1.5 text-red-600 hover:bg-red-50"
                  aria-label="Hapus baris"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>

        <button
          onClick={() =>
            setRows((current) => [...current, { key: nextKey, alat_id: '', jumlah: '1' }])
          }
          className="mt-3 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-100"
        >
          + Tambah Alat
        </button>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-100">
            Batal
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={!isValid || isSaving}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Revisi'}
          </button>
        </div>
      </div>
    </div>
  )
}
