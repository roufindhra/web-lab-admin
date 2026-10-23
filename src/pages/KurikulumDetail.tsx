import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  kurikulumService,
  praktikumService,
  ApiError,
  type KurikulumMateri,
  type Praktikum,
} from '@/services'
import MateriFormModal from './Kurikulum/_components/MateriFormModal'

export default function KurikulumDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [praktikum, setPraktikum] = useState<Praktikum | null>(null)
  const [materiList, setMateriList] = useState<KurikulumMateri[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMateri, setEditingMateri] = useState<KurikulumMateri | null>(null)

  const refresh = useCallback(async () => {
    if (!slug) return
    try {
      const data = await kurikulumService.getAll(slug)
      setMateriList(data)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat kurikulum.')
    }
  }, [slug])

  useEffect(() => {
    if (!slug) return
    Promise.all([praktikumService.getBySlug(slug), kurikulumService.getAll(slug)])
      .then(([praktikumData, materiData]) => {
        setPraktikum(praktikumData)
        setMateriList(materiData)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat data.'))
      .finally(() => setIsLoading(false))
  }, [slug])

  const handleArsipkan = async (materi: KurikulumMateri) => {
    if (!slug) return
    try {
      await kurikulumService.destroy(slug, materi.id)
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengarsipkan materi.')
    }
  }

  const handlePulihkan = async (materi: KurikulumMateri) => {
    if (!slug) return
    try {
      await kurikulumService.restore(slug, materi.id)
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memulihkan materi.')
    }
  }

  const materiAktif = materiList.filter((m) => m.is_active)
  const materiArsip = materiList.filter((m) => !m.is_active)

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-500">Memuat...</div>
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{praktikum?.label ?? 'Kurikulum'}</h1>
          <p className="mt-1 text-sm text-gray-600">Susunan materi yang akan diajarkan.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingMateri(null)
            setModalOpen(true)
          }}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
        >
          + Tambah Materi
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Materi Aktif ({materiAktif.length})
      </h2>
      <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">No.</th>
              <th className="px-4 py-3">Materi</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {materiAktif.map((materi) => (
              <tr key={materi.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{materi.materi_id}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{materi.materi_nama}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMateri(materi)
                      setModalOpen(true)
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleArsipkan(materi)}
                    className="ml-4 text-sm text-red-600 hover:text-red-800"
                  >
                    Arsipkan
                  </button>
                </td>
              </tr>
            ))}
            {materiAktif.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                  Belum ada materi. Klik "Tambah Materi" untuk menyusun kurikulum.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {materiArsip.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Arsip ({materiArsip.length})
          </h2>
          <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-gray-100">
                {materiArsip.map((materi) => (
                  <tr key={materi.id} className="bg-gray-50/50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">{materi.materi_id}</td>
                    <td className="px-4 py-3 text-gray-500 line-through">{materi.materi_nama}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void handlePulihkan(materi)}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Pulihkan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modalOpen && slug && (
        <MateriFormModal
          slug={slug}
          materi={editingMateri}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false)
            void refresh()
          }}
        />
      )}
    </div>
  )
}
