import { useEffect, useRef, useState } from "react";
import {
  mahasiswaService,
  praktikumService,
  type Mahasiswa,
  type MahasiswaListMeta,
  type MahasiswaImportStatus,
  type Praktikum,
} from '@/services'
import { getFormErrorMessages } from '@/utils/errors'
import { Button } from "@/components/ui/Buttons";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SortSummary } from "@/components/ui/SortSummary";
import { SortableTh } from "@/components/ui/SortableTh";
import { useTableSort } from "@/hooks/useTableSort";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useLocation } from "react-router-dom";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const SEARCH_DEBOUNCE_MS = 400;

const STUDENTS_STORAGE_KEY = "sudah_lihat_walkthrough_students";

export default function Students() {
  const [students, setStudents] = useState<Mahasiswa[]>([]);
  const [meta, setMeta] = useState<MahasiswaListMeta | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [angkatan, setAngkatan] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("active");
  const [page, setPage] = useState(1);
  const { sorts, toggleSort, removeSort, resetSort } = useTableSort(
    { column: "nim", direction: "asc" },
    () => setPage(1),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isStartingImport, setIsStartingImport] = useState(false);
  const [importJob, setImportJob] = useState<MahasiswaImportStatus | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollTimerRef = useRef<number | null>(null);
  const isUploadOpenRef = useRef(false);
  const [editingStudent, setEditingStudent] = useState<Mahasiswa | null>(null);
  const [praktikumOptions, setPraktikumOptions] = useState<Praktikum[]>([]);
  const [editPlugs, setEditPlugs] = useState<Record<string, string>>({});
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [statusStudent, setStatusStudent] = useState<Mahasiswa | null>(null);
  const [statusValue, setStatusValue] = useState<"active" | "inactive">("active");
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const { user, isDosen } = useAdminAuth();
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // driver.js buat walkthrough

  useEffect(() => {
    if (!user || location.pathname !== "/mahasiswa") return;

    const hasSeenTour = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (hasSeenTour === "true") return;

    const driverObj = driver({
      showProgress: false,
      onDestroyStarted: () => {
        localStorage.setItem(STUDENTS_STORAGE_KEY, "true");
        driverObj.destroy();
      },
      steps: [
        {
          element: "#import-csv",
          popover: {
            title: "Import Daftar Mahasiswa",
            description:
              "Masukkan daftar praktikan dengan melakukan import *.csv yang cukup berisi data nama dan NIM.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#edit-praktikan",
          popover: {
            title: "Edit Praktikum yang Diikuti Praktikan",
            description:
              "Daftarkan praktikan ke praktikum dan plug terkait melalui tombol Edit di baris nama praktikan.",
            side: "left",
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
  }, [location.pathname, user]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    mahasiswaService
      .getAll({
        search: debouncedSearch || undefined,
        angkatan: angkatan ? Number(angkatan) : undefined,
        status: statusFilter,
        page,
        sorts,
      })
      .then((response) => {
        if (cancelled) return;
        setStudents(response.data);
        setMeta(response.meta);
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
  }, [debouncedSearch, angkatan, statusFilter, page, sorts, refreshKey]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current !== null) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  const stopPolling = () => {
    if (pollTimerRef.current !== null) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const pollImport = (id: number) => {
    stopPolling();

    pollTimerRef.current = window.setTimeout(async () => {
      try {
        const job = await mahasiswaService.getImportStatus(id);
        setImportJob(job);

        if (job.status === "completed" || job.status === "failed") {
          pollTimerRef.current = null;

          if (job.status === "completed") {
            setRefreshKey((key) => key + 1);
          }

          return;
        }

        pollImport(id);
      } catch {
        pollTimerRef.current = null;
      }
    }, 1500);
  };

  const openUploadModal = () => {
    isUploadOpenRef.current = true;
    setIsUploadOpen(true);

    // Pulihkan import yang masih berjalan bila modal ditutup lalu dibuka lagi.
    mahasiswaService
      .getLatestImport()
      .then((job) => {
        if (!isUploadOpenRef.current || !job) return;
        if (job.status !== "queued" && job.status !== "processing") return;

        setImportJob(job);
        pollImport(job.id);
      })
      .catch(() => {
        // Diamkan; error global sudah ditangani modal error.
      });
  };

  const closeUploadModal = () => {
    isUploadOpenRef.current = false;
    stopPolling();
    setIsUploadOpen(false);
    setUploadFile(null);
    setImportJob(null);
    setUploadError(null);
    setIsStartingImport(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = () => {
    if (!uploadFile) return;

    setIsStartingImport(true);
    setUploadError(null);

    mahasiswaService
      .startImportCsv(uploadFile)
      .then((job) => {
        if (!isUploadOpenRef.current) return;

        setImportJob(job);
        pollImport(job.id);
      })
      .catch((err) => {
        // Error validasi (422) tampil inline; error lain ditangani modal global.
        const messages = getFormErrorMessages(err)
        setUploadError(messages.length > 0 ? messages.join(' ') : null)
      })
      .finally(() => {
        setIsStartingImport(false);
      });
  };

  const openStatusModal = (student: Mahasiswa) => {
    setStatusStudent(student);
    setStatusValue(student.is_active_user ? "active" : "inactive");
    setStatusError(null);
    setIsConfirmingReset(false);
    setIsResettingPassword(false);
    setResetMessage(null);
    setResetError(null);
  };

  const closeStatusModal = () => {
    setStatusStudent(null);
    setStatusError(null);
    setIsConfirmingReset(false);
    setIsResettingPassword(false);
    setResetMessage(null);
    setResetError(null);
    setIsSavingStatus(false);
  };

  const handleResetPassword = () => {
    if (!statusStudent) return;

    setIsResettingPassword(true);
    setResetError(null);
    setResetMessage(null);

    mahasiswaService
      .resetPassword(statusStudent.id)
      .then((response) => {
        setResetMessage(response.message);
        setIsConfirmingReset(false);
      })
      .catch((err) => {
        // Error validasi (422) tampil inline; error lain ditangani modal global.
        const messages = getFormErrorMessages(err)
        setResetError(messages.length > 0 ? messages.join(' ') : null)
      })
      .finally(() => {
        setIsResettingPassword(false);
      });
  };

  const handleSaveStatus = () => {
    if (!statusStudent) return;

    setIsSavingStatus(true);
    setStatusError(null);

    mahasiswaService
      .updateStatus(statusStudent.id, statusValue === "active")
      .then(() => {
        closeStatusModal();
        setRefreshKey((key) => key + 1);
      })
      .catch((err) => {
        // Error validasi (422) tampil inline; error lain ditangani modal global.
        const messages = getFormErrorMessages(err)
        setStatusError(messages.length > 0 ? messages.join(' ') : null)
      })
      .finally(() => {
        setIsSavingStatus(false);
      });
  };

  const hasActiveFilter =
    debouncedSearch || angkatan || statusFilter !== "active";
  const isImportRunning =
    importJob?.status === "queued" || importJob?.status === "processing";
  const importProgress =
    importJob && importJob.total_rows > 0
      ? Math.min(
          100,
          Math.round((importJob.processed_rows / importJob.total_rows) * 100),
        )
      : 0;

  const openEditModal = (student: Mahasiswa) => {
    setEditingStudent(student);
    setEditError(null);
    setIsLoadingOptions(true);
    setEditPlugs(
      Object.fromEntries(
        (student.praktikum ?? []).map((slug) => [
          slug,
          String(student.praktikum_plug?.[slug] ?? ""),
        ]),
      ),
    );
    praktikumService
      .getAll()
      .then((options) => setPraktikumOptions(options))
      .catch(() => {
        // Error sudah ditampilkan otomatis di modal global.
      })
      .finally(() => setIsLoadingOptions(false));
  };

  const closeEditModal = () => {
    setEditingStudent(null);
    setEditPlugs({});
    setEditError(null);
  };

  const togglePraktikum = (slug: string) => {
    setEditPlugs((current) => {
      if (slug in current) {
        const next = { ...current };
        delete next[slug];
        return next;
      }
      return { ...current, [slug]: "" };
    });
  };

  const handleSaveEdit = () => {
    if (!editingStudent) return;

    const plugs: Record<string, string> = {};
    for (const [slug, value] of Object.entries(editPlugs)) {
      const option = praktikumOptions.find((p) => p.slug === slug);
      if (!option || !option.plugs.some((jadwal) => jadwal.plug === value)) {
        setEditError(
          "Pilih plug yang tersedia untuk setiap praktikum yang dipilih.",
        );
        return;
      }
      plugs[slug] = value;
    }

    setIsSavingEdit(true);
    setEditError(null);

    mahasiswaService
      .update(editingStudent.id, {
        praktikum: Object.keys(plugs),
        praktikum_plug: plugs,
      })
      .then(() => {
        closeEditModal();
        setRefreshKey((key) => key + 1);
      })
      .catch((err) => {
        // Error validasi (422) tampil inline; error lain ditangani modal global.
        const messages = getFormErrorMessages(err)
        setEditError(messages.length > 0 ? messages.join(' ') : null)
      })
      .finally(() => {
        setIsSavingEdit(false);
      });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-(--md-sys-color-on-surface)">
        Daftar Mahasiswa
      </h1>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          id="import-csv"
          variant="filled"
          onClick={openUploadModal}
        >
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
            setPage(1);
            setAngkatan(event.target.value);
          }}
          placeholder="Angkatan"
          containerClassName="w-32"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setPage(1);
            setStatusFilter(value as "active" | "inactive" | "all");
          }}
          options={[
            { value: "active", label: "Aktif" },
            { value: "inactive", label: "Nonaktif" },
            { value: "all", label: "Semua" },
          ]}
          containerClassName="w-36"
        />
        {hasActiveFilter && (
          <Button
            variant="text"
            size="sm"
            onClick={() => {
              setSearch("");
              setAngkatan("");
              setStatusFilter("active");
              setPage(1);
            }}
          >
            Reset filter
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
                label="NIM"
                column="nim"
                sorts={sorts}
                onSort={toggleSort}
              />
              <SortableTh
                label="Nama"
                column="nama"
                sorts={sorts}
                onSort={toggleSort}
              />
              <SortableTh
                label="Angkatan"
                column="angkatan"
                sorts={sorts}
                onSort={toggleSort}
              />
              <SortableTh
                label="Email"
                column="surel"
                sorts={sorts}
                onSort={toggleSort}
              />
              <SortableTh
                label="Status"
                column="is_active_user"
                sorts={sorts}
                onSort={toggleSort}
              />
              <th className="px-4 py-3">Praktikum</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--md-sys-color-outline-variant) text-(--md-sys-color-on-surface)">
            {isLoading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-(--md-sys-color-on-surface-variant)"
                >
                  Memuat...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-(--md-sys-color-on-surface-variant)"
                >
                  {hasActiveFilter
                    ? "Tidak ada mahasiswa yang cocok dengan filter."
                    : "Belum ada data mahasiswa."}
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-(--md-sys-color-surface-container-high) transition-colors"
                >
                  <td className="px-4 py-3 font-mono">{student.nim}</td>
                  <td className="px-4 py-3 font-medium">{student.nama}</td>
                  <td className="px-4 py-3">{student.angkatan}</td>
                  <td className="px-4 py-3 text-(--md-sys-color-on-surface-variant)">
                    {student.surel ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        student.is_active_user
                          ? "inline-flex rounded-full bg-(--md-sys-color-primary-container) px-2 py-0.5 text-[11px] font-semibold text-(--md-sys-color-on-primary-container)"
                          : "inline-flex rounded-full bg-(--md-sys-color-error-container) px-2 py-0.5 text-[11px] font-semibold text-(--md-sys-color-on-error-container)"
                      }
                    >
                      {student.is_active_user ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {student.praktikum?.length ?? 0} praktikum
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        id="edit-praktikan"
                        variant="text"
                        size="sm"
                        onClick={() => openEditModal(student)}
                        className="hover:underline px-2 py-1"
                      >
                        Edit
                      </Button>
                      {isDosen && (
                        <Button
                          variant="text"
                          size="sm"
                          onClick={() => openStatusModal(student)}
                          className="hover:underline px-2 py-1"
                        >
                          Status
                        </Button>
                      )}
                    </div>
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
            File CSV harus memiliki baris header dengan kolom{" "}
            <code className="font-mono text-xs">nama</code> dan{" "}
            <code className="font-mono text-xs">nim</code> (9 digit). Surel dan
            angkatan akan diisi otomatis dari NIM.
          </p>

          {!importJob ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                disabled={isStartingImport}
                onChange={(event) =>
                  setUploadFile(event.target.files?.[0] ?? null)
                }
                className="w-full rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline) bg-(--md-sys-color-surface) px-3 py-2 text-xs text-(--md-sys-color-on-surface) file:mr-3 file:rounded-md file:border-0 file:bg-(--md-sys-color-primary) file:px-3 file:py-1.5 file:text-white"
              />
              {uploadError && (
                <p className="text-xs text-red-500">{uploadError}</p>
              )}
              <div className="pt-2 flex justify-end gap-2">
                <Button
                  variant="outlined"
                  onClick={closeUploadModal}
                  disabled={isStartingImport}
                >
                  Batal
                </Button>

                <Button
                  variant="filled"
                  onClick={handleUpload}
                  disabled={!uploadFile || isStartingImport}
                >
                  {isStartingImport ? "Mengunggah..." : "Upload"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3 rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-low) p-4 text-xs">
                {isImportRunning ? (
                  <>
                    <p className="font-medium text-(--md-sys-color-on-surface)">
                      {importJob.status === "queued"
                        ? "Menunggu worker memproses file..."
                        : "Memproses file..."}
                    </p>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-(--md-sys-color-surface-container-high)">
                      <div
                        className="h-full rounded-full bg-(--md-sys-color-primary) transition-all"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                    <p className="text-(--md-sys-color-on-surface-variant)">
                      {importJob.processed_rows} / {importJob.total_rows} baris
                      {" · "}
                      {importJob.imported} baru
                      {" · "}
                      {importJob.updated} diperbarui
                      {" · "}
                      {importJob.failed_count} gagal
                    </p>
                    <p className="text-(--md-sys-color-on-surface-variant)">
                      Import berjalan di background. Kamu boleh menutup dialog
                      ini; proses tetap berlanjut.
                    </p>
                  </>
                ) : (
                  <p className="font-medium text-(--md-sys-color-on-surface)">
                    {importJob.status === "failed"
                      ? `Import gagal: ${importJob.error_message ?? "terjadi kesalahan."}`
                      : `Import selesai: ${importJob.imported} mahasiswa baru, ${importJob.updated} diperbarui, ${importJob.failed_count} gagal.`}
                  </p>
                )}

                {!isImportRunning && importJob.failures.length > 0 && (
                  <>
                    <ul className="list-inside list-disc space-y-1 text-red-500">
                      {importJob.failures.map((item) => (
                        <li key={item.row}>
                          Baris {item.row}: {item.message}
                        </li>
                      ))}
                    </ul>
                    {importJob.failed_count > importJob.failures.length && (
                      <p className="text-(--md-sys-color-on-surface-variant)">
                        Menampilkan {importJob.failures.length} dari{" "}
                        {importJob.failed_count} baris gagal.
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="pt-2 flex justify-end">
                <Button variant="filled" onClick={closeUploadModal}>
                  {isImportRunning ? "Tutup" : "Selesai"}
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
                        onCheckedChange={() => togglePraktikum(option.slug)}
                      />
                      {checked &&
                        (adaJadwal ? (
                          <div className="mt-2 pl-6">
                            <Select
                              label="Plug"
                              value={editPlugs[option.slug] ?? ""}
                              onValueChange={(val) =>
                                setEditPlugs((current) => ({
                                  ...current,
                                  [option.slug]: val,
                                }))
                              }
                              options={[
                                { value: "", label: "Pilih plug..." },
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

      {/* Modal Status Mahasiswa */}
      <Dialog
        isOpen={!!statusStudent}
        onClose={closeStatusModal}
        title="Status Mahasiswa"
      >
        {statusStudent && (
          <div className="space-y-4">
            <p className="text-xs text-(--md-sys-color-on-surface-variant)">
              {statusStudent.nama} ({statusStudent.nim})
            </p>

            <Select
              label="Status keaktifan"
              value={statusValue}
              onValueChange={(value) =>
                setStatusValue(value as "active" | "inactive")
              }
              options={[
                { value: "active", label: "Aktif" },
                { value: "inactive", label: "Nonaktif" },
              ]}
            />

            <p className="text-xs text-(--md-sys-color-on-surface-variant)">
              Nonaktif mencakup mahasiswa yang sedang cuti atau sudah lulus.
              Mahasiswa nonaktif tidak dapat login dan disembunyikan dari filter
              Aktif.
            </p>

            {statusError && (
              <p className="text-xs text-red-500">{statusError}</p>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outlined"
                onClick={closeStatusModal}
                disabled={isSavingStatus}
              >
                Batal
              </Button>
              <Button
                variant="filled"
                onClick={handleSaveStatus}
                disabled={isSavingStatus}
              >
                {isSavingStatus ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>

            <div className="space-y-2 border-t border-(--md-sys-color-outline-variant) pt-4">
              <p className="text-xs font-semibold text-(--md-sys-color-on-surface)">
                Reset Password
              </p>
              <p className="text-xs text-(--md-sys-color-on-surface-variant)">
                Reset password mahasiswa ke NIM. Setelah itu mahasiswa harus
                login ulang dengan NIM dan mengganti password.
              </p>

              {resetMessage && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {resetMessage}
                </p>
              )}
              {resetError && (
                <p className="text-xs text-red-500">{resetError}</p>
              )}

              {isConfirmingReset ? (
                <div className="space-y-2 rounded-(--md-sys-shape-corner-medium) border border-red-300 p-3">
                  <p className="text-xs text-(--md-sys-color-on-surface)">
                    Password akan menjadi NIM dan semua sesi aktif akan keluar.
                    Lanjutkan?
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outlined"
                      size="sm"
                      onClick={() => setIsConfirmingReset(false)}
                      disabled={isResettingPassword}
                    >
                      Batal
                    </Button>
                    <Button
                      variant="filled"
                      size="sm"
                      onClick={handleResetPassword}
                      disabled={isResettingPassword}
                    >
                      {isResettingPassword ? "Mereset..." : "Ya, reset"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={() => setIsConfirmingReset(true)}
                >
                  Reset password ke NIM
                </Button>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
