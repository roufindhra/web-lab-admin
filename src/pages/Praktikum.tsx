import { useEffect, useState } from "react";
import { SortSummary } from "@/components/ui/SortSummary";
import { SortableTh } from "@/components/ui/SortableTh";
import { useTableSort } from "@/hooks/useTableSort";
import {
  praktikumService,
  type Praktikum,
  type JadwalInput,
  type AssignMahasiswa,
} from "@/services";
import { getFormErrorMessages } from "@/utils/errors";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/components/ui/Buttons";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useLocation } from "react-router-dom";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const PRAKTIKUM_STORAGE_KEY = "sudah_lihat_walkthrough_praktikum";

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
  { value: "Senin", label: "Senin" },
  { value: "Selasa", label: "Selasa" },
  { value: "Rabu", label: "Rabu" },
  { value: "Kamis", label: "Kamis" },
  { value: "Jumat", label: "Jumat" },
  { value: "Sabtu", label: "Sabtu" },
  { value: "Minggu", label: "Minggu" },
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
  const location = useLocation();
  const [items, setItems] = useState<Praktikum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const { sorts, toggleSort, removeSort, resetSort } = useTableSort({
    column: "praktikum_label",
    direction: "asc",
  });

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    praktikumService
      .getAll({ sorts })
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        // Error sudah ditampilkan otomatis di modal global.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey, sorts]);

  // driver.js buat walkthrough

  useEffect(() => {
    if (!isDosen || location.pathname !== "/praktikum") return;

    const hasSeenTour = localStorage.getItem(PRAKTIKUM_STORAGE_KEY);
    if (hasSeenTour === "true") return;

    const driverObj = driver({
      showProgress: false,
      onDestroyStarted: () => {
        localStorage.setItem(PRAKTIKUM_STORAGE_KEY, "true");
        driverObj.destroy();
      },
      steps: [
        {
          popover: {
            title: "Daftar Praktikum",
            description:
              "Lihat daftar semua praktikum yang dinaungi oleh Laboratorium Survei Geodesi dan Geometri.",
            side: "left",
            align: "start",
          },
        },
        {
          element: "#tambah-praktikum",
          popover: {
            title: "Tambah Praktikum",
            description:
              "Tambahkan praktikum yang belum ada melalui tombol Tambah Praktikum.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#edit-praktikum",
          popover: {
            title: "Edit Praktikum",
            description:
              "Edit nama praktikum, semester pelaksanaan, slug, status, dan plug serta praktikan praktikum.",
            side: "right",
            align: "start",
          },
        },
      ],
    });

    const timer = setTimeout(() => {
      driverObj.drive();
    }, 100);

    return () => {
      clearTimeout(timer);
      driverObj.destroy();
    };
  }, [location.pathname, isDosen]);

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
        // Error validasi (422) tampil inline; error lain ditangani modal global.
        const messages = getFormErrorMessages(err);
        setFormError(messages.length > 0 ? messages.join(" ") : null);
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
      .catch(() => {
        // Error sudah ditampilkan otomatis di modal global.
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
        // Error validasi (422) tampil inline; error lain ditangani modal global.
        const messages = getFormErrorMessages(err);
        setAssignError(messages.length > 0 ? messages.join(" ") : null);
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
        // Error validasi (422) tampil inline; error lain ditangani modal global.
        const messages = getFormErrorMessages(err);
        setAssignError(messages.length > 0 ? messages.join(" ") : null);
      })
      .finally(() => {
        setIsSavingAssign(false);
      });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-(--md-sys-color-on-surface)">
          Daftar Praktikum
        </h1>
        {isDosen && (
          <Button id="tambah-praktikum" variant="filled" onClick={openCreate}>
            + Tambah Praktikum
          </Button>
        )}
      </div>

      <SortSummary
        sorts={sorts}
        onRemove={removeSort}
        onReset={resetSort}
      />

      <Card variant="outlined" className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-low) text-xs uppercase text-(--md-sys-color-on-surface-variant)">
            <tr>
              <SortableTh
                label="Praktikum"
                column="praktikum_label"
                sorts={sorts}
                onSort={toggleSort}
              />
              <SortableTh
                label="Semester"
                column="semester"
                sorts={sorts}
                onSort={toggleSort}
              />
              <SortableTh
                label="Slug"
                column="praktikum_slug"
                sorts={sorts}
                onSort={toggleSort}
              />
              <th className="px-4 py-3">Jadwal</th>
              <SortableTh
                label="Status"
                column="is_active"
                sorts={sorts}
                onSort={toggleSort}
              />
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--md-sys-color-outline-variant) text-(--md-sys-color-on-surface)">
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-(--md-sys-color-on-surface-variant)"
                >
                  Memuat...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-(--md-sys-color-on-surface-variant)"
                >
                  Belum ada data praktikum.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-(--md-sys-color-surface-container-high) transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{item.label}</td>
                  <td className="px-4 py-3">{item.semester}</td>
                  <td className="px-4 py-3 font-mono text-(--md-sys-color-on-surface-variant)">
                    {item.slug}
                  </td>
                  <td className="px-4 py-3">
                    {item.plugs.length === 0 ? (
                      <span className="text-(--md-sys-color-on-surface-variant) opacity-50">
                        -
                      </span>
                    ) : (
                      <div className="space-y-0.5">
                        {item.plugs.map((jadwal) => (
                          <div
                            key={jadwal.id}
                            className="whitespace-nowrap text-(--md-sys-color-on-surface-variant)"
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
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {item.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isDosen && (
                      <div
                        id="edit-praktikum"
                        className="flex justify-end gap-2"
                      >
                        <Button
                          variant="outlined"
                          size="sm"
                          onClick={() => openEdit(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id}
                          className="border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          {deletingId === item.id ? "Menghapus..." : "Hapus"}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Modal Form Create/Edit Praktikum */}
      <Dialog
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingId === null ? "Tambah Praktikum" : "Edit Praktikum"}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <Input
            label="Nama Praktikum"
            value={form.praktikum_label}
            onChange={(event) => handleLabelChange(event.target.value)}
            placeholder="mis. Praktikum Sistem Geospasial"
          />

          <Input
            label="Semester"
            value={form.semester}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                semester: event.target.value,
              }))
            }
            placeholder="mis. Ganjil 2025/2026"
          />

          <div>
            <Input
              label="Slug"
              value={form.praktikum_slug}
              onChange={(event) => {
                setSlugEdited(true);
                setForm((current) => ({
                  ...current,
                  praktikum_slug: event.target.value,
                }));
              }}
              placeholder="praktikum-sistem-geospasial"
              className="font-mono"
            />
            <p className="mt-1 text-[11px] text-(--md-sys-color-on-surface-variant)">
              Dipakai untuk URL. Huruf kecil, angka, dan tanda hubung.
            </p>
          </div>

          <Checkbox
            label="Aktif"
            checked={form.is_active}
            onCheckedChange={(checked) =>
              setForm((current) => ({
                ...current,
                is_active: checked,
              }))
            }
          />

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-(--md-sys-color-on-surface)">
                Plug &amp; Jadwal
              </label>
              <Button
                variant="outlined"
                size="sm"
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    plugs: [...current.plugs, { ...EMPTY_PLUG }],
                  }))
                }
              >
                + Tambah Plug
              </Button>
            </div>

            {form.plugs.length === 0 ? (
              <p className="text-xs text-(--md-sys-color-on-surface-variant)">
                Belum ada plug. Klik "Tambah Plug" untuk menambah jadwal.
              </p>
            ) : (
              editingId === null && (
                <p className="text-xs text-(--md-sys-color-on-surface-variant)">
                  Simpan praktikum terlebih dulu untuk bisa assign mahasiswa ke
                  plug.
                </p>
              )
            )}

            {form.plugs.length > 0 && (
              <div className="space-y-2">
                {form.plugs.map((jadwal, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-center gap-2 rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline-variant) p-2 bg-(--md-sys-color-surface-container-low)"
                  >
                    <Input
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
                      containerClassName="w-28"
                    />
                    <Select
                      options={HARI_OPTIONS}
                      value={jadwal.hari}
                      onValueChange={(val) =>
                        setForm((current) => ({
                          ...current,
                          plugs: current.plugs.map((p, i) =>
                            i === index ? { ...p, hari: val } : p,
                          ),
                        }))
                      }
                      containerClassName="w-28"
                    />
                    <Input
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
                      containerClassName="w-28"
                    />
                    <span className="text-xs text-(--md-sys-color-on-surface-variant)">
                      –
                    </span>
                    <Input
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
                      containerClassName="w-28"
                    />

                    {editingId !== null && jadwal.id && jadwal.plug ? (
                      <Button
                        variant="outlined"
                        size="sm"
                        type="button"
                        onClick={() => openAssign(jadwal)}
                      >
                        Mahasiswa
                        {jadwal.mahasiswa_count
                          ? ` (${jadwal.mahasiswa_count})`
                          : ""}
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        size="sm"
                        type="button"
                        disabled
                        title="Simpan dulu untuk assign mahasiswa"
                      >
                        Mahasiswa
                      </Button>
                    )}

                    <Button
                      variant="text"
                      size="sm"
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          plugs: current.plugs.filter((_, i) => i !== index),
                        }))
                      }
                      className="text-red-600 dark:text-red-400 hover:underline px-2 py-1"
                    >
                      Hapus
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formError && <p className="text-xs text-red-500">{formError}</p>}

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outlined" onClick={closeForm} disabled={isSaving}>
              Batal
            </Button>
            <Button
              variant="filled"
              onClick={handleSave}
              disabled={
                !form.praktikum_label ||
                !form.semester ||
                !form.praktikum_slug ||
                isSaving
              }
            >
              {isSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal Assign Mahasiswa ke Plug */}
      <Dialog
        isOpen={assignPlug !== null}
        onClose={closeAssign}
        title="Assign Mahasiswa"
      >
        <div className="space-y-3">
          <p className="text-xs text-(--md-sys-color-on-surface-variant)">
            Pilih mahasiswa untuk {assignPlug}
            {form.praktikum_label ? ` — ${form.praktikum_label}` : ""}.
          </p>

          <Input
            type="search"
            value={assignSearch}
            onChange={(event) => setAssignSearch(event.target.value)}
            placeholder="Cari nama atau NIM..."
          />

          {(() => {
            const angkatanOptions = [
              { value: "", label: "Semua Angkatan" },
              ...Array.from(
                new Set(
                  assignStudents
                    .map((s) => String(s.nim).substring(2, 5))
                    .filter((code) => code.length === 3),
                ),
              )
                .sort((a, b) => b.localeCompare(a))
                .map((code) => ({
                  value: code,
                  label: `Angkatan 20${code.substring(1, 3)}`,
                })),
            ];

            const getAngkatan = (nim: string | number) =>
              String(nim).substring(2, 5);

            const searchQuery = assignSearch.trim().toLowerCase();

            const filteredStudents = assignStudents.filter((student) => {
              const matchSearch =
                !searchQuery ||
                student.nama.toLowerCase().includes(searchQuery) ||
                String(student.nim).toLowerCase().includes(searchQuery);

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
                <div className="flex items-center justify-between gap-2 border-b border-(--md-sys-color-outline-variant) pb-2">
                  <Checkbox
                    label={`Pilih Semua (${filteredStudents.length})`}
                    checked={isAllFilteredSelected}
                    disabled={filteredStudents.length === 0}
                    onCheckedChange={handleToggleSelectAll}
                  />

                  <Select
                    value={selectedAngkatan}
                    options={angkatanOptions}
                    onValueChange={(val) => setSelectedAngkatan(val)}
                    containerClassName="w-40"
                  />
                </div>

                {assignError && (
                  <p className="text-xs text-red-500">{assignError}</p>
                )}

                <div className="max-h-60 overflow-y-auto rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline-variant) divide-y divide-(--md-sys-color-outline-variant)">
                  {isLoadingAssign ? (
                    <p className="px-3 py-8 text-center text-xs text-(--md-sys-color-on-surface-variant)">
                      Memuat daftar mahasiswa...
                    </p>
                  ) : filteredStudents.length === 0 ? (
                    <p className="px-3 py-8 text-center text-xs text-(--md-sys-color-on-surface-variant)">
                      Mahasiswa tidak ditemukan.
                    </p>
                  ) : (
                    filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between px-3 py-2 hover:bg-(--md-sys-color-surface-container-high) transition-colors"
                      >
                        <Checkbox
                          label={`${student.nim} — ${student.nama}`}
                          checked={selectedIds.has(student.id)}
                          onCheckedChange={() =>
                            toggleAssignStudent(student.id)
                          }
                        />
                        {student.assigned && (
                          <span className="text-[10px] text-(--md-sys-color-on-surface-variant) opacity-60">
                            terdaftar
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            );
          })()}

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-(--md-sys-color-on-surface-variant)">
              {selectedIds.size} dipilih
            </span>
            <div className="flex gap-2">
              <Button
                variant="outlined"
                onClick={closeAssign}
                disabled={isSavingAssign}
              >
                Batal
              </Button>
              <Button
                variant="filled"
                onClick={handleSaveAssign}
                disabled={isLoadingAssign || isSavingAssign}
              >
                {isSavingAssign ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
