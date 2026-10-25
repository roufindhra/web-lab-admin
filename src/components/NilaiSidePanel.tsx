import { useEffect, useState } from 'react'
import {
  praktikumService,
  ApiError,
  type AssignMahasiswa,
  type Pertemuan,
} from '@/services'

interface PraktikumInfo {
  id: number
  slug: string
  label: string
}

// mahasiswaId -> pertemuanId -> nama parameter -> nilai mentah (string agar enak diketik)
type NilaiState = Record<string, Record<string, Record<string, string>>>

export default function NilaiSidePanel({
  praktikum,
  plug,
  pertemuan,
  onClose,
  onSaved,
}: {
  praktikum: PraktikumInfo
  plug: string
  pertemuan: Pertemuan[]
  onClose: () => void
  onSaved: () => void
}) {
  const [students, setStudents] = useState<AssignMahasiswa[]>([])
  const [nilai, setNilai] = useState<NilaiState>({})
  const [expandedId, setExpandedId] = useState<number | null>(pertemuan[0]?.id ?? null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [savedId, setSavedId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      praktikumService.listMahasiswa(praktikum.id, plug, true),
      praktikumService.listNilaiPlug(praktikum.slug, plug),
    ])
      .then(([studentList, nilaiList]) => {
        if (cancelled) return
        setStudents(studentList)

        const matrix: NilaiState = {}
        for (const row of nilaiList) {
          for (const [pertemuanId, values] of Object.entries(row.nilai)) {
            for (const [param, value] of Object.entries(values)) {
              matrix[String(row.mahasiswa_id)] ??= {}
              matrix[String(row.mahasiswa_id)][pertemuanId] ??= {}
              matrix[String(row.mahasiswa_id)][pertemuanId][param] = String(value)
            }
          }
        }
        setNilai(matrix)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Gagal memuat data nilai.')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [praktikum.id, praktikum.slug, plug])

  const getInput = (mahasiswaId: number, pertemuanId: number, param: string): string =>
    nilai[String(mahasiswaId)]?.[String(pertemuanId)]?.[param] ?? ''

  const setInput = (mahasiswaId: number, pertemuanId: number, param: string, value: string) => {
    setNilai((current) => ({
      ...current,
      [String(mahasiswaId)]: {
        ...current[String(mahasiswaId)],
        [String(pertemuanId)]: {
          ...current[String(mahasiswaId)]?.[String(pertemuanId)],
          [param]: value,
        },
      },
    }))
  }

  const handleSave = (item: Pertemuan) => {
    const payload: Record<string, Record<string, number | null>> = {}

    for (const student of students) {
      const values: Record<string, number | null> = {}
      for (const param of item.parameter) {
        const raw = getInput(student.id, item.id, param.nama).trim()
        values[param.nama] = raw === '' ? null : Number(raw)
      }
      payload[String(student.id)] = values
    }

    setSavingId(item.id)
    setSavedId(null)
    setError(null)

    praktikumService
      .saveNilaiPlug(praktikum.slug, plug, item.id, payload)
      .then(() => {
        setSavedId(item.id)
        onSaved()
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Gagal menyimpan nilai.')
      })
      .finally(() => setSavingId(null))
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="animate-fade-in absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="animate-slide-in-right absolute inset-y-0 right-0 flex w-3/4 flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-bold">Input Nilai</h2>
            <p className="text-sm text-gray-600">
              {praktikum.label} &middot; {plug}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-100"
            aria-label="Tutup panel nilai"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <p className="py-12 text-center text-sm text-gray-500">Memuat...</p>
          ) : students.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
              Belum ada mahasiswa yang di-assign ke plug ini.
            </p>
          ) : pertemuan.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">
              Belum ada rule penilaian. Tambahkan pertemuan terlebih dulu.
            </p>
          ) : (
            <div className="space-y-3">
              {pertemuan.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-lg border">
                  <button
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <div>
                      <span className="font-medium">Pertemuan {item.nomor}</span>
                      {item.materi && (
                        <span className="ml-2 text-sm text-gray-600">
                          <span className="mr-1 font-mono text-xs">M{item.materi.materi_id}</span>
                          {item.materi.materi_nama}
                        </span>
                      )}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.parameter.map((p) => (
                          <span
                            key={p.nama}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                          >
                            {p.nama} {p.bobot}%
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{expandedId === item.id ? '▾' : '▸'}</span>
                  </button>

                  {expandedId === item.id && (
                    <div className="border-t">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                              <th className="px-4 py-2">NIM</th>
                              <th className="px-4 py-2">Nama</th>
                              {item.parameter.map((p) => (
                                <th key={p.nama} className="px-4 py-2">
                                  {p.nama} ({p.bobot}%)
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {students.map((student) => (
                              <tr key={student.id}>
                                <td className="px-4 py-2 font-mono text-gray-600">{student.nim}</td>
                                <td className="whitespace-nowrap px-4 py-2 font-medium">{student.nama}</td>
                                {item.parameter.map((p) => (
                                  <td key={p.nama} className="px-4 py-2">
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      step="0.5"
                                      value={getInput(student.id, item.id, p.nama)}
                                      onChange={(event) =>
                                        setInput(student.id, item.id, p.nama, event.target.value)
                                      }
                                      className="w-24 rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-center justify-end gap-3 border-t bg-gray-50 px-4 py-2">
                        {savedId === item.id && (
                          <span className="text-xs text-green-700">Tersimpan.</span>
                        )}
                        <button
                          onClick={() => handleSave(item)}
                          disabled={savingId === item.id}
                          className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {savingId === item.id ? 'Menyimpan...' : 'Simpan Nilai'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  )
}
