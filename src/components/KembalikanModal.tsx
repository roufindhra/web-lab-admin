import { useState } from 'react'
import {
  ApiError,
  KONDISI_STATUSES,
  peminjamanService,
  type KondisiCatatan,
  type KondisiEntry,
  type KondisiStatus,
  type Peminjaman,
  type PeminjamanItem,
} from '@/services'

const KONDISI_LABELS: Record<KondisiStatus, string> = {
  baik: 'Baik',
  rusak_ringan: 'Rusak Ringan',
  rusak_berat: 'Rusak Berat',
  maintenance: 'Maintenance',
}

const KETERSEDIAAN_OPTIONS = [
  { value: 'tersedia', label: 'Tersedia' },
  { value: 'perbaikan', label: 'Perbaikan' },
] as const

type KetersediaanPilihan = (typeof KETERSEDIAAN_OPTIONS)[number]['value']

interface EntryDraft {
  status: KondisiStatus
  jumlah: string
  catatan: KondisiCatatan[]
}

interface ItemDraft {
  peminjaman_alat_id: number
  item: PeminjamanItem
  entries: EntryDraft[]
  ketersediaan: KetersediaanPilihan
}

interface KembalikanModalProps {
  peminjaman: Peminjaman
  onClose: () => void
  onSuccess: () => void
}

function draftFromItem(item: PeminjamanItem): ItemDraft {
  return {
    peminjaman_alat_id: item.id,
    item,
    entries:
      item.kondisi.length > 0
        ? item.kondisi.map((entry) => ({
            status: entry.status,
            jumlah: String(entry.jumlah),
            catatan: entry.catatan.map((catatan) => ({ ...catatan })),
          }))
        : [{ status: 'baik', jumlah: String(item.jumlah_alat), catatan: [] }],
    ketersediaan: item.ketersediaan === 'perbaikan' ? 'perbaikan' : 'tersedia',
  }
}

export default function KembalikanModal({ peminjaman, onClose, onSuccess }: KembalikanModalProps) {
  const [drafts, setDrafts] = useState<ItemDraft[]>(() => peminjaman.items.map(draftFromItem))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setDraftsState = (updater: (current: ItemDraft[]) => ItemDraft[]) => {
    setDrafts(updater)
  }

  const updateEntry = (itemIndex: number, entryIndex: number, patch: Partial<EntryDraft>) => {
    setDraftsState((current) =>
      current.map((draft, i) =>
        i === itemIndex
          ? {
              ...draft,
              entries: draft.entries.map((entry, j) => (j === entryIndex ? { ...entry, ...patch } : entry)),
            }
          : draft,
      ),
    )
  }

  const addEntry = (itemIndex: number) => {
    setDraftsState((current) =>
      current.map((draft, i) =>
        i === itemIndex ? { ...draft, entries: [...draft.entries, { status: 'baik', jumlah: '', catatan: [] }] } : draft,
      ),
    )
  }

  const removeEntry = (itemIndex: number, entryIndex: number) => {
    setDraftsState((current) =>
      current.map((draft, i) =>
        i === itemIndex ? { ...draft, entries: draft.entries.filter((_, j) => j !== entryIndex) } : draft,
      ),
    )
  }

  const updateCatatan = (itemIndex: number, entryIndex: number, catatanIndex: number, patch: Partial<KondisiCatatan>) => {
    setDraftsState((current) =>
      current.map((draft, i) =>
        i === itemIndex
          ? {
              ...draft,
              entries: draft.entries.map((entry, j) =>
                j === entryIndex
                  ? {
                      ...entry,
                      catatan: entry.catatan.map((catatan, k) => (k === catatanIndex ? { ...catatan, ...patch } : catatan)),
                    }
                  : entry,
              ),
            }
          : draft,
      ),
    )
  }

  const addCatatan = (itemIndex: number, entryIndex: number) => {
    setDraftsState((current) =>
      current.map((draft, i) =>
        i === itemIndex
          ? {
              ...draft,
              entries: draft.entries.map((entry, j) =>
                j === entryIndex ? { ...entry, catatan: [...entry.catatan, { komponen: '', keterangan: '' }] } : entry,
              ),
            }
          : draft,
      ),
    )
  }

  const removeCatatan = (itemIndex: number, entryIndex: number, catatanIndex: number) => {
    setDraftsState((current) =>
      current.map((draft, i) =>
        i === itemIndex
          ? {
              ...draft,
              entries: draft.entries.map((entry, j) =>
                j === entryIndex ? { ...entry, catatan: entry.catatan.filter((_, k) => k !== catatanIndex) } : entry,
              ),
            }
          : draft,
      ),
    )
  }

  const itemTotals = drafts.map((draft) => draft.entries.reduce((sum, entry) => sum + (Number(entry.jumlah) || 0), 0))
  const isFormValid = drafts.every((draft, i) => {
    const totalMatch = itemTotals[i] === draft.item.jumlah_alat
    const entriesValid = draft.entries.every((entry) => Number(entry.jumlah) >= 1)
    return totalMatch && entriesValid
  })

  const handleSubmit = async () => {
    if (!isFormValid || isSaving) return

    const payload = {
      items: drafts.map((draft) => ({
        peminjaman_alat_id: draft.peminjaman_alat_id,
        kondisi: draft.entries.map(
          (entry): KondisiEntry => ({
            status: entry.status,
            jumlah: Number(entry.jumlah),
            catatan: entry.catatan.filter((catatan) => catatan.komponen.trim() !== '' && catatan.keterangan.trim() !== ''),
          }),
        ),
        ketersediaan: draft.ketersediaan,
      })),
    }

    setIsSaving(true)
    setError(null)
    try {
      await peminjamanService.kembalikan(peminjaman.id, payload)
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Terjadi kesalahan.')
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-bold">Pengecekan Pengembalian</h2>
        <p className="mt-1 text-sm text-gray-600">
          Periksa kondisi alat dari {peminjaman.nama} ({peminjaman.nim}), perbarui bila ada kerusakan, lalu tentukan
          ketersediaannya.
        </p>

        <div className="mt-4 space-y-5">
          {drafts.map((draft, itemIndex) => {
            const totalMatch = itemTotals[itemIndex] === draft.item.jumlah_alat

            return (
              <div key={draft.peminjaman_alat_id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">
                    <span className="font-mono text-xs text-gray-500">{draft.item.inventaris}</span>{' '}
                    {draft.item.nama_alat ?? '-'}
                  </p>
                  <p className="text-xs text-gray-500">Jumlah alat: {draft.item.jumlah_alat}</p>
                </div>

                <div className="mt-2 space-y-3">
                  {draft.entries.map((entry, entryIndex) => (
                    <div key={entryIndex} className="rounded-md border bg-gray-50 p-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={entry.status}
                          onChange={(event) =>
                            updateEntry(itemIndex, entryIndex, { status: event.target.value as KondisiStatus })
                          }
                          className="rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        >
                          {KONDISI_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {KONDISI_LABELS[status]}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          value={entry.jumlah}
                          onChange={(event) => updateEntry(itemIndex, entryIndex, { jumlah: event.target.value })}
                          placeholder="Jumlah unit"
                          className="w-28 rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                        {draft.entries.length > 1 && (
                          <button
                            onClick={() => removeEntry(itemIndex, entryIndex)}
                            className="ml-auto text-sm text-red-600 underline hover:text-red-500"
                          >
                            Hapus
                          </button>
                        )}
                      </div>

                      {entry.catatan.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {entry.catatan.map((catatan, catatanIndex) => (
                            <div key={catatanIndex} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={catatan.komponen}
                                onChange={(event) =>
                                  updateCatatan(itemIndex, entryIndex, catatanIndex, { komponen: event.target.value })
                                }
                                placeholder="Komponen (mis. teropong)"
                                className="w-40 rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                              />
                              <input
                                type="text"
                                value={catatan.keterangan}
                                onChange={(event) =>
                                  updateCatatan(itemIndex, entryIndex, catatanIndex, { keterangan: event.target.value })
                                }
                                placeholder="Keterangan (mis. pecah)"
                                className="flex-1 rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                              />
                              <button
                                onClick={() => removeCatatan(itemIndex, entryIndex, catatanIndex)}
                                className="text-sm text-red-600 underline hover:text-red-500"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => addCatatan(itemIndex, entryIndex)}
                        className="mt-2 text-sm text-gray-500 underline hover:text-gray-900"
                      >
                        + Tambah catatan
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => addEntry(itemIndex)}
                  className="mt-2 text-sm text-gray-500 underline hover:text-gray-900"
                >
                  + Tambah kelompok kondisi
                </button>
                <p className={`mt-1 text-xs ${totalMatch ? 'text-gray-500' : 'text-red-600'}`}>
                  Total kondisi: {itemTotals[itemIndex]} / {draft.item.jumlah_alat}
                </p>

                <div className="mt-3">
                  <label className="text-sm font-medium text-gray-700">Ketersediaan setelah pengecekan</label>
                  <select
                    value={draft.ketersediaan}
                    onChange={(event) =>
                      setDraftsState((current) =>
                        current.map((d, i) =>
                          i === itemIndex ? { ...d, ketersediaan: event.target.value as KetersediaanPilihan } : d,
                        ),
                      )
                    }
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    {KETERSEDIAAN_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Batal
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={!isFormValid || isSaving}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSaving ? 'Memproses...' : 'Konfirmasi Pengembalian'}
          </button>
        </div>
      </div>
    </div>
  )
}
