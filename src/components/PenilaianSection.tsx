import { useEffect, useState } from 'react'
import {
  praktikumService,
  kurikulumService,
  ApiError,
  type KurikulumMateri,
  type Pertemuan,
  type PertemuanPayload,
  type ParameterPenilaian,
} from '@/services'

interface FormState {
  nomor: string
  materi: string
  tanggal: string
  bobot: string
  parameter: { nama: string; bobot: string }[]
}

const EMPTY_FORM: FormState = {
  nomor: '',
  materi: '',
  tanggal: '',
  bobot: '1',
  parameter: [{ nama: '', bobot: '' }],
}

export default function PenilaianSection({
  slug,
  pertemuan,
  onChanged,
}: {
  slug: string
  pertemuan: Pertemuan[]
  onChanged: () => void
}) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [materiList, setMateriList] = useState<KurikulumMateri[]>([])
  const [isLoadingMateri, setIsLoadingMateri] = useState(false)

  const totalBobot = form.parameter.reduce((sum, p) => sum + (Number(p.bobot) || 0), 0)

  // Dropdown hanya memuat materi yang dideklarasikan di kurikulum praktikum ini
  // (endpoint sudah terscope per praktikum & terurut materi_id).
  useEffect(() => {
    setIsLoadingMateri(true)
    kurikulumService
      .getAll(slug)
      .then(setMateriList)
      .catch(() => setMateriList([]))
      .finally(() => setIsLoadingMateri(false))
  }, [slug])

  // Materi pilihan: aktif, plus materi pertemuan yang sedang diedit
  // (bisa saja sudah diarsipkan tapi pertemuannya masih ada).
  const materiOptions = materiList.filter(
    (m) => m.is_active || (editingId !== null && m.id === Number(form.materi)),
  )

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, nomor: String(pertemuan.length + 1) })
    setFormError(null)
    setIsFormOpen(true)
  }

  const openEdit = (item: Pertemuan) => {
    setEditingId(item.id)
    setForm({
      nomor: String(item.nomor),
      materi: item.materi ? String(item.materi.id) : '',
      tanggal: item.tanggal ?? '',
      bobot: String(item.bobot),
      parameter: item.parameter.map((p) => ({ nama: p.nama, bobot: String(p.bobot) })),
    })
    setFormError(null)
    setIsFormOpen(true)
  }

  const handleSave = () => {
    setIsSaving(true)
    setFormError(null)

    const parameter: ParameterPenilaian[] = form.parameter
      .filter((p) => p.nama.trim() !== '')
      .map((p) => ({ nama: p.nama.trim(), bobot: Number(p.bobot) }))

    const payload: PertemuanPayload = {
      nomor: Number(form.nomor),
      materi_id: Number(form.materi),
      tanggal: form.tanggal || null,
      bobot: Number(form.bobot),
      parameter,
    }
    const request =
      editingId === null
        ? praktikumService.createPertemuan(slug, payload)
        : praktikumService.updatePertemuan(slug, editingId, payload)

    request
      .then(() => {
        setIsFormOpen(false)
        onChanged()
      })
      .catch((err) => {
        setFormError(err instanceof ApiError ? err.message : 'Gagal menyimpan pertemuan.')
      })
      .finally(() => setIsSaving(false))
  }

  const handleDelete = (item: Pertemuan) => {
    if (!window.confirm(`Hapus pertemuan ${item.nomor}? Nilai yang sudah diinput juga akan terhapus.`)) {
      return
    }

    setDeletingId(item.id)

    praktikumService
      .destroyPertemuan(slug, item.id)
      .then(() => onChanged())
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Gagal menghapus pertemuan.')
      })
      .finally(() => setDeletingId(null))
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Rule Penilaian (Pertemuan)</h2>
        <button
          onClick={openCreate}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
        >
          + Tambah Pertemuan
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">No.</th>
              <th className="px-4 py-3">Materi</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Bobot</th>
              <th className="px-4 py-3">Parameter</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pertemuan.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Belum ada rule penilaian. Tambahkan pertemuan untuk mulai menilai.
                </td>
              </tr>
            ) : (
              pertemuan.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.nomor}</td>
                  <td className="px-4 py-3">
                    {item.materi ? (
                      <span>
                        <span className="mr-1.5 font-mono text-xs text-gray-500">M{item.materi.materi_id}</span>
                        {item.materi.materi_nama}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{item.tanggal ?? <span className="text-gray-400">-</span>}</td>
                  <td className="px-4 py-3">{item.bobot}%</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.parameter.map((p) => (
                        <span
                          key={p.nama}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                        >
                          {p.nama} {p.bobot}%
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(item)}
                      className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      className="ml-2 rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {deletingId === item.id ? 'Menghapus...' : 'Hapus'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setIsFormOpen(false)}>
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold">
              {editingId === null ? 'Tambah Pertemuan' : `Edit Pertemuan ${form.nomor}`}
            </h3>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nomor</label>
                <input
                  type="number"
                  min={1}
                  value={form.nomor}
                  onChange={(event) => setForm((c) => ({ ...c, nomor: event.target.value }))}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bobot (%)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.bobot}
                  onChange={(event) => setForm((c) => ({ ...c, bobot: event.target.value }))}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                <input
                  type="date"
                  value={form.tanggal}
                  onChange={(event) => setForm((c) => ({ ...c, tanggal: event.target.value }))}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700">Materi Kurikulum</label>
              {materiOptions.length === 0 ? (
                <p className="mt-1 text-sm text-red-600">
                  Belum ada materi aktif di kurikulum praktikum ini. Deklarasikan materi terlebih dulu
                  di menu Kurikulum.
                </p>
              ) : (
                <select
                  value={form.materi}
                  onChange={(event) => setForm((c) => ({ ...c, materi: event.target.value }))}
                  disabled={isLoadingMateri}
                  className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50"
                >
                  <option value="">{isLoadingMateri ? 'Memuat materi...' : 'Pilih materi...'}</option>
                  {materiOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.materi_id}. {m.materi_nama}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Parameter &amp; Bobot</label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((c) => ({ ...c, parameter: [...c.parameter, { nama: '', bobot: '' }] }))
                  }
                  className="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-gray-100"
                >
                  + Tambah Parameter
                </button>
              </div>

              <div className="mt-2 space-y-2">
                {form.parameter.map((param, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={param.nama}
                      onChange={(event) =>
                        setForm((c) => ({
                          ...c,
                          parameter: c.parameter.map((p, i) =>
                            i === index ? { ...p, nama: event.target.value } : p,
                          ),
                        }))
                      }
                      placeholder="mis. kehadiran"
                      className="flex-1 rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={param.bobot}
                      onChange={(event) =>
                        setForm((c) => ({
                          ...c,
                          parameter: c.parameter.map((p, i) =>
                            i === index ? { ...p, bobot: event.target.value } : p,
                          ),
                        }))
                      }
                      placeholder="%"
                      className="w-20 rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((c) => ({
                          ...c,
                          parameter: c.parameter.filter((_, i) => i !== index),
                        }))
                      }
                      className="rounded-md border border-red-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
                      aria-label={`Hapus parameter baris ${index + 1}`}
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>

              <p
                className={`mt-2 text-xs font-medium ${
                  totalBobot === 100 ? 'text-green-700' : 'text-red-600'
                }`}
              >
                Total bobot parameter: {totalBobot} / 100
              </p>
            </div>

            {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setIsFormOpen(false)}
                disabled={isSaving}
                className="rounded-md border px-4 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={
                  !form.materi ||
                  !form.nomor ||
                  !form.bobot ||
                  form.parameter.some((p) => !p.nama || !p.bobot) ||
                  totalBobot !== 100 ||
                  isSaving
                }
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
