import { useEffect, useState } from 'react'
import {
  alatLogService,
  ApiError,
  type AlatLog,
  type AlatListMeta,
  type AlatLogStatus,
} from '@/services'

const SEARCH_DEBOUNCE_MS = 400

const STATUS_LABELS: Record<AlatLogStatus, string> = {
  pengajuan: 'Pengajuan',
  keluar: 'Keluar',
  masuk: 'Masuk',
  tambah: 'Tambah',
  hapus: 'Hapus',
  edit: 'Edit',
}

const STATUS_BADGE_CLASSES: Record<AlatLogStatus, string> = {
  pengajuan: 'bg-blue-100 text-blue-800',
  keluar: 'bg-yellow-100 text-yellow-800',
  masuk: 'bg-green-100 text-green-800',
  tambah: 'bg-emerald-100 text-emerald-800',
  hapus: 'bg-red-100 text-red-800',
  edit: 'bg-gray-100 text-gray-800',
}

const formatWaktu = (waktu: string) =>
  new Date(waktu).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export default function AlatLogPage() {
  const [logList, setLogList] = useState<AlatLog[]>([])
  const [meta, setMeta] = useState<AlatListMeta | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

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

    alatLogService
      .getAll({
        search: debouncedSearch || undefined,
        status: (status || undefined) as AlatLogStatus | undefined,
        page,
      })
      .then((response) => {
        if (cancelled) return
        setLogList(response.data)
        setMeta(response.meta)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Gagal memuat log alat.')
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Riwayat Alat</h1>
        <button
          onClick={() => setRefreshKey((key) => key + 1)}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-100"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari id log, inventaris, PIC..."
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
          {(Object.keys(STATUS_LABELS) as AlatLogStatus[]).map((value) => (
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

      <div className="mt-4 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">ID Log</th>
              <th className="px-4 py-3">Keperluan</th>
              <th className="px-4 py-3">PIC</th>
              <th className="px-4 py-3">Alat</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  Memuat...
                </td>
              </tr>
            ) : logList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  {hasActiveFilter ? 'Tidak ada log yang cocok dengan filter.' : 'Belum ada riwayat alat.'}
                </td>
              </tr>
            ) : (
              logList.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatWaktu(log.waktu)}</td>
                  <td className="px-4 py-3 font-mono">{log.id_log}</td>
                  <td className="px-4 py-3">{log.keperluan}</td>
                  <td className="px-4 py-3">
                    {log.nim_pic ? (
                      <>
                        <span className="font-medium">{log.nim_pic}</span>
                        <span className="block text-xs text-gray-500">Mahasiswa</span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium">{log.nama_pic ?? '-'}</span>
                        <span className="block text-xs text-gray-500">Non-mahasiswa</span>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono">{log.inventaris}</span>
                    <span className="block text-xs text-gray-500">{log.nama_alat ?? '(alat dihapus)'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGE_CLASSES[log.status] ?? 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {STATUS_LABELS[log.status] ?? log.status}
                    </span>
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
            Menampilkan {logList.length} dari {meta.total} log
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
    </div>
  )
}
