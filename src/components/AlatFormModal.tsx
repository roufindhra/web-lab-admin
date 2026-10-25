import { useState } from 'react'
import {
  alatService,
  ApiError,
  KONDISI_STATUSES,
  KETERSEDIAAN_STATUSES,
  type Alat,
  type KondisiCatatan,
  type KondisiEntry,
  type KondisiStatus,
  type KetersediaanStatus,
} from '@/services'

const KONDISI_LABELS: Record<KondisiStatus, string> = {
  baik: 'Baik',
  rusak_ringan: 'Rusak Ringan',
  rusak_berat: 'Rusak Berat',
  maintenance: 'Maintenance',
}

const KETERSEDIAAN_LABELS: Record<KetersediaanStatus, string> = {
  tersedia: 'Tersedia',
  dipinjam: 'Dipinjam',
  perbaikan: 'Perbaikan',
}

interface EntryDraft {
  status: KondisiStatus
  jumlah: string
  catatan: { komponen: string; keterangan: string }[]
}

interface AlatFormModalProps {
  alat?: Alat | null
  onClose: () => void
  onSuccess: () => void
}

function draftFromAlat(alat: Alat | null | undefined): EntryDraft[] {
  if (!alat) {
    return [{ status: 'baik', jumlah: '', catatan: [] }]
  }
  return alat.kondisi.map((entry) => ({
    status: entry.status,
    jumlah: String(entry.jumlah),
    catatan: entry.catatan.map((catatan) => ({ ...catatan })),
  }))
}

export default function AlatFormModal({ alat, onClose, onSuccess }: AlatFormModalProps) {
  const [inventaris, setInventaris] = useState(alat?.inventaris ?? '')
  const [namaAlat, setNamaAlat] = useState(alat?.nama_alat ?? '')
  const [merk, setMerk] = useState(alat?.merk ?? '')
  const [tipe, setTipe] = useState(alat?.tipe ?? '')
  const [serialNumber, setSerialNumber] = useState(alat?.serial_number ?? '')
  const [lokasiPenyimpanan, setLokasiPenyimpanan] = useState(alat?.lokasi_penyimpanan ?? '')
  const [jumlah, setJumlah] = useState(String(alat?.jumlah ?? ''))
  const [entries, setEntries] = useState<EntryDraft[]>(() => draftFromAlat(alat))
  const [ketersediaan, setKetersediaan] = useState<KetersediaanStatus>(alat?.ketersediaan ?? 'tersedia')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const jumlahValue = Number(jumlah)
  const totalKondisi = entries.reduce((sum, entry) => sum + (Number(entry.jumlah) || 0), 0)
  const isJumlahValid = jumlah !== '' && Number.isInteger(jumlahValue) && jumlahValue >= 1
  const isKondisiMatch = isJumlahValid && totalKondisi === jumlahValue
  const isFormValid =
    inventaris.trim() !== '' &&
    namaAlat.trim() !== '' &&
    merk.trim() !== '' &&
    tipe.trim() !== '' &&
    serialNumber.trim() !== '' &&
    lokasiPenyimpanan.trim() !== '' &&
    isKondisiMatch &&
    entries.every((entry) => Number(entry.jumlah) >= 1)

  const setEntriesState = (updater: (current: EntryDraft[]) => EntryDraft[]) => {
    setEntries(updater)
  }

  const updateEntry = (index: number, patch: Partial<EntryDraft>) => {
    setEntriesState((current) =>
      current.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    )
  }

  const addEntry = () => {
    setEntriesState((current) => [...current, { status: 'baik', jumlah: '', catatan: [] }])
  }

  const removeEntry = (index: number) => {
    setEntriesState((current) => current.filter((_, i) => i !== index))
  }

  const updateCatatan = (entryIndex: number, catatanIndex: number, patch: Partial<KondisiCatatan>) => {
    setEntriesState((current) =>
      current.map((entry, i) =>
        i === entryIndex
          ? {
              ...entry,
              catatan: entry.catatan.map((catatan, j) => (j === catatanIndex ? { ...catatan, ...patch } : catatan)),
            }
          : entry,
      ),
    )
  }

  const addCatatan = (entryIndex: number) => {
    setEntriesState((current) =>
      current.map((entry, i) =>
        i === entryIndex ? { ...entry, catatan: [...entry.catatan, { komponen: '', keterangan: '' }] } : entry,
      ),
    )
  }

  const removeCatatan = (entryIndex: number, catatanIndex: number) => {
    setEntriesState((current) =>
      current.map((entry, i) =>
        i === entryIndex ? { ...entry, catatan: entry.catatan.filter((_, j) => j !== catatanIndex) } : entry,
      ),
    )
  }

  const handleSave = () => {
    if (!isFormValid) return

    const payloadKondisi: KondisiEntry[] = entries.map((entry) => ({
      status: entry.status,
      jumlah: Number(entry.jumlah),
      catatan: entry.catatan.filter((catatan) => catatan.komponen.trim() !== '' && catatan.keterangan.trim() !== ''),
    }))

    setIsSaving(true)
    setError(null)

    const payload = {
      inventaris: inventaris.trim(),
      nama_alat: namaAlat.trim(),
      merk: merk.trim(),
      tipe: tipe.trim(),
      serial_number: serialNumber.trim(),
      lokasi_penyimpanan: lokasiPenyimpanan.trim(),
      jumlah: jumlahValue,
      kondisi: payloadKondisi,
      ketersediaan,
    }

    const request = alat ? alatService.update(alat.id, payload) : alatService.create(payload)

    request
      .then(onSuccess)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Gagal menyimpan data alat.')
      })
      .finally(() => {
        setIsSaving(false)
      })
  }

  const textField = (label: string, value: string, onChange: (value: string) => void) => (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-bold">{alat ? 'Edit Alat' : 'Tambah Alat'}</h2>

        <div className="mt-4 space-y-3">
          {textField('Kode Inventaris', inventaris, setInventaris)}
          {textField('Nama Alat', namaAlat, setNamaAlat)}
          {textField('Merk', merk, setMerk)}
          {textField('Tipe', tipe, setTipe)}
          {textField('Serial Number', serialNumber, setSerialNumber)}
          {textField('Lokasi Penyimpanan', lokasiPenyimpanan, setLokasiPenyimpanan)}

          <div>
            <label className="text-sm font-medium text-gray-700">Jumlah</label>
            <input
              type="number"
              min={1}
              value={jumlah}
              onChange={(event) => setJumlah(event.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">Kondisi per unit</p>
            <div className="mt-1 space-y-3">
              {entries.map((entry, entryIndex) => (
                <div key={entryIndex} className="rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={entry.status}
                      onChange={(event) => updateEntry(entryIndex, { status: event.target.value as KondisiStatus })}
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
                      onChange={(event) => updateEntry(entryIndex, { jumlah: event.target.value })}
                      placeholder="Jumlah unit"
                      className="w-28 rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                    {entries.length > 1 && (
                      <button
                        onClick={() => removeEntry(entryIndex)}
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
                            onChange={(event) => updateCatatan(entryIndex, catatanIndex, { komponen: event.target.value })}
                            placeholder="Komponen (mis. teropong)"
                            className="w-40 rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                          <input
                            type="text"
                            value={catatan.keterangan}
                            onChange={(event) =>
                              updateCatatan(entryIndex, catatanIndex, { keterangan: event.target.value })
                            }
                            placeholder="Keterangan (mis. pecah)"
                            className="flex-1 rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                          <button
                            onClick={() => removeCatatan(entryIndex, catatanIndex)}
                            className="text-sm text-red-600 underline hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => addCatatan(entryIndex)}
                    className="mt-2 text-sm text-gray-500 underline hover:text-gray-900"
                  >
                    + Tambah catatan
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addEntry}
              className="mt-2 text-sm text-gray-500 underline hover:text-gray-900"
            >
              + Tambah kelompok kondisi
            </button>
            <p className={`mt-1 text-xs ${isKondisiMatch ? 'text-gray-500' : 'text-red-600'}`}>
              Total kondisi: {totalKondisi} / {isJumlahValid ? jumlahValue : '?'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Ketersediaan</label>
            <select
              value={ketersediaan}
              onChange={(event) => setKetersediaan(event.target.value as KetersediaanStatus)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {KETERSEDIAAN_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {KETERSEDIAAN_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={!isFormValid || isSaving}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}
