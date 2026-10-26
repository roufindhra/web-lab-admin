import { useCallback, useEffect, useState } from 'react'
import {
  ApiError,
  hargaSewaService,
  type AlatListMeta,
  type HargaSewa,
} from '@/services'

interface FormState {
  nama_alat: string
  tarif_per_hari: string
}

const EMPTY_FORM: FormState = { nama_alat: '', tarif_per_hari: '' }

const formatTarif = (tarif: string) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
    Number(tarif),
  )

export default function HargaSewaPage() {
  const [hargaList, setHargaList] = useState<HargaSewa[]>([])
  const [meta, setMeta] = useState<AlatListMeta | null>(null)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<HargaSewa | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<HargaSewa | null>(null)

  const loadHarga = useCallback(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    hargaSewaService
      .getAll({ page })
      .then((response) => {
        if (cancelled) return
        setHargaList(response.data)
        setMeta(response.meta)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Gagal memuat daftar harga sewa.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page])

  useEffect(() => loadHarga(), [loadHarga])

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setIsFormOpen(true)
  }

  const openEdit = (harga: HargaSewa) => {
    setEditTarget(harga)
    setForm({ nama_alat: harga.nama_alat, tarif_per_hari: harga.tarif_per_hari })
    setFormError(null)
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    setFormError(null)
    try {
      const payload = {
        nama_alat: form.nama_alat.trim(),
        tarif_per_hari: Number(form.tarif_per_hari),
      }
      if (editTarget) {
        await hargaSewaService.update(editTarget.id, payload)
      } else {
        await hargaSewaService.create(payload)
      }
      setIsFormOpen(false)
      loadHarga()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Terjadi kesalahan.')
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || isSaving) return
    setIsSaving(true)
    setFormError(null)
    try {
      await hargaSewaService.remove(deleteTarget.id)
      setDeleteTarget(null)
      loadHarga()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Terjadi kesalahan.')
      setDeleteTarget(null)
    } finally {
      setIsSaving(false)
    }
  }

  const isFormValid = form.nama_alat.trim() !== '' && Number(form.tarif_per_hari) >= 0 && form.tarif_per_hari !== ''

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Harga Sewa</h1>
          <p className="mt-1 text-sm text-gray-500">
            Daftar tarif sewa per hari. Alat dengan harga di sini yang muncul di halaman sewa publik.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          + Tambah Harga
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nama Alat</th>
              <th className="px-4 py-3">Tarif per Hari</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-gray-500">
                  Memuat...
                </td>
              </tr>
            ) : hargaList.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-gray-500">
                  Belum ada daftar harga sewa.
                </td>
              </tr>
            ) : (
              hargaList.map((harga) => (
                <tr key={harga.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{harga.nama_alat}</td>
                  <td className="px-4 py-3 text-gray-600">{formatTarif(harga.tarif_per_hari)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => openEdit(harga)}
                        className="text-sm text-gray-600 underline hover:text-gray-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(harga)}
                        className="text-sm text-red-600 underline hover:text-red-500"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm text-gray-600">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-md border px-3 py-1.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <span>
            Halaman {meta.current_page} / {meta.last_page}
          </span>
          <button
            disabled={page >= meta.last_page}
            onClick={() => setPage(page + 1)}
            className="rounded-md border px-3 py-1.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Berikutnya
          </button>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setIsFormOpen(false)}>
          <div
            className="w-full max-w-md rounded-lg bg-white p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-bold">{editTarget ? 'Edit Harga Sewa' : 'Tambah Harga Sewa'}</h2>

            {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}

            <div className="mt-4">
              <label htmlFor="nama-alat" className="text-sm font-medium">
                Nama Alat
              </label>
              <input
                id="nama-alat"
                value={form.nama_alat}
                onChange={(event) => setForm({ ...form, nama_alat: event.target.value })}
                placeholder="Harus sama dengan nama grup alat, mis. Total Station"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="tarif" className="text-sm font-medium">
                Tarif per Hari (Rp)
              </label>
              <input
                id="tarif"
                type="number"
                min={0}
                value={form.tarif_per_hari}
                onChange={(event) => setForm({ ...form, tarif_per_hari: event.target.value })}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={!isFormValid || isSaving}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDeleteTarget(null)}>
          <div
            className="w-full max-w-sm rounded-lg bg-white p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-bold">Hapus Harga Sewa</h2>
            <p className="mt-2 text-sm text-gray-600">
              Hapus tarif untuk <span className="font-medium">{deleteTarget.nama_alat}</span>? Alat ini tidak akan
              lagi muncul di halaman sewa publik.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={isSaving}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSaving ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
