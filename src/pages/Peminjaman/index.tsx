import { useEffect, useState } from 'react'
import {
  ApiError,
  PEMINJAMAN_STATUSES,
  peminjamanService,
  type AlatListMeta,
  type Peminjaman,
  type PeminjamanStatus,
} from '@/services'
import ConfirmActionModal from './_components/ConfirmActionModal'
import KembalikanModal from './_components/KembalikanModal'
import TolakModal from './_components/TolakModal'

const SEARCH_DEBOUNCE_MS = 400

const STATUS_LABELS: Record<PeminjamanStatus, string> = {
  pending: 'Menunggu',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
}

const STATUS_BADGE_CLASSES: Record<PeminjamanStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  disetujui: 'bg-green-100 text-green-800',
  ditolak: 'bg-red-100 text-red-800',
}

function formatWaktu(value: string): string {
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PeminjamanPage() {
  const [peminjamanList, setPeminjamanList] = useState<Peminjaman[]>([])
  const [meta, setMeta] = useState<AlatListMeta | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [approveTarget, setApproveTarget] = useState<Peminjaman | null>(null)
  const [tolakTarget, setTolakTarget] = useState<Peminjaman | null>(null)
  const [kembalikanTarget, setKembalikanTarget] = useState<Peminjaman | null>(null)

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

    peminjamanService
      .getAll({
        search: debouncedSearch || undefined,
        status: (status || undefined) as PeminjamanStatus | undefined,
        page,
      })
      .then((response) => {
        if (cancelled) return
        setPeminjamanList(response.data)
        setMeta(response.meta)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Gagal memuat data peminjaman.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedSearch, status, page, refreshKey])

  const hasActiveFilter = debouncedSearch || status

  return (
    <div>
      <h1 className="text-2xl font-bold">Peminjaman Alat</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama, NIM, keperluan, inventaris..."
          className="w-64 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <select
          value={status}
          onChange={(event) => {
            setPage(1)
            setStatus(event.target.value)
          }}
          className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Semua status</option>
          {PEMINJAMAN_STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
        {hasActiveFilter && (
          <button
            onClick={() => {
              setSearch('')
              setStatus('')
              setPage(1)
            }}
            className="text-sm text-gray-500 underline hover:text-gray-900"
          >
            Reset filter
          </button>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Diajukan</th>
              <th className="px-4 py-3">Peminjam</th>
              <th className="px-4 py-3">Keperluan</th>
              <th className="px-4 py-3">Alat</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  Memuat...
                </td>
              </tr>
            ) : peminjamanList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  {hasActiveFilter ? 'Tidak ada peminjaman yang cocok dengan filter.' : 'Belum ada pengajuan peminjaman.'}
                </td>
              </tr>
            ) : (
              peminjamanList.map((peminjaman) => {
                const sedangBerjalan = peminjaman.status === 'disetujui' && peminjaman.returned_at === null

                return (
                  <tr key={peminjaman.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {formatWaktu(peminjaman.dibuat_pada)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{peminjaman.nama}</span>
                      <span className="block font-mono text-xs text-gray-500">{peminjaman.nim}</span>
                    </td>
                    <td className="max-w-48 px-4 py-3">
                      {peminjaman.keperluan_label}
                      {peminjaman.praktikum_slug && (
                        <span className="block font-mono text-xs text-gray-500">{peminjaman.praktikum_slug}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ul className="space-y-0.5">
                        {peminjaman.items.map((item) => (
                          <li key={item.id} className="text-gray-600">
                            <span className="font-mono text-xs">{item.inventaris}</span> {item.nama_alat ?? '-'} ×
                            {item.jumlah}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_BADGE_CLASSES[peminjaman.status]
                        }`}
                      >
                        {STATUS_LABELS[peminjaman.status]}
                      </span>
                      {peminjaman.status === 'disetujui' && (
                        <span className="mt-1 block text-xs text-gray-500">
                          {peminjaman.returned_at
                            ? `Dikembalikan ${formatWaktu(peminjaman.returned_at)}`
                            : `Disetujui ${peminjaman.approved_by ?? '-'} — sedang dipinjam`}
                        </span>
                      )}
                      {peminjaman.status === 'ditolak' && peminjaman.catatan && (
                        <span className="mt-1 block text-xs text-red-600">{peminjaman.catatan}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {peminjaman.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setApproveTarget(peminjaman)}
                              className="text-sm font-medium text-green-700 underline hover:text-green-600"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => setTolakTarget(peminjaman)}
                              className="text-sm text-red-600 underline hover:text-red-500"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                        {sedangBerjalan && (
                          <button
                            onClick={() => setKembalikanTarget(peminjaman)}
                            className="text-sm text-gray-600 underline hover:text-gray-900"
                          >
                            Konfirmasi Pengembalian
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {meta && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Menampilkan {peminjamanList.length} dari {meta.total} peminjaman
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

      {approveTarget && (
        <ConfirmActionModal
          title="Setujui Pengajuan"
          description={`Setujui peminjaman ${approveTarget.items.length} alat oleh ${approveTarget.nama} (${approveTarget.nim})? Stok alat akan dicek dan log pengeluaran tercatat otomatis.`}
          confirmLabel="Setujui"
          confirmClass="bg-green-600 hover:bg-green-500"
          onConfirm={() => peminjamanService.setujui(approveTarget.id).then(() => undefined)}
          onClose={() => setApproveTarget(null)}
          onSuccess={() => {
            setApproveTarget(null)
            setRefreshKey((key) => key + 1)
          }}
        />
      )}

      {tolakTarget && (
        <TolakModal
          peminjaman={tolakTarget}
          onClose={() => setTolakTarget(null)}
          onSuccess={() => {
            setTolakTarget(null)
            setRefreshKey((key) => key + 1)
          }}
        />
      )}

      {kembalikanTarget && (
        <KembalikanModal
          peminjaman={kembalikanTarget}
          onClose={() => setKembalikanTarget(null)}
          onSuccess={() => {
            setKembalikanTarget(null)
            setRefreshKey((key) => key + 1)
          }}
        />
      )}
    </div>
  )
}
