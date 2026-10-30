import { useEffect, useState } from "react";
import {
  mahasiswaService,
  praktikumService,
  ApiError,
  type Mahasiswa,
  type MahasiswaListMeta,
  type Praktikum,
} from "@/services";
import { Button } from "@/components/ui/Buttons";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";

const SEARCH_DEBOUNCE_MS = 400;

type StatusFilter = "semua" | "asisten" | "asisten_nonaktif" | "bukan";

const STATUS_FILTER_ROLE: Record<
  Exclude<StatusFilter, "semua">,
  "asisten" | "asisten_nonaktif" | "mahasiswa"
> = {
  asisten: "asisten",
  asisten_nonaktif: "asisten_nonaktif",
  bukan: "mahasiswa",
};

function StatusBadge({ mahasiswa }: { mahasiswa: Mahasiswa }) {
  if (!mahasiswa.is_asisten) {
    return (
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        Bukan Asisten
      </span>
    );
  }
  return mahasiswa.is_active_asisten ? (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
      Asisten Aktif
    </span>
  ) : (
    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
      Asisten Nonaktif
    </span>
  );
}

export default function Asisten() {
  const [students, setStudents] = useState<Mahasiswa[]>([]);
  const [meta, setMeta] = useState<MahasiswaListMeta | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("semua");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [editingStudent, setEditingStudent] = useState<Mahasiswa | null>(null);
  const [praktikumOptions, setPraktikumOptions] = useState<Praktikum[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [editIsAsisten, setEditIsAsisten] = useState(false);
  const [editIsActive, setEditIsActive] = useState(false);
  const [editPlugs, setEditPlugs] = useState<Record<string, string[]>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    mahasiswaService
      .getAll({
        search: debouncedSearch || undefined,
        role:
          statusFilter === "semua"
            ? undefined
            : STATUS_FILTER_ROLE[statusFilter],
        page,
      })
      .then((response) => {
        if (cancelled) return;
        setStudents(response.data);
        setMeta(response.meta);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Gagal memuat data mahasiswa.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, statusFilter, page, refreshKey]);

  const openEditModal = (student: Mahasiswa) => {
    setEditingStudent(student);
    setEditError(null);
    setEditIsAsisten(student.is_asisten);
    setEditIsActive(student.is_asisten && student.is_active_asisten);
    setIsLoadingOptions(true);

    const pengampu = student.pengampu_praktikum ?? [];
    setEditPlugs(
      Object.fromEntries(
        pengampu.map((slug) => [slug, student.pengampu_plug?.[slug] ?? []]),
      ),
    );

    praktikumService
      .getAll()
      .then((options) => setPraktikumOptions(options))
      .catch((err) => {
        setEditError(
          err instanceof ApiError
            ? err.message
            : "Gagal memuat daftar praktikum.",
        );
      })
      .finally(() => setIsLoadingOptions(false));
  };

  const closeEditModal = () => {
    setEditingStudent(null);
    setEditPlugs({});
    setEditError(null);
  };

  const togglePengampu = (slug: string) => {
    setEditPlugs((current) => {
      if (slug in current) {
        const next = { ...current };
        delete next[slug];
        return next;
      }
      return { ...current, [slug]: [] };
    });
  };

  const togglePlug = (slug: string, plug: string) => {
    setEditPlugs((current) => {
      const plugs = current[slug] ?? [];
      return {
        ...current,
        [slug]: plugs.includes(plug)
          ? plugs.filter((p) => p !== plug)
          : [...plugs, plug],
      };
    });
  };

  const handleSaveEdit = () => {
    if (!editingStudent) return;

    const plugs: Record<string, string[]> = {};
    for (const [slug, plugList] of Object.entries(editPlugs)) {
      const option = praktikumOptions.find((p) => p.slug === slug);
      const tersedia = option?.plugs.map((jadwal) => jadwal.plug) ?? [];
      if (
        !option ||
        plugList.length === 0 ||
        plugList.some((plug) => !tersedia.includes(plug))
      ) {
        setEditError(
          "Pilih minimal satu plug yang tersedia untuk setiap praktikum yang dipilih.",
        );
        return;
      }
      plugs[slug] = plugList;
    }

    setIsSavingEdit(true);
    setEditError(null);

    mahasiswaService
      .updateAsisten(editingStudent.id, {
        is_asisten: editIsAsisten,
        is_active_asisten: editIsActive,
        pengampu_praktikum: Object.keys(plugs),
        pengampu_plug: plugs,
      })
      .then(() => {
        closeEditModal();
        setRefreshKey((key) => key + 1);
      })
      .catch((err) => {
        setEditError(
          err instanceof ApiError ? err.message : "Gagal menyimpan perubahan.",
        );
      })
      .finally(() => {
        setIsSavingEdit(false);
      });
  };

  const hasActiveFilter = debouncedSearch || statusFilter !== "semua";

  const statusFilters: { value: StatusFilter; label: string }[] = [
    { value: "semua", label: "Semua" },
    { value: "asisten", label: "Asisten Aktif" },
    { value: "asisten_nonaktif", label: "Asisten Nonaktif" },
    { value: "bukan", label: "Bukan Asisten" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-(--md-sys-color-on-surface)">
          Manajemen Asisten
        </h1>
        <p className="mt-1 text-sm text-(--md-sys-color-on-surface-variant)">
          Tetapkan mahasiswa sebagai asisten dan atur praktikum yang diampu.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama atau NIM..."
          containerClassName="w-64"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? "filled" : "outlined"}
              size="sm"
              onClick={() => {
                setPage(1);
                setStatusFilter(filter.value);
              }}
            >
              {filter.label}
            </Button>
          ))}
        </div>
        {hasActiveFilter && (
          <Button
            variant="text"
            size="sm"
            onClick={() => {
              setSearch("");
              setPage(1);
              setStatusFilter("semua");
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
              <th className="px-4 py-3">NIM</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Angkatan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Pengampu</th>
              <th className="px-4 py-3">Aksi</th>
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
            ) : students.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-(--md-sys-color-on-surface-variant)"
                >
                  {hasActiveFilter
                    ? "Tidak ada mahasiswa yang cocok dengan filter."
                    : "Belum ada data mahasiswa."}
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const pengampu = student.pengampu_praktikum ?? [];
                return (
                  <tr
                    key={student.id}
                    className="hover:bg-(--md-sys-color-surface-container-high) transition-colors"
                  >
                    <td className="px-4 py-3 font-mono">{student.nim}</td>
                    <td className="px-4 py-3 font-medium">{student.nama}</td>
                    <td className="px-4 py-3">{student.angkatan}</td>
                    <td className="px-4 py-3">
                      <StatusBadge mahasiswa={student} />
                    </td>
                    <td className="px-4 py-3">
                      {pengampu.length === 0 ? (
                        <span className="text-(--md-sys-color-on-surface-variant) opacity-50">
                          -
                        </span>
                      ) : (
                        <ul className="space-y-0.5">
                          {pengampu.map((slug) => {
                            const plugs = student.pengampu_plug?.[slug] ?? [];

                            return (
                              <li
                                key={slug}
                                className="text-xs text-(--md-sys-color-on-surface-variant)"
                              >
                                {slug}
                                {plugs.length > 0 && (
                                  <span className="opacity-70">
                                    {" "}
                                    · {plugs.join(", ")}
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => openEditModal(student)}
                        className="hover:underline px-2 py-1"
                      >
                        Atur
                      </Button>
                    </td>
                  </tr>
                );
              })
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

      {/* Modal Edit Asisten */}
      <Dialog
        isOpen={!!editingStudent}
        onClose={closeEditModal}
        title="Atur Asisten"
      >
        {editingStudent && (
          <div className="space-y-4">
            <p className="text-xs text-(--md-sys-color-on-surface-variant)">
              {editingStudent.nama} ({editingStudent.nim})
            </p>

            <div className="space-y-2">
              <Checkbox
                label="Asisten (Mahasiswa ini adalah asisten)"
                checked={editIsAsisten}
                onCheckedChange={(checked) => {
                  setEditIsAsisten(checked);
                  if (!checked) setEditIsActive(false);
                }}
              />
              <div className={editIsAsisten ? "" : "opacity-40"}>
                <Checkbox
                  label="Aktif (Boleh login ke panel admin)"
                  checked={editIsActive}
                  disabled={!editIsAsisten}
                  onCheckedChange={(checked) => setEditIsActive(checked)}
                />
              </div>
            </div>

            <h3 className="text-sm font-semibold text-(--md-sys-color-on-surface) pt-2">
              Pengampu Praktikum
            </h3>
            {isLoadingOptions ? (
              <p className="text-xs text-(--md-sys-color-on-surface-variant)">
                Memuat daftar praktikum...
              </p>
            ) : praktikumOptions.length === 0 ? (
              <p className="text-xs text-(--md-sys-color-on-surface-variant)">
                Belum ada praktikum terdaftar.
              </p>
            ) : (
              <ul className="space-y-2">
                {praktikumOptions.map((option) => {
                  const checked = option.slug in editPlugs;
                  const adaJadwal = option.plugs.length > 0;
                  return (
                    <li
                      key={option.id}
                      className="rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline-variant) p-3"
                    >
                      <Checkbox
                        label={`${option.label} (${option.slug})`}
                        checked={checked}
                        disabled={!checked && !adaJadwal}
                        onCheckedChange={() => togglePengampu(option.slug)}
                      />
                      {checked &&
                        (adaJadwal ? (
                          <div className="mt-2 space-y-1 pl-6">
                            <span className="text-xs text-(--md-sys-color-on-surface-variant)">
                              Plug yang diampu:
                            </span>
                            {option.plugs.map((jadwal) => (
                              <Checkbox
                                key={jadwal.id}
                                label={`Plug ${jadwal.plug} (${jadwal.hari} ${jadwal.jam_mulai}–${jadwal.jam_selesai})`}
                                checked={(
                                  editPlugs[option.slug] ?? []
                                ).includes(jadwal.plug)}
                                onCheckedChange={() =>
                                  togglePlug(option.slug, jadwal.plug)
                                }
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-red-500 pl-6">
                            Jadwal belum tersedia untuk praktikum ini.
                          </p>
                        ))}
                    </li>
                  );
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
                {isSavingEdit ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
