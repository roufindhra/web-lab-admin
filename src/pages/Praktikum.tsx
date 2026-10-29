import { useEffect, useState } from "react";
import {
  praktikumService,
  ApiError,
  type Praktikum,
  type JadwalInput,
  type AssignMahasiswa,
} from "@/services";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

interface FormState {
  praktikum_label: string;
  semester: string;
  praktikum_slug: string;
  is_active: boolean;
  plugs: JadwalInput[];
}

const EMPTY_FORM: FormState = {
  praktikum_label: "",
  semester: "",
  praktikum_slug: "",
  is_active: true,
  plugs: [],
};

const HARI_OPTIONS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

const EMPTY_PLUG: JadwalInput = {
  plug: "",
  hari: "Senin",
  jam_mulai: "",
  jam_selesai: "",
  is_active: true,
};

function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function PraktikumPage() {
  const { isDosen } = useAdminAuth();
  const [items, setItems] = useState<Praktikum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugEdited, setSlugEdited] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [assignPlug, setAssignPlug] = useState<string | null>(null);
  const [assignStudents, setAssignStudents] = useState<AssignMahasiswa[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [assignSearch, setAssignSearch] = useState("");
  const [isLoadingAssign, setIsLoadingAssign] = useState(false);
  const [isSavingAssign, setIsSavingAssign] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [selectedAngkatan, setSelectedAngkatan] = useState("");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    praktikumService
      .getAll()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof ApiError
              ? err.message
              : "Gagal memuat data praktikum.",
          );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSlugEdited(false);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (item: Praktikum) => {
    setEditingId(item.id);
    setForm({
      praktikum_label: item.label,
      semester: item.semester,
      praktikum_slug: item.slug,
      is_active: item.is_active,
      plugs: item.plugs,
    });
    setSlugEdited(true);
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormError(null);
  };

  const handleLabelChange = (label: string) => {
    setForm((current) => ({
      ...current,
      praktikum_label: label,
      praktikum_slug: slugEdited ? current.praktikum_slug : slugify(label),
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setFormError(null);

    const payload = {
      praktikum_label: form.praktikum_label,
      semester: form.semester,
      praktikum_slug: form.praktikum_slug,
      is_active: form.is_active,
      plugs: form.plugs,
    };

    const request =
      editingId === null
        ? praktikumService.create(payload)
        : praktikumService.update(editingId, payload);

    request
      .then(() => {
        setIsFormOpen(false);
        setRefreshKey((key) => key + 1);
      })
      .catch((err) => {
        setFormError(
          err instanceof ApiError
            ? err.message
            : "Gagal menyimpan data praktikum.",
        );
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleDelete = (item: Praktikum) => {
    if (
      !window.confirm(
        `Hapus praktikum "${item.label}"? Tindakan ini tidak dapat dibatalkan.`,
      )
    ) {
      return;
    }

    setDeletingId(item.id);

    praktikumService
      .destroy(item.id)
      .then(() => setRefreshKey((key) => key + 1))
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "Gagal menghapus data praktikum.",
        );
      })
      .finally(() => {
        setDeletingId(null);
      });
  };

  const openAssign = (jadwal: JadwalInput) => {
    if (editingId === null || !jadwal.id || !jadwal.plug) return;

    setAssignPlug(jadwal.plug);
    setAssignSearch("");
    setAssignError(null);
    setIsLoadingAssign(true);
    setSelectedIds(new Set());

    praktikumService
      .listMahasiswa(form.praktikum_slug, jadwal.plug)
      .then((students) => {
        setAssignStudents(students);
        setSelectedIds(
          new Set(students.filter((s) => s.assigned).map((s) => s.id)),
        );
      })
      .catch((err) => {
        setAssignError(
          err instanceof ApiError
            ? err.message
            : "Gagal memuat daftar mahasiswa.",
        );
      })
      .finally(() => setIsLoadingAssign(false));
  };

  const closeAssign = () => {
    setAssignPlug(null);
    setAssignStudents([]);
    setSelectedIds(new Set());
    setAssignSearch("");
    setAssignError(null);
    setSelectedAngkatan("");
  };

  const toggleAssignStudent = (id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSaveAssign = () => {
    if (editingId === null || !assignPlug) return;

    setIsSavingAssign(true);
    setAssignError(null);

    praktikumService
      .assignMahasiswa(form.praktikum_slug, assignPlug, Array.from(selectedIds))
      .then(() => {
        closeAssign();
        setRefreshKey((key) => key + 1);
      })
      .catch((err) => {
        setAssignError(
          err instanceof ApiError
            ? err.message
            : "Gagal menyimpan peserta plug.",
        );
      })
      .finally(() => {
        setIsSavingAssign(false);
      });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Daftar Praktikum</h1>

      {isDosen && (
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={openCreate}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Tambah Praktikum
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Praktikum</th>
              <th className="px-4 py-3">Semester</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Jadwal</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  Memuat...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  Belum ada data praktikum.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.label}</td>
                  <td className="px-4 py-3">{item.semester}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">
                    {item.slug}
                  </td>
                  <td className="px-4 py-3">
                    {item.plugs.length === 0 ? (
                      <span className="text-gray-400">-</span>
                    ) : (
                      <div className="space-y-0.5">
                        {item.plugs.map((jadwal) => (
                          <div
                            key={jadwal.id}
                            className="whitespace-nowrap text-gray-600"
                          >
                            {jadwal.plug} · {jadwal.hari} {jadwal.jam_mulai}–
                            {jadwal.jam_selesai}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isDosen && (
                      <>
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
                          {deletingId === item.id ? "Menghapus..." : "Hapus"}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeForm}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-bold">
              {editingId === null ? "Tambah Praktikum" : "Edit Praktikum"}
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nama Praktikum
                </label>
                <input
                  type="text"
                  value={form.praktikum_label}
                  onChange={(event) => handleLabelChange(event.target.value)}
                  placeholder="mis. Praktikum Sistem Geospasial"
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Semester
                </label>
                <input
                  type="text"
                  value={form.semester}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      semester: event.target.value,
                    }))
                  }
                  placeholder="mis. Ganjil 2025/2026"
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Slug
                </label>
                <input
                  type="text"
                  value={form.praktikum_slug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    setForm((current) => ({
                      ...current,
                      praktikum_slug: event.target.value,
                    }));
                  }}
                  placeholder="praktikum-sistem-geospasial"
                  className="mt-1 w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Dipakai untuk URL. Huruf kecil, angka, dan tanda hubung.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      is_active: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Aktif
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Plug &amp; Jadwal
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        plugs: [...current.plugs, { ...EMPTY_PLUG }],
                      }))
                    }
                    className="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-gray-100"
                  >
                    + Tambah Plug
                  </button>
                </div>

                {form.plugs.length === 0 ? (
                  <p className="mt-2 text-xs text-gray-500">
                    Belum ada plug. Klik "Tambah Plug" untuk menambah jadwal.
                  </p>
                ) : (
                  editingId === null && (
                    <p className="mt-2 text-xs text-gray-500">
                      Simpan praktikum terlebih dulu untuk bisa assign mahasiswa
                      ke plug.
                    </p>
                  )
                )}
                {form.plugs.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {form.plugs.map((jadwal, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={jadwal.plug}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              plugs: current.plugs.map((p, i) =>
                                i === index
                                  ? { ...p, plug: event.target.value }
                                  : p,
                              ),
                            }))
                          }
                          placeholder="mis. Plug A"
                          className="w-32 rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                        <select
                          value={jadwal.hari}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              plugs: current.plugs.map((p, i) =>
                                i === index
                                  ? { ...p, hari: event.target.value }
                                  : p,
                              ),
                            }))
                          }
                          className="rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        >
                          {HARI_OPTIONS.map((hari) => (
                            <option key={hari} value={hari}>
                              {hari}
                            </option>
                          ))}
                        </select>
                        <input
                          type="time"
                          value={jadwal.jam_mulai}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              plugs: current.plugs.map((p, i) =>
                                i === index
                                  ? { ...p, jam_mulai: event.target.value }
                                  : p,
                              ),
                            }))
                          }
                          className="rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                        <span className="text-sm text-gray-500">–</span>
                        <input
                          type="time"
                          value={jadwal.jam_selesai}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              plugs: current.plugs.map((p, i) =>
                                i === index
                                  ? { ...p, jam_selesai: event.target.value }
                                  : p,
                              ),
                            }))
                          }
                          className="rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                        {editingId !== null && jadwal.id && jadwal.plug ? (
                          <button
                            type="button"
                            onClick={() => openAssign(jadwal)}
                            className="whitespace-nowrap rounded-md border px-2 py-1.5 text-xs font-medium hover:bg-gray-100"
                          >
                            Mahasiswa
                            {jadwal.mahasiswa_count
                              ? ` (${jadwal.mahasiswa_count})`
                              : ""}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            title="Simpan dulu untuk assign mahasiswa"
                            className="whitespace-nowrap rounded-md border px-2 py-1.5 text-xs font-medium text-gray-400 disabled:cursor-not-allowed"
                          >
                            Mahasiswa
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              plugs: current.plugs.filter(
                                (_, i) => i !== index,
                              ),
                            }))
                          }
                          className="rounded-md border border-red-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
                          aria-label={`Hapus plug baris ${index + 1}`}
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {formError && (
              <p className="mt-3 text-sm text-red-600">{formError}</p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeForm}
                disabled={isSaving}
                className="rounded-md border px-4 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={
                  !form.praktikum_label ||
                  !form.semester ||
                  !form.praktikum_slug ||
                  isSaving
                }
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {assignPlug !== null && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
          onClick={closeAssign}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg bg-white p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-bold">Assign Mahasiswa</h2>
            <p className="mt-1 text-sm text-gray-600">
              Pilih mahasiswa untuk {assignPlug}
              {form.praktikum_label ? ` — ${form.praktikum_label}` : ""}.
            </p>

            <input
              type="search"
              value={assignSearch}
              onChange={(event) => setAssignSearch(event.target.value)}
              placeholder="Cari nama atau NIM..."
              className="mt-3 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />

            {(() => {
              const angkatanOptions = Array.from(
                new Set(
                  assignStudents
                    .map((s) => String(s.nim).substring(2, 5))
                    .filter((code) => code.length === 3),
                ),
              ).sort((a, b) => b.localeCompare(a));

              const getAngkatan = (nim: string | number) =>
                String(nim).substring(3, 6);
              
              const filteredStudents = assignStudents.filter((student) => {
                const matchSearch =
                  !assignSearch ||
                  student.nama
                    .toLowerCase()
                    .includes(assignSearch.toLowerCase()) ||
                  String(student.nim).includes(assignSearch);

                const matchAngkatan =
                  !selectedAngkatan ||
                  getAngkatan(student.nim) === selectedAngkatan;

                return matchSearch && matchAngkatan;
              });

              const isAllFilteredSelected =
                filteredStudents.length > 0 &&
                filteredStudents.every((s) => selectedIds.has(s.id));

              const handleToggleSelectAll = () => {
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  if (isAllFilteredSelected) {
                    filteredStudents.forEach((s) => next.delete(s.id));
                  } else {
                    filteredStudents.forEach((s) => next.add(s.id));
                  }
                  return next;
                });
              };

              return (
                <>
                  <div className="mt-3 flex items-center justify-between gap-2 border-b pb-2">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={isAllFilteredSelected}
                        onChange={handleToggleSelectAll}
                        disabled={filteredStudents.length === 0}
                        className="rounded border-gray-300"
                      />
                      Pilih Semua ({filteredStudents.length})
                    </label>

                    <select
                      value={selectedAngkatan}
                      onChange={(e) => setSelectedAngkatan(e.target.value)}
                      className="rounded-md border px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    >
                      <option value="">Semua Angkatan</option>
                      {angkatanOptions.map((code) => (
                        <option key={code} value={code}>
                          Angkatan 20{code.substring(1, 3)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {assignError && (
                    <p className="mt-3 text-sm text-red-600">{assignError}</p>
                  )}

                  <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-md border">
                    {isLoadingAssign ? (
                      <p className="px-3 py-8 text-center text-sm text-gray-500">
                        Memuat daftar mahasiswa...
                      </p>
                    ) : filteredStudents.length === 0 ? (
                      <p className="px-3 py-8 text-center text-sm text-gray-500">
                        Mahasiswa tidak ditemukan.
                      </p>
                    ) : (
                      <ul className="divide-y">
                        {filteredStudents.map((student) => (
                          <li key={student.id}>
                            <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(student.id)}
                                onChange={() => toggleAssignStudent(student.id)}
                              />
                              <span className="font-mono text-gray-600">
                                {student.nim}
                              </span>
                              <span className="font-medium">
                                {student.nama}
                              </span>
                              {student.assigned && (
                                <span className="ml-auto text-xs text-gray-400">
                                  terdaftar
                                </span>
                              )}
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              );
            })()}

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedIds.size} dipilih
              </span>
              <div className="flex gap-2">
                <button
                  onClick={closeAssign}
                  disabled={isSavingAssign}
                  className="rounded-md border px-4 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveAssign}
                  disabled={isLoadingAssign || isSavingAssign}
                  className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSavingAssign ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
