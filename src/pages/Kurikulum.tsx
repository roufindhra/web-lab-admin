import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { praktikumService, type Praktikum } from '@/services'

export default function Kurikulum() {
  const [praktikumList, setPraktikumList] = useState<Praktikum[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    praktikumService
      .getAll()
      .then(setPraktikumList)
      .catch(() => setError('Gagal memuat daftar praktikum.'))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Kurikulum</h1>
      <p className="mt-1 text-sm text-gray-600">
        Pilih praktikum untuk mengelola susunan materi yang akan diajarkan.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {isLoading && <p className="mt-4 text-sm text-gray-500">Memuat...</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {praktikumList.map((praktikum) => (
          <button
            key={praktikum.id}
            type="button"
            onClick={() => navigate(`/kurikulum/${praktikum.slug}`)}
            className="rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md"
          >
            <h2 className="font-semibold text-gray-900">{praktikum.label}</h2>
            <span className="mt-2 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
              Semester {praktikum.semester}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
