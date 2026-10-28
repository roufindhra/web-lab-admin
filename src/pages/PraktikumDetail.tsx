import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { praktikumService, ApiError, type Praktikum, type AssignMahasiswa, type Pertemuan } from '@/services'
import PenilaianSection from '@/components/PenilaianSection'
import NilaiSidePanel from '@/components/NilaiSidePanel'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

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
    <input
      type="text"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={save}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
      }}
      placeholder="Kelompok..."
      disabled={isSaving}
      className="w-36 rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
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
        setMahasiswaError(err instanceof ApiError ? err.message : 'Gagal memuat daftar mahasiswa.')
      })
      .finally(() => setIsLoadingMahasiswa(false))
  }

  const refreshPertemuan = (current: Praktikum) => {
    praktikumService
      .listPertemuan(current.slug)
      .then(setPertemuan)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Gagal memuat rule penilaian.')
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
        if (err instanceof ApiError && err.status === 404) {
          setError('Praktikum tidak ditemukan.')
        } else {
          setError(err instanceof ApiError ? err.message : 'Gagal memuat data praktikum.')
        }
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
    return <p className="text-sm text-gray-500">Memuat...</p>
  }

  if (error || praktikum === null) {
    return (
      <div>
        <p className="text-sm text-red-600">{error ?? 'Praktikum tidak ditemukan.'}</p>
        <Link to="/praktikum" className="mt-3 inline-block text-sm text-gray-600 hover:text-gray-900 underline">
          Kembali ke daftar praktikum
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link to="/praktikum" className="text-sm text-gray-500 hover:text-gray-900">
        &larr; Daftar Praktikum
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <h1 className="text-2xl font-bold">{praktikum.label}</h1>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            praktikum.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {praktikum.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-600">
        Semester {praktikum.semester} &middot;{' '}
        <span className="font-mono text-xs">/praktikum/{praktikum.slug}</span>
      </p>

      <div className="mt-8">
        <PenilaianSection
          slug={praktikum.slug}
          pertemuan={pertemuan}
          onChanged={() => refreshPertemuan(praktikum)}
        />
      </div>

      <h2 className="mt-8 text-lg font-bold">Plug &amp; Jadwal</h2>

      {praktikum.plugs.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">Belum ada plug untuk praktikum ini.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {praktikum.plugs.map((jadwal) => (
            <div key={jadwal.id} className="overflow-hidden rounded-lg border bg-white">
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="font-medium">{jadwal.plug}</span>
                  <span className="ml-3 text-sm text-gray-600">
                    {jadwal.hari}, {jadwal.jam_mulai}&ndash;{jadwal.jam_selesai}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPanelPlug(jadwal.plug)}
                    disabled={!canAmpuPlug(slug, jadwal.plug)}
                    title={canAmpuPlug(slug, jadwal.plug) ? undefined : 'Di luar plug ampuan Anda'}
                    className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 hover:disabled:bg-transparent"
                  >
                    Input Nilai
                  </button>
                  <button
                    onClick={() => togglePlug(jadwal.plug)}
                    className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-gray-100"
                  >
                    {expandedPlug === jadwal.plug ? 'Sembunyikan' : 'Lihat'} Mahasiswa
                    {jadwal.mahasiswa_count ? ` (${jadwal.mahasiswa_count})` : ''}
                  </button>
                </div>
              </div>

              {expandedPlug === jadwal.plug && (
                <div className="border-t bg-gray-50 px-4 py-3">
                  {isLoadingMahasiswa ? (
                    <p className="py-4 text-center text-sm text-gray-500">Memuat daftar mahasiswa...</p>
                  ) : mahasiswaError ? (
                    <p className="py-2 text-sm text-red-600">{mahasiswaError}</p>
                  ) : mahasiswa.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-500">Belum ada mahasiswa di plug ini.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-md border bg-white">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                          <tr>
                            <th className="px-3 py-2">NIM</th>
                            <th className="px-3 py-2">Nama</th>
                            <th className="px-3 py-2">Kelompok</th>
                            {pertemuan.map((p) => (
                              <th key={p.id} className="whitespace-nowrap px-3 py-2">
                                M:{p.nomor}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {mahasiswa.map((m) => (
                            <tr key={m.id}>
                              <td className="px-3 py-2 font-mono text-gray-600">{m.nim}</td>
                              <td className="whitespace-nowrap px-3 py-2 font-medium">{m.nama}</td>
                              <td className="px-3 py-2">
                                <KelompokInput
                                  slug={praktikum.slug}
                                  student={m}
                                  onSaved={handleKelompokSaved}
                                />
                              </td>
                              {pertemuan.map((p) => (
                                <td key={p.id} className="px-3 py-2 text-center">
                                  {m.skor?.[String(p.id)] ?? '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
