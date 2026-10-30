import { useEffect, useRef, useState } from 'react'
import {
  mahasiswaService,
  praktikumService,
  ApiError,
  type Mahasiswa,
  type MahasiswaListMeta,
  type MahasiswaImportResult,
  type Praktikum,
} from '@/services'
import { Button } from '@/components/ui/Buttons'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

const SEARCH_DEBOUNCE_MS = 400

export default function Students() {
  const [students, setStudents] = useState<Mahasiswa[]>([])
  const [meta, setMeta] = useState<MahasiswaListMeta | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [angkatan, setAngkatan] = useState('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<MahasiswaImportResult | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editingStudent, setEditingStudent] = useState<Mahasiswa | null>(null)
  const [praktikumOptions, setPraktikumOptions] = useState<Praktikum[]>([])
  const [editPlugs, setEditPlugs] = useState<Record<string, string>>({})
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
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
        angkatan: angkatan ? Number(angkatan) : undefined,
        page,
        sortDirection,
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
  }, [debouncedSearch, angkatan, page, sortDirection, refreshKey])

  const closeUploadModal = () => {
    setIsUploadOpen(false)
    setUploadFile(null)
    setUploadResult(null)
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpload = () => {
    if (!uploadFile) return

    setIsUploading(true)
    setUploadError(null)

    mahasiswaService
      .importCsv(uploadFile)
      .then((result) => {
        setUploadResult(result)
        setRefreshKey((key) => key + 1)
      })
      .catch((err) => {
        setUploadError(err instanceof ApiError ? err.message : 'Gagal mengunggah file.')
      })
      .finally(() => {
        setIsUploading(false)
      })
  }

  const hasActiveFilter = debouncedSearch || angkatan

  const openEditModal = (student: Mahasiswa) => {
    setEditingStudent(student)
    setEditError(null)
    setIsLoadingOptions(true)
    setEditPlugs(
      Object.fromEntries(
        (student.praktikum ?? []).map((slug) => [slug, String(student.praktikum_plug?.[slug] ?? '')]),
      ),
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

  const togglePraktikum = (slug: string) => {
    setEditPlugs((current) => {
      if (slug in current) {
        const next = { ...current }
        delete next[slug]
        return next
      }
      return { ...current, [slug]: '' }
    })
  }

  const handleSaveEdit = () => {
    if (!editingStudent) return

    const plugs: Record<string, string> = {}
    for (const [slug, value] of Object.entries(editPlugs)) {
      const option = praktikumOptions.find((p) => p.slug === slug)
      if (!option || !option.plugs.some((jadwal) => jadwal.plug === value)) {
        setEditError('Pilih plug yang tersedia untuk setiap praktikum yang dipilih.')
        return
      }
      plugs[slug] = value
    }

    setIsSavingEdit(true)
    setEditError(null)

    mahasiswaService
      .update(editingStudent.id, {
        praktikum: Object.keys(plugs),
        praktikum_plug: plugs,
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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-(--md-sys-color-on-surface)">
        Daftar Mahasiswa
      </h1>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="filled" onClick={() => setIsUploadOpen(true)}>
          Import CSV
        </Button>
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama atau NIM..."
          containerClassName="w-64"
        />
        <Input
          type="number"
          value={angkatan}
          onChange={(event) => {
            setPage(1)
            setAngkatan(event.target.value)
          }}
          placeholder="Angkatan"
          containerClassName="w-32"
        />
        {hasActiveFilter && (
          <Button
            variant="text"
            size="sm"
            onClick={() => {
              setSearch('')
              setAngkatan('')
              setPage(1)
            }}
          >
            Reset filter
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Card variant="outlined" className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-low) text-xs uppercase text-(--md-sys-color-on-surface-variant)">
            <tr>
              <th className="px-4 py-3">
                <button
                  onClick={() => {
                    setPage(1)
                    setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
                  }}
                  className="flex items-center gap-1 uppercase hover:text-(--md-sys-color-on-surface) transition-colors"
                >
                  NIM
                  <span className="text-[10px]">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                </button>
              </th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Angkatan</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Praktikum</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--md-sys-color-outline-variant) text-(--md-sys-color-on-surface)">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-(--md-sys-color-on-surface-variant)">
                  Memuat...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-(--md-sys-color-on-surface-variant)">
                  {hasActiveFilter ? 'Tidak ada mahasiswa yang cocok dengan filter.' : 'Belum ada data mahasiswa.'}
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-(--md-sys-color-surface-container-high) transition-colors">
                  <td className="px-4 py-3 font-mono">{student.nim}</td>
                  <td className="px-4 py-3 font-medium">{student.nama}</td>
                  <td className="px-4 py-3">{student.angkatan}</td>
                  <td className="px-4 py-3 text-(--md-sys-color-on-surface-variant)">{student.surel ?? '-'}</td>
                  <td className="px-4 py-3">{student.praktikum?.length ?? 0} praktikum</td>
                  <td className="px-4 py-3">
                    <Button
                      variant="text"
                      size="sm"
                      onClick={() => openEditModal(student)}
                      className="hover:underline px-2 py-1"
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {meta && (
        <div className="flex items-center justify-between text-sm text-(--md-sys-color-on-surface-variant)">
          <span>
            Menampilkan {students.length} dari {meta.total} mahasiswa
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((current) => current - 1)}
            >
              Sebelumnya
            </Button>
            <span>
              Halaman {meta.current_page} / {meta.last_page}
            </span>
            <Button
              variant="outlined"
              size="sm"
              disabled={page >= meta.last_page || isLoading}
              onClick={() => setPage((current) => current + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}

      {/* Modal Import CSV */}
      <Dialog
        isOpen={isUploadOpen}
        onClose={closeUploadModal}
        title="Import Mahasiswa dari CSV"
      >
        <div className="space-y-4">
          <p className="text-xs text-(--md-sys-color-on-surface-variant) leading-relaxed">
            File CSV harus memiliki baris header dengan kolom <code className="font-mono text-xs">nama</code> dan{' '}
            <code className="font-mono text-xs">nim</code> (9 digit). Surel dan angkatan akan diisi otomatis dari NIM.
          </p>

          {!uploadResult ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                className="w-full rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline) bg-(--md-sys-color-surface) px-3 py-2 text-xs text-(--md-sys-color-on-surface) file:mr-3 file:rounded-md file:border-0 file:bg-(--md-sys-color-primary) file:px-3 file:py-1.5 file:text-white"
              />
              {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
              <div className="pt-2 flex justify-end gap-2">
                <Button
                  variant="outlined"
                  onClick={closeUploadModal}
                  disabled={isUploading}
                >
                  Batal
                </Button>

                <Button
                  variant="filled"
                  onClick={handleUpload}
                  disabled={!uploadFile || isUploading}
                >
                  {isUploading ? 'Mengunggah...' : 'Upload'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-low) p-4 text-xs">
                <p className="font-medium text-(--md-sys-color-on-surface)">{uploadResult.message}</p>
                {uploadResult.failed.length > 0 && (
                  <ul className="mt-2 list-inside list-disc space-y-1 text-red-500">
                    {uploadResult.failed.map((item) => (
                      <li key={item.row}>
                        Baris {item.row}: {item.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="pt-2 flex justify-end">
                <Button variant="filled" onClick={closeUploadModal}>
                  Selesai
                </Button>
              </div>
            </>
          )}
        </div>
      </Dialog>

      {/* Modal Edit Praktikum Mahasiswa */}
      <Dialog
        isOpen={!!editingStudent}
        onClose={closeEditModal}
        title="Edit Praktikum"
      >
        {editingStudent && (
          <div className="space-y-4">
            <p className="text-xs text-(--md-sys-color-on-surface-variant)">
              {editingStudent.nama} ({editingStudent.nim})
            </p>

            {isLoadingOptions ? (
              <p className="text-xs text-(--md-sys-color-on-surface-variant)">Memuat daftar praktikum...</p>
            ) : praktikumOptions.length === 0 ? (
              <p className="text-xs text-(--md-sys-color-on-surface-variant)">Belum ada praktikum terdaftar.</p>
            ) : (
              <ul className="space-y-2">
                {praktikumOptions.map((option) => {
                  const checked = option.slug in editPlugs
                  const adaJadwal = option.plugs.length > 0
                  return (
                    <li key={option.id} className="rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline-variant) p-3">
                      <Checkbox
                        label={`${option.label} (${option.slug})`}
                        checked={checked}
                        disabled={!checked && !adaJadwal}
                        onCheckedChange={() => togglePraktikum(option.slug)}
                      />
                      {checked &&
                        (adaJadwal ? (
                          <div className="mt-2 pl-6">
                            <Select
                              label="Plug"
                              value={editPlugs[option.slug] ?? ''}
                              onValueChange={(val) =>
                                setEditPlugs((current) => ({
                                  ...current,
                                  [option.slug]: val,
                                }))
                              }
                              options={[
                                { value: '', label: 'Pilih plug...' },
                                ...option.plugs.map((jadwal) => ({
                                  value: jadwal.plug,
                                  label: `Plug ${jadwal.plug} (${jadwal.hari} ${jadwal.jam_mulai}–${jadwal.jam_selesai})`,
                                })),
                              ]}
                            />
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-red-500 pl-6">
                            Jadwal belum tersedia untuk praktikum ini.
                          </p>
                        ))}
                    </li>
                  )
                })}
              </ul>
            )}

            {editError && <p className="text-xs text-red-500">{editError}</p>}

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outlined"
                onClick={closeEditModal}
                disabled={isSavingEdit}
              >
                Batal
              </Button>
              <Button
                variant="filled"
                onClick={handleSaveEdit}
                disabled={isSavingEdit || isLoadingOptions}
              >
                {isSavingEdit ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}