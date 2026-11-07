import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { praktikumService, ApiError, type Praktikum, type AssignMahasiswa, type Pertemuan } from '@/services'
import { getFormErrorMessages } from '@/utils/errors'
import PenilaianSection from '@/components/PenilaianSection'
import NilaiSidePanel from '@/components/NilaiSidePanel'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/Buttons'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { SortSummary } from '@/components/ui/SortSummary'
import { SortableTh } from '@/components/ui/SortableTh'
import { useTableSort } from '@/hooks/useTableSort'
import { sortRows } from '@/utils/tableSort'

function KelompokInput({
  slug,
  student,
  onSaved,
}: {
  slug: string
  student: AssignMahasiswa
  onSaved: (mahasiswaId: number, kelompok: string | null) => void
}) {
  const [value, setValue] = useState(student.kelompok ?? '')
  const [isSaving, setIsSaving] = useState(false)

  const save = () => {
    const next = value.trim()
    if (next === (student.kelompok ?? '')) return

    setIsSaving(true)
    praktikumService
      .updateKelompok(slug, student.id, next)
      .then((kelompok) => onSaved(student.id, kelompok))
      .catch(() => setValue(student.kelompok ?? ''))
      .finally(() => setIsSaving(false))
  }

  return (
    <Input
      type="text"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={save}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
      }}
      placeholder="Kelompok..."
      disabled={isSaving}
      containerClassName="w-32"
    />
  )
}

export default function PraktikumDetail() {
  const { slug } = useParams<{ slug: string }>()

  return <Detail key={slug} slug={slug} />
}

function Detail({ slug }: { slug?: string }) {
  const { canAmpuPlug } = useAdminAuth()
  const [praktikum, setPraktikum] = useState<Praktikum | null>(null)
  const [pertemuan, setPertemuan] = useState<Pertemuan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [expandedPlug, setExpandedPlug] = useState<string | null>(null)
  const [mahasiswa, setMahasiswa] = useState<AssignMahasiswa[]>([])
  const [isLoadingMahasiswa, setIsLoadingMahasiswa] = useState(false)
  const [mahasiswaError, setMahasiswaError] = useState<string | null>(null)

  const [panelPlug, setPanelPlug] = useState<string | null>(null)
  const { sorts, toggleSort, removeSort, resetSort } = useTableSort({
    column: 'nim',
    direction: 'asc',
  })

  const sortedMahasiswa = sortRows(
    mahasiswa,
    sorts,
    (student, column) => {
      if (column === 'nim') return student.nim
      if (column === 'nama') return student.nama
      if (column === 'kelompok') return student.kelompok ?? ''
      if (column.startsWith('skor:')) {
        return student.skor?.[column.slice(5)] ?? null
      }

      return null
    },
  )

  const handleKelompokSaved = (mahasiswaId: number, kelompok: string | null) => {
    setMahasiswa((current) =>
      current.map((m) => (m.id === mahasiswaId ? { ...m, kelompok } : m)),
    )
  }

  const loadMahasiswa = (current: Praktikum, plugName: string) => {
    setIsLoadingMahasiswa(true)
    setMahasiswaError(null)

    praktikumService
      .listMahasiswa(current.slug, plugName, true)
      .then((students) => setMahasiswa(students))
      .catch((err) => {
        // Error validasi (422) tampil inline; error lain ditangani modal global.
        const messages = getFormErrorMessages(err)
        setMahasiswaError(messages.length > 0 ? messages.join(' ') : null)
      })
      .finally(() => setIsLoadingMahasiswa(false))
  }

  const refreshPertemuan = (current: Praktikum) => {
    praktikumService
      .listPertemuan(current.slug)
      .then(setPertemuan)
      .catch(() => {
        // Error sudah ditampilkan otomatis di modal global.
        setError('Gagal memuat rule penilaian.')
      })
  }

  useEffect(() => {
    if (!slug) return

    let cancelled = false

    praktikumService
      .getBySlug(slug)
      .then((data) => {
        if (cancelled) return
        setPraktikum(data)
        refreshPertemuan(data)
      })
      .catch((err) => {
        if (cancelled) return
        // Detail pesan error ditampilkan modal global; di sini cukup state fallback halaman.
        setError(err instanceof ApiError && err.status === 404 ? 'Praktikum tidak ditemukan.' : 'Gagal memuat data praktikum.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  const togglePlug = (plugName: string) => {
    if (praktikum === null) return

    if (expandedPlug === plugName) {
      setExpandedPlug(null)
      setMahasiswa([])
      setMahasiswaError(null)
      return
    }

    setExpandedPlug(plugName)
    loadMahasiswa(praktikum, plugName)
  }

  if (isLoading) {
    return <p className="text-sm text-(--md-sys-color-on-surface-variant)">Memuat...</p>
  }

  if (error || praktikum === null) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-500">{error ?? 'Praktikum tidak ditemukan.'}</p>
        <Link to="/praktikum">
          <Button variant="outlined" size="sm">
            ← Kembali ke daftar praktikum
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/praktikum"
          className="text-xs font-semibold text-(--md-sys-color-primary) hover:underline"
        >
          ← Kembali ke Daftar Praktikum
        </Link>

        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-(--md-sys-color-on-surface)">
            {praktikum.label}
          </h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              praktikum.is_active
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {praktikum.is_active ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>
        <p className="mt-1 text-sm text-(--md-sys-color-on-surface-variant)">
          Semester {praktikum.semester} &middot;{' '}
          <span className="font-mono text-xs">/praktikum/{praktikum.slug}</span>
        </p>
      </div>

      <PenilaianSection
        slug={praktikum.slug}
        pertemuan={pertemuan}
        onChanged={() => refreshPertemuan(praktikum)}
      />

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-(--md-sys-color-on-surface)">
          Plug &amp; Jadwal
        </h2>

        {praktikum.plugs.length === 0 ? (
          <p className="text-sm text-(--md-sys-color-on-surface-variant)">
            Belum ada plug untuk praktikum ini.
          </p>
        ) : (
          <div className="space-y-3">
            {praktikum.plugs.map((jadwal) => (
              <Card key={jadwal.id} variant="outlined" className="p-0 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <span className="font-semibold text-(--md-sys-color-on-surface)">
                      {jadwal.plug}
                    </span>
                    <span className="ml-3 text-sm text-(--md-sys-color-on-surface-variant)">
                      {jadwal.hari}, {jadwal.jam_mulai}&ndash;{jadwal.jam_selesai}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outlined"
                      size="sm"
                      onClick={() => setPanelPlug(jadwal.plug)}
                      disabled={!canAmpuPlug(slug, jadwal.plug)}
                      title={canAmpuPlug(slug, jadwal.plug) ? undefined : 'Di luar plug ampuan Anda'}
                    >
                      Input Nilai
                    </Button>
                    <Button
                      variant="outlined"
                      size="sm"
                      onClick={() => togglePlug(jadwal.plug)}
                    >
                      {expandedPlug === jadwal.plug ? 'Sembunyikan' : 'Lihat'} Mahasiswa
                      {jadwal.mahasiswa_count ? ` (${jadwal.mahasiswa_count})` : ''}
                    </Button>
                  </div>
                </div>

                {expandedPlug === jadwal.plug && (
                  <div className="border-t border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-low) p-4">
                    {isLoadingMahasiswa ? (
                      <p className="py-4 text-center text-xs text-(--md-sys-color-on-surface-variant)">
                        Memuat daftar mahasiswa...
                      </p>
                    ) : mahasiswaError ? (
                      <p className="py-2 text-xs text-red-500">{mahasiswaError}</p>
                    ) : mahasiswa.length === 0 ? (
                      <p className="py-4 text-center text-xs text-(--md-sys-color-on-surface-variant)">
                        Belum ada mahasiswa di plug ini.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <SortSummary
                          sorts={sorts}
                          onRemove={removeSort}
                          onReset={resetSort}
                          labels={{
                            nim: "NIM",
                            nama: "Nama",
                            kelompok: "Kelompok",
                            ...Object.fromEntries(
                              pertemuan.map((p) => [
                                `skor:${p.id}`,
                                `M:${p.nomor}`,
                              ]),
                            ),
                          }}
                        />
                        <Card variant="outlined" className="p-0 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="border-b border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container) text-xs uppercase text-(--md-sys-color-on-surface-variant)">
                            <tr>
                              <SortableTh
                                label="NIM"
                                column="nim"
                                sorts={sorts}
                                onSort={toggleSort}
                                className="px-3 py-2"
                              />
                              <SortableTh
                                label="Nama"
                                column="nama"
                                sorts={sorts}
                                onSort={toggleSort}
                                className="px-3 py-2"
                              />
                              <SortableTh
                                label="Kelompok"
                                column="kelompok"
                                sorts={sorts}
                                onSort={toggleSort}
                                className="px-3 py-2"
                              />
                              {pertemuan.map((p) => (
                                <SortableTh
                                  key={p.id}
                                  label={`M:${p.nomor}`}
                                  column={`skor:${p.id}`}
                                  sorts={sorts}
                                  onSort={toggleSort}
                                  className="whitespace-nowrap px-3 py-2"
                                />
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-(--md-sys-color-outline-variant) text-(--md-sys-color-on-surface)">
                            {sortedMahasiswa.map((m) => (
                              <tr key={m.id} className="hover:bg-(--md-sys-color-surface-container-high) transition-colors">
                                <td className="px-3 py-2 font-mono text-(--md-sys-color-on-surface-variant)">{m.nim}</td>
                                <td className="whitespace-nowrap px-3 py-2 font-medium">{m.nama}</td>
                                <td className="px-3 py-2">
                                  <KelompokInput
                                    slug={praktikum.slug}
                                    student={m}
                                    onSaved={handleKelompokSaved}
                                  />
                                </td>
                                {pertemuan.map((p) => (
                                  <td key={p.id} className="px-3 py-2 text-center text-(--md-sys-color-on-surface-variant)">
                                    {m.skor?.[String(p.id)] ?? '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Card>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {panelPlug !== null && (
        <NilaiSidePanel
          key={panelPlug}
          praktikum={{ id: praktikum.id, slug: praktikum.slug, label: praktikum.label }}
          plug={panelPlug}
          canEdit={canAmpuPlug(slug, panelPlug)}
          pertemuan={pertemuan}
          onClose={() => setPanelPlug(null)}
          onSaved={() => {
            if (expandedPlug === panelPlug) {
              loadMahasiswa(praktikum, panelPlug)
            }
          }}
        />
      )}
    </div>
  )
}