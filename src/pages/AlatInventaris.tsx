import { useEffect, useState } from 'react'
import {
  alatService,
  ApiError,
  KETERSEDIAAN_STATUSES,
  KONDISI_STATUSES,
  type Alat,
  type AlatListMeta,
  type KondisiStatus,
  type KetersediaanStatus,
} from '@/services'
import AlatFormModal from '../components/AlatFormModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import KondisiDetailModal from '../components/KondisiDetailModal'

const SEARCH_DEBOUNCE_MS = 400

const KONDISI_LABELS: Record<KondisiStatus, string> = {
  baik: 'baik',
  rusak_ringan: 'rusak ringan',
  rusak_berat: 'rusak berat',
  maintenance: 'maintenance',
}

const KETERSEDIAAN_LABELS: Record<KetersediaanStatus, string> = {
  tersedia: 'Tersedia',
  dipinjam: 'Dipinjam',
  perbaikan: 'Perbaikan',
}

const KETERSEDIAAN_BADGE_CLASSES: Record<KetersediaanStatus, string> = {
  tersedia: 'bg-green-100 text-green-800',
  dipinjam: 'bg-yellow-100 text-yellow-800',
  perbaikan: 'bg-red-100 text-red-800',
}

export default function AlatPage() {
  const [alatList, setAlatList] = useState<Alat[]>([])
  const [meta, setMeta] = useState<AlatListMeta | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [ketersediaan, setKetersediaan] = useState('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [formTarget, setFormTarget] = useState<Alat | null | undefined>(undefined)
  const [detailTarget, setDetailTarget] = useState<Alat | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Alat | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setDebouncedSearch(search)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    alatService
      .getAll({
        search: debouncedSearch || undefined,
        ketersediaan: (ketersediaan || undefined) as KetersediaanStatus | undefined,
        page,
        sortDirection,
      })
      .then((response) => {
        if (cancelled) return
        setAlatList(response.data)
        setMeta(response.meta)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Gagal memuat data alat.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedSearch, ketersediaan, page, sortDirection, refreshKey])

  const hasActiveFilter = debouncedSearch || ketersediaan

  const handleCloseForm = () => setFormTarget(undefined)

  const handleFormSuccess = () => {
    setFormTarget(undefined)
    setRefreshKey((key) => key + 1)
  }

  const kondisiRingkas = (alat: Alat) =>
    KONDISI_STATUSES.filter((status) => (alat.kondisi_ringkas[status] ?? 0) > 0)
      .map((status) => `${alat.kondisi_ringkas[status]} ${KONDISI_LABELS[status]}`)
      .join(' · ')

  return (
    <div>
      <h1 className="text-2xl font-bold">Inventarisasi Alat</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setFormTarget(null)}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Tambah Alat
        </button>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari alat, merk, kode inventaris..."
          className="w-64 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <select
          value={ketersediaan}
          onChange={(event) => {
            setPage(1)
            setKetersediaan(event.target.value)
          }}
          className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Semua ketersediaan</option>
          {KETERSEDIAAN_STATUSES.map((status) => (
            <option key={status} value={status}>
              {KETERSEDIAAN_LABELS[status]}
            </option>
          ))}
        </select>
        {hasActiveFilter && (
          <button
            onClick={() => {
              setSearch('')
              setKetersediaan('')
              setPage(1)
            }}
            className="text-sm text-gray-500 underline hover:text-gray-900"
          >
            Reset filter
          </button>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Inventaris</th>
              <th className="px-4 py-3">
                <button
                  onClick={() => {
                    setPage(1)
                    setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
                  }}
                  className="flex items-center gap-1 uppercase hover:text-gray-900"
                >
                  Nama Alat
                  <span className="text-[10px]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                </button>
              </th>
              <th className="px-4 py-3">Serial Number</th>
              <th className="px-4 py-3">Jumlah</th>
              <th className="px-4 py-3">Kondisi</th>
              <th className="px-4 py-3">Lokasi</th>
              <th className="px-4 py-3">Ketersediaan</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  Memuat...
                </td>
              </tr>
            ) : alatList.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  {hasActiveFilter ? 'Tidak ada alat yang cocok dengan filter.' : 'Belum ada data alat.'}
                </td>
              </tr>
            ) : (
              alatList.map((alat) => (
                <tr key={alat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">{alat.inventaris}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{alat.nama_alat}</span>
                    <span className="block text-xs text-gray-500">
                      {alat.merk} {alat.tipe}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600">{alat.serial_number}</td>
                  <td className="px-4 py-3">{alat.jumlah}</td>
                  <td className="px-4 py-3">
                    <span className="text-gray-600">{kondisiRingkas(alat) || '-'}</span>
                    <button
                      onClick={() => setDetailTarget(alat)}
                      className="ml-2 text-sm text-gray-600 underline hover:text-gray-900"
                    >
                      Detail
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{alat.lokasi_penyimpanan}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        KETERSEDIAAN_BADGE_CLASSES[alat.ketersediaan] ?? 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {KETERSEDIAAN_LABELS[alat.ketersediaan] ?? alat.ketersediaan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFormTarget(alat)}
                        className="text-sm text-gray-600 underline hover:text-gray-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(alat)}
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

      {meta && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Menampilkan {alatList.length} dari {meta.total} alat
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-md border px-3 py-1.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span>
              Halaman {meta.current_page} / {meta.last_page}
            </span>
            <button
              disabled={page >= meta.last_page || isLoading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-md border px-3 py-1.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      {formTarget !== undefined && (
        <AlatFormModal alat={formTarget} onClose={handleCloseForm} onSuccess={handleFormSuccess} />
      )}

      {detailTarget && <KondisiDetailModal alat={detailTarget} onClose={() => setDetailTarget(null)} />}

      {deleteTarget && (
        <DeleteConfirmModal
          alat={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => {
            setDeleteTarget(null)
            setRefreshKey((key) => key + 1)
          }}
        />
      )}
    </div>
  )
}
