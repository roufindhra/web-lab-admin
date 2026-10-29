import { useEffect, useState } from 'react'
import {
  mahasiswaService,
  praktikumService,
  ApiError,
  type Mahasiswa,
  type MahasiswaListMeta,
  type Praktikum,
} from '@/services'

const SEARCH_DEBOUNCE_MS = 400

type StatusFilter = 'semua' | 'asisten' | 'asisten_nonaktif' | 'bukan'

const STATUS_FILTER_ROLE: Record<Exclude<StatusFilter, 'semua'>, 'asisten' | 'asisten_all' | 'mahasiswa'> = {
  asisten: 'asisten',
  asisten_nonaktif: 'asisten_all',
  bukan: 'mahasiswa',
}

function StatusBadge({ mahasiswa }: { mahasiswa: Mahasiswa }) {
  if (!mahasiswa.is_asisten) {
    return (
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
        Bukan Asisten
      </span>
    )
  }
  return mahasiswa.is_active_asisten ? (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
      Asisten Aktif
    </span>
  ) : (
    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
      Asisten Nonaktif
    </span>
  )
}

export default function Asisten() {
  const [students, setStudents] = useState<Mahasiswa[]>([])
  const [meta, setMeta] = useState<MahasiswaListMeta | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [editingStudent, setEditingStudent] = useState<Mahasiswa | null>(null)
  const [praktikumOptions, setPraktikumOptions] = useState<Praktikum[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [editIsAsisten, setEditIsAsisten] = useState(false)
  const [editIsActive, setEditIsActive] = useState(false)
  const [editPlugs, setEditPlugs] = useState<Record<string, string[]>>({})
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

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

    mahasiswaService
      .getAll({
        search: debouncedSearch || undefined,
        role: statusFilter === 'semua' ? undefined : STATUS_FILTER_ROLE[statusFilter],
        page,
      })
      .then((response) => {
        if (cancelled) return
        setStudents(response.data)
        setMeta(response.meta)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Gagal memuat data mahasiswa.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedSearch, statusFilter, page, refreshKey])

  const openEditModal = (student: Mahasiswa) => {
    setEditingStudent(student)
    setEditError(null)
    setEditIsAsisten(student.is_asisten)
    setEditIsActive(student.is_asisten && student.is_active_asisten)
    setIsLoadingOptions(true)

    const pengampu = student.pengampu_praktikum ?? []
    setEditPlugs(
      Object.fromEntries(pengampu.map((slug) => [slug, student.pengampu_plug?.[slug] ?? []])),
    )

    praktikumService
      .getAll()
      .then((options) => setPraktikumOptions(options))
      .catch((err) => {
        setEditError(err instanceof ApiError ? err.message : 'Gagal memuat daftar praktikum.')
      })
      .finally(() => setIsLoadingOptions(false))
  }

  const closeEditModal = () => {
    setEditingStudent(null)
    setEditPlugs({})
    setEditError(null)
  }

  const togglePengampu = (slug: string) => {
    setEditPlugs((current) => {
      if (slug in current) {
        const next = { ...current }
        delete next[slug]
        return next
      }
      return { ...current, [slug]: [] }
    })
  }

  const togglePlug = (slug: string, plug: string) => {
    setEditPlugs((current) => {
      const plugs = current[slug] ?? []
      return {
        ...current,
        [slug]: plugs.includes(plug) ? plugs.filter((p) => p !== plug) : [...plugs, plug],
      }
    })
  }

  const handleSaveEdit = () => {
    if (!editingStudent) return

    const plugs: Record<string, string[]> = {}
    for (const [slug, plugList] of Object.entries(editPlugs)) {
      const option = praktikumOptions.find((p) => p.slug === slug)
      const tersedia = option?.plugs.map((jadwal) => jadwal.plug) ?? []
      if (!option || plugList.length === 0 || plugList.some((plug) => !tersedia.includes(plug))) {
        setEditError('Pilih minimal satu plug yang tersedia untuk setiap praktikum yang dipilih.')
        return
      }
      plugs[slug] = plugList
    }

    setIsSavingEdit(true)
    setEditError(null)

    mahasiswaService
      .updateAsisten(editingStudent.id, {
        is_asisten: editIsAsisten,
        is_active_asisten: editIsActive,
        pengampu_praktikum: Object.keys(plugs),
        pengampu_plug: plugs,
      })
      .then(() => {
        closeEditModal()
        setRefreshKey((key) => key + 1)
      })
      .catch((err) => {
        setEditError(err instanceof ApiError ? err.message : 'Gagal menyimpan perubahan.')
      })
      .finally(() => {
        setIsSavingEdit(false)
      })
  }

  const hasActiveFilter = debouncedSearch || statusFilter !== 'semua'

  const statusFilters: { value: StatusFilter; label: string }[] = [
    { value: 'semua', label: 'Semua' },
    { value: 'asisten', label: 'Asisten Aktif' },
    { value: 'asisten_nonaktif', label: 'Asisten Nonaktif' },
    { value: 'bukan', label: 'Bukan Asisten' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold">Manajemen Asisten</h1>
      <p className="mt-1 text-sm text-gray-600">
        Tetapkan mahasiswa sebagai asisten dan atur praktikum yang diampu. Praktikum ampuan menentukan
        fitur yang dapat diakses asisten di panel admin.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama atau NIM..."
          className="w-64 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <div className="flex items-center gap-1">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => {
                setPage(1)
                setStatusFilter(filter.value)
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === filter.value
                  ? 'bg-gray-900 text-white'
                  : 'border text-gray-600 hover:bg-gray-100'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        {hasActiveFilter && (
          <button
            onClick={() => {
              setSearch('')
              setPage(1)
              setStatusFilter('semua')
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
              <th className="px-4 py-3">NIM</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Angkatan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Pengampu</th>
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
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  {hasActiveFilter ? 'Tidak ada mahasiswa yang cocok dengan filter.' : 'Belum ada data mahasiswa.'}
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const pengampu = student.pengampu_praktikum ?? []
                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono">{student.nim}</td>
                    <td className="px-4 py-3 font-medium">{student.nama}</td>
                    <td className="px-4 py-3">{student.angkatan}</td>
                    <td className="px-4 py-3">
                      <StatusBadge mahasiswa={student} />
                    </td>
                    <td className="px-4 py-3">
                      {pengampu.length === 0 ? (
                        <span className="text-gray-400">-</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {pengampu.map((slug) => (
                            <li key={slug} className="text-xs text-gray-600">
                              {slug}
                              {(student.pengampu_plug?.[slug]?.length ?? 0) > 0 && (
                                <span className="text-gray-400">
                                  {' '}
                                  · {student.pengampu_plug[slug].join(', ')}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEditModal(student)}
                        className="text-sm text-gray-600 underline hover:text-gray-900"
                      >
                        Atur
                      </button>
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
            Menampilkan {students.length} dari {meta.total} mahasiswa
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

      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeEditModal}>
          <div
            className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-bold">Atur Asisten</h2>
            <p className="mt-1 text-sm text-gray-600">
              {editingStudent.nama} ({editingStudent.nim})
            </p>

            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={editIsAsisten}
                  onChange={(event) => {
                    setEditIsAsisten(event.target.checked)
                    if (!event.target.checked) setEditIsActive(false)
                  }}
                  className="h-4 w-4"
                />
                <span>
                  <span className="font-medium">Asisten</span>
                  <span className="ml-2 text-gray-500">Mahasiswa ini adalah asisten</span>
                </span>
              </label>
              <label className={`flex items-center gap-3 text-sm ${editIsAsisten ? '' : 'opacity-40'}`}>
                <input
                  type="checkbox"
                  checked={editIsActive}
                  disabled={!editIsAsisten}
                  onChange={(event) => setEditIsActive(event.target.checked)}
                  className="h-4 w-4"
                />
                <span>
                  <span className="font-medium">Aktif</span>
                  <span className="ml-2 text-gray-500">Boleh login ke panel admin</span>
                </span>
              </label>
            </div>

            <h3 className="mt-5 text-sm font-semibold">Pengampu Praktikum</h3>
            {isLoadingOptions ? (
              <p className="mt-2 text-sm text-gray-500">Memuat daftar praktikum...</p>
            ) : praktikumOptions.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">Belum ada praktikum terdaftar.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {praktikumOptions.map((option) => {
                  const checked = option.slug in editPlugs
                  const adaJadwal = option.plugs.length > 0
                  return (
                    <li key={option.id} className="rounded-md border p-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!checked && !adaJadwal}
                          onChange={() => togglePengampu(option.slug)}
                        />
                        <span className="font-medium">{option.label}</span>
                        <span className="text-gray-400">({option.slug})</span>
                      </label>
                      {checked &&
                        (adaJadwal ? (
                          <div className="mt-2 space-y-1.5">
                            <span className="text-sm text-gray-600">Plug yang diampu</span>
                            {option.plugs.map((jadwal) => (
                              <label key={jadwal.id} className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={(editPlugs[option.slug] ?? []).includes(jadwal.plug)}
                                  onChange={() => togglePlug(option.slug, jadwal.plug)}
                                />
                                <span>
                                  Plug {jadwal.plug}{' '}
                                  <span className="text-gray-400">
                                    ({jadwal.hari} {jadwal.jam_mulai}–{jadwal.jam_selesai})
                                  </span>
                                </span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-red-600">
                            Jadwal belum tersedia untuk praktikum ini.
                          </p>
                        ))}
                    </li>
                  )
                })}
              </ul>
            )}

            {editError && <p className="mt-3 text-sm text-red-600">{editError}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeEditModal}
                disabled={isSavingEdit}
                className="rounded-md border px-4 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit || isLoadingOptions}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSavingEdit ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
