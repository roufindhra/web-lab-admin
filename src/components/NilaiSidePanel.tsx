import { useEffect, useState } from "react";
import {
  praktikumService,
  ApiError,
  type AssignMahasiswa,
  type Pertemuan,
} from "@/services";
import { Button } from "@/components/ui/Buttons";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface PraktikumInfo {
  id: number;
  slug: string;
  label: string;
}

// mahasiswaId -> pertemuanId -> nama parameter -> nilai mentah (string agar enak diketik)
type NilaiState = Record<string, Record<string, Record<string, string>>>;

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
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

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
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Gagal memuat data nilai.",
          );
        }
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
    setError(null);

    praktikumService
      .saveNilaiPlug(praktikum.slug, plug, item.id, payload)
      .then(() => {
        setSavedId(item.id);
        onSaved();
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Gagal menyimpan nilai.",
        );
      })
      .finally(() => setSavingId(null));
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
              {pertemuan.map((item) => (
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
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.parameter.map((p) => (
                          <span
                            key={p.nama}
                            className="rounded-full bg-(--md-sys-color-surface-container) px-2 py-0.5 text-[11px] text-(--md-sys-color-on-surface-variant)"
                          >
                            {p.nama} {p.bobot}%
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-(--md-sys-color-on-surface-variant)">
                      {expandedId === item.id ? "▾" : "▸"}
                    </span>
                  </button>

                  {expandedId === item.id && (
                    <div className="border-t border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface)">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="border-b border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-low) text-xs uppercase text-(--md-sys-color-on-surface-variant)">
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
                          <tbody className="divide-y divide-(--md-sys-color-outline-variant) text-(--md-sys-color-on-surface)">
                            {students.map((student) => (
                              <tr
                                key={student.id}
                                className="hover:bg-(--md-sys-color-surface-container-high) transition-colors"
                              >
                                <td className="px-4 py-2 font-mono text-xs text-(--md-sys-color-on-surface-variant)">
                                  {student.nim}
                                </td>
                                <td className="whitespace-nowrap px-4 py-2 font-medium">
                                  {student.nama}
                                </td>
                                {item.parameter.map((p) => (
                                  <td key={p.nama} className="px-4 py-2">
                                    <Input
                                      type="number"
                                      min={0}
                                      max={100}
                                      step="0.5"
                                      disabled={!canEdit}
                                      value={getInput(
                                        student.id,
                                        item.id,
                                        p.nama,
                                      )}
                                      onChange={(event) =>
                                        setInput(
                                          student.id,
                                          item.id,
                                          p.nama,
                                          event.target.value,
                                        )
                                      }
                                      containerClassName="w-24"
                                    />
                                  </td>
                                ))}
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
              ))}
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
