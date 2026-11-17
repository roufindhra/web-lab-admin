import { useEffect, useState, type KeyboardEvent } from "react";
import {
  praktikumService,
  type AssignMahasiswa,
  type Pertemuan,
} from "@/services";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Buttons";
import { Card } from "@/components/ui/Card";
import { SortSummary } from "@/components/ui/SortSummary";
import { SortableTh } from "@/components/ui/SortableTh";
import { useTableSort } from "@/hooks/useTableSort";
import { sortRows } from "@/utils/tableSort";
import { formatTanggal } from "@/utils/format-date";

interface PraktikumInfo {
  id: number;
  slug: string;
  label: string;
}

// mahasiswaId -> pertemuanId -> nama parameter -> nilai mentah (string agar enak diketik)
type NilaiState = Record<string, Record<string, Record<string, string>>>;

const STICKY_HEADER_BG = "bg-(--md-sys-color-surface-container-low)";
const STICKY_BODY_BG = "bg-(--md-sys-color-surface)";

function isInvalidScore(raw: string): boolean {
  if (raw.trim() === "") return false;
  const value = Number(raw);
  return !Number.isFinite(value) || value < 0 || value > 100;
}

export default function NilaiSidePanel({
  praktikum,
  plug,
  pertemuan,
  canEdit,
  onClose,
  onSaved,
}: {
  praktikum: PraktikumInfo;
  plug: string;
  pertemuan: Pertemuan[];
  canEdit: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [students, setStudents] = useState<AssignMahasiswa[]>([]);
  const [nilai, setNilai] = useState<NilaiState>({});
  const [expandedId, setExpandedId] = useState<number | null>(
    pertemuan[0]?.id ?? null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const { sorts, toggleSort, removeSort, resetSort } = useTableSort({
    column: "nim",
    direction: "asc",
  });

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      praktikumService.listMahasiswa(praktikum.slug, plug, true),
      praktikumService.listNilaiPlug(praktikum.slug, plug),
    ])
      .then(([studentList, nilaiList]) => {
        if (cancelled) return;
        setStudents(studentList);

        const matrix: NilaiState = {};
        for (const row of nilaiList) {
          for (const [pertemuanId, values] of Object.entries(row.nilai)) {
            for (const [param, value] of Object.entries(values)) {
              matrix[String(row.mahasiswa_id)] ??= {};
              matrix[String(row.mahasiswa_id)][pertemuanId] ??= {};
              matrix[String(row.mahasiswa_id)][pertemuanId][param] =
                String(value);
            }
          }
        }
        setNilai(matrix);
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
  }, [praktikum.id, praktikum.slug, plug]);

  const getInput = (
    mahasiswaId: number,
    pertemuanId: number,
    param: string,
  ): string => nilai[String(mahasiswaId)]?.[String(pertemuanId)]?.[param] ?? "";

  const sortedStudentsFor = (item: Pertemuan): AssignMahasiswa[] =>
    sortRows(students, sorts, (student, column) => {
      if (column === "nim") return student.nim;
      if (column === "nama") return student.nama;
      if (column.startsWith("nilai:")) {
        const raw = getInput(student.id, item.id, column.slice(6));
        return raw === "" ? null : Number(raw);
      }

      return null;
    });

  const setInput = (
    mahasiswaId: number,
    pertemuanId: number,
    param: string,
    value: string,
  ) => {
    setNilai((current) => ({
      ...current,
      [String(mahasiswaId)]: {
        ...current[String(mahasiswaId)],
        [String(pertemuanId)]: {
          ...current[String(mahasiswaId)]?.[String(pertemuanId)],
          [param]: value,
        },
      },
    }));
  };

  const handleSave = (item: Pertemuan) => {
    const payload: Record<string, Record<string, number | null>> = {};

    for (const student of students) {
      const values: Record<string, number | null> = {};
      for (const param of item.parameter) {
        const raw = getInput(student.id, item.id, param.nama).trim();
        values[param.nama] = raw === "" ? null : Number(raw);
      }
      payload[String(student.id)] = values;
    }

    setSavingId(item.id);
    setSavedId(null);

    praktikumService
      .saveNilaiPlug(praktikum.slug, plug, item.id, payload)
      .then(() => {
        setSavedId(item.id);
        onSaved();
      })
      .catch(() => {
        // Error sudah ditampilkan otomatis di modal global.
      })
      .finally(() => setSavingId(null));
  };

  const handleCellKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    paramCount: number,
  ) => {
    const input = event.currentTarget;
    const row = Number(input.dataset.row);
    const col = Number(input.dataset.col);

    if (Number.isNaN(row) || Number.isNaN(col)) return;

    const table = input.closest("table");
    if (!table) return;

    let nextRow = row;
    let nextCol = col;

    switch (event.key) {
      case "ArrowUp":
        nextRow -= 1;
        break;
      case "ArrowDown":
      case "Enter":
        nextRow += event.shiftKey ? -1 : 1;
        break;
      case "ArrowLeft":
        nextCol -= 1;
        break;
      case "ArrowRight":
        nextCol += 1;
        break;
      case "Home":
        nextCol = 0;
        break;
      case "End":
        nextCol = paramCount - 1;
        break;
      case "Escape":
        event.preventDefault();
        input.blur();
        return;
      default:
        return;
    }

    if (nextCol < 0 || nextCol >= paramCount || nextRow < 0) return;

    const next = table.querySelector<HTMLInputElement>(
      `input[data-cell="${nextRow}-${nextCol}"]`,
    );

    if (!next) return;

    event.preventDefault();
    next.focus();
    next.select();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="animate-fade-in absolute inset-0 bg-black/40 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="animate-slide-in-right absolute inset-y-0 right-0 flex w-full max-w-4xl flex-col bg-(--md-sys-color-surface-container-high) shadow-2xl">
        <div className="flex items-center justify-between border-b border-(--md-sys-color-outline-variant) px-6 py-4 bg-(--md-sys-color-surface-container-high)">
          <div>
            <h2 className="text-lg font-bold text-(--md-sys-color-on-surface)">
              Input Nilai
            </h2>
            <p className="text-xs text-(--md-sys-color-on-surface-variant)">
              {praktikum.label} &middot; {plug}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-(--md-sys-color-on-surface) hover:bg-(--md-sys-color-surface-container) transition-colors"
            aria-label="Tutup panel nilai"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {isLoading ? (
            <p className="py-12 text-center text-xs text-(--md-sys-color-on-surface-variant)">
              Memuat...
            </p>
          ) : students.length === 0 ? (
            <p className="py-12 text-center text-xs text-(--md-sys-color-on-surface-variant)">
              Belum ada mahasiswa yang di-assign ke plug ini.
            </p>
          ) : pertemuan.length === 0 ? (
            <p className="py-12 text-center text-xs text-(--md-sys-color-on-surface-variant)">
              Belum ada rule penilaian. Tambahkan pertemuan terlebih dulu.
            </p>
          ) : (
            <div className="space-y-3">
              {pertemuan.map((item) => {
                const rows = sortedStudentsFor(item);

                return (
                  <Card
                    key={item.id}
                    variant="outlined"
                    className="p-0 overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedId(expandedId === item.id ? null : item.id)
                      }
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-(--md-sys-color-surface-container-high) transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-sm text-(--md-sys-color-on-surface)">
                          Pertemuan {item.nomor}
                        </span>
                        {item.materi && (
                          <span className="ml-2 text-xs text-(--md-sys-color-on-surface-variant)">
                            <span className="mr-1 font-mono">
                              M{item.materi.materi_id}
                            </span>
                            {item.materi.materi_nama}
                          </span>
                        )}
                        <div className="mt-0.5 text-xs text-(--md-sys-color-on-surface-variant)">
                          {formatTanggal(item.tanggal_mulai)}
                          {item.tanggal_selesai
                            ? ` – ${formatTanggal(item.tanggal_selesai)}`
                            : ""}
                          {` · ${item.parameter.length} parameter`}
                        </div>
                      </div>
                      <span className="text-xs text-(--md-sys-color-on-surface-variant)">
                        {expandedId === item.id ? "▾" : "▸"}
                      </span>
                    </button>

                    {expandedId === item.id && (
                      <div className="border-t border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface)">
                        <div className="px-4 pt-3">
                          <SortSummary
                            sorts={sorts}
                            onRemove={removeSort}
                            onReset={resetSort}
                            labels={Object.fromEntries(
                              pertemuan.flatMap((row) =>
                                row.parameter.map((param) => [
                                  `nilai:${param.nama}`,
                                  param.nama,
                                ]),
                              ),
                            )}
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-[11px] text-(--md-sys-color-on-surface-variant)">
                          {item.parameter.map((param, index) => (
                            <span key={param.nama}>
                              <span className="font-semibold text-(--md-sys-color-on-surface)">
                                P{index + 1}
                              </span>
                              : {param.nama}{" "}
                              <span className="opacity-70">
                                ({param.bobot}%)
                              </span>
                            </span>
                          ))}
                        </div>

                        <div className="max-h-[55vh] overflow-auto border-y border-(--md-sys-color-outline-variant)">
                          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                            <thead className="text-xs uppercase text-(--md-sys-color-on-surface-variant)">
                              <tr>
                                <SortableTh
                                  label="NIM"
                                  column="nim"
                                  sorts={sorts}
                                  onSort={toggleSort}
                                  align="center"
                                  className={cn(
                                    "sticky left-0 top-0 z-30 w-28 border-b border-r border-(--md-sys-color-outline-variant) py-2",
                                    STICKY_HEADER_BG,
                                  )}
                                />
                                <SortableTh
                                  label="Nama"
                                  column="nama"
                                  sorts={sorts}
                                  onSort={toggleSort}
                                  className={cn(
                                    "sticky left-28 top-0 z-30 w-48 border-b border-r border-(--md-sys-color-outline-variant) py-2",
                                    STICKY_HEADER_BG,
                                  )}
                                />
                                {item.parameter.map((param, index) => (
                                  <SortableTh
                                    key={param.nama}
                                    label={`P${index + 1}`}
                                    column={`nilai:${param.nama}`}
                                    sorts={sorts}
                                    onSort={toggleSort}
                                    align="center"
                                    className={cn(
                                      "sticky top-0 z-20 w-24 border-b border-r border-(--md-sys-color-outline-variant) py-2",
                                      STICKY_HEADER_BG,
                                    )}
                                  />
                                ))}
                              </tr>
                            </thead>
                            <tbody className="text-(--md-sys-color-on-surface)">
                              {rows.map((student, rowIndex) => (
                                <tr key={student.id}>
                                  <td
                                    className={cn(
                                      "sticky left-0 z-10 w-28 border-b border-r border-(--md-sys-color-outline-variant) px-3 py-0 text-center font-mono text-xs text-(--md-sys-color-on-surface-variant)",
                                      STICKY_BODY_BG,
                                    )}
                                  >
                                    {student.nim}
                                  </td>
                                  <td
                                    className={cn(
                                      "sticky left-28 z-10 w-48 whitespace-nowrap border-b border-r border-(--md-sys-color-outline-variant) px-3 py-0 font-medium",
                                      STICKY_BODY_BG,
                                    )}
                                  >
                                    {student.nama}
                                  </td>
                                  {item.parameter.map((param, colIndex) => {
                                    const raw = getInput(
                                      student.id,
                                      item.id,
                                      param.nama,
                                    );
                                    const invalid = isInvalidScore(raw);

                                    return (
                                      <td
                                        key={param.nama}
                                        className="border-b border-r border-(--md-sys-color-outline-variant) p-0"
                                      >
                                        <input
                                          type="number"
                                          min={0}
                                          max={100}
                                          step="0.5"
                                          data-row={rowIndex}
                                          data-col={colIndex}
                                          data-cell={`${rowIndex}-${colIndex}`}
                                          disabled={!canEdit}
                                          value={raw}
                                          onChange={(event) =>
                                            setInput(
                                              student.id,
                                              item.id,
                                              param.nama,
                                              event.target.value,
                                            )
                                          }
                                          onFocus={(event) =>
                                            event.currentTarget.select()
                                          }
                                          onKeyDown={(event) =>
                                            handleCellKeyDown(
                                              event,
                                              item.parameter.length,
                                            )
                                          }
                                          aria-label={`P${colIndex + 1} ${student.nama}`}
                                          className={cn(
                                            "sheet-cell h-9 w-full min-w-20 border-0 bg-transparent px-2 text-right font-mono text-sm tabular-nums text-(--md-sys-color-on-surface) outline-none transition-colors focus:bg-(--md-sys-color-surface-container-high) focus:ring-2 focus:ring-inset focus:ring-(--md-sys-color-primary) disabled:cursor-not-allowed disabled:opacity-60",
                                            invalid &&
                                              "bg-red-50 text-red-700 ring-1 ring-inset ring-red-400 dark:bg-red-950/30 dark:text-red-300",
                                          )}
                                        />
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-low) px-4 py-3">
                          {savedId === item.id && (
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              Tersimpan.
                            </span>
                          )}
                          <Button
                            variant="filled"
                            size="sm"
                            onClick={() => handleSave(item)}
                            disabled={!canEdit || savingId === item.id}
                          >
                            {!canEdit
                              ? "Hanya lihat"
                              : savingId === item.id
                                ? "Menyimpan..."
                                : "Simpan Nilai"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
