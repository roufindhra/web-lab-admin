import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  praktikumService,
  type AssignMahasiswa,
} from "@/services";
import { getFormErrorMessages } from "@/utils/errors";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Buttons";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";

const UNASSIGNED = "";
const UNASSIGNED_LABEL = "Belum berkelompok";

type Sections = Record<string, AssignMahasiswa[]>;

const compareNim = (a: AssignMahasiswa, b: AssignMahasiswa) =>
  String(a.nim).localeCompare(String(b.nim), "id", { numeric: true });

const parseLabels = (value: string): string[] =>
  Array.from(
    new Set(
      value
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b, "id", { numeric: true }));

/**
 * Rebuild section map from a fresh label list. Students whose group is no
 * longer listed are preserved under "Belum berkelompok" instead of removed.
 */
function rebuildSections(current: Sections, labels: string[]): Sections {
  const next: Sections = { [UNASSIGNED]: [...(current[UNASSIGNED] ?? [])] };

  for (const label of labels) {
    next[label] = next[label] ?? [];
  }

  for (const [key, list] of Object.entries(current)) {
    if (key === UNASSIGNED) continue;

    if (next[key]) {
      next[key] = list;
    } else {
      next[UNASSIGNED].push(...list);
    }
  }

  next[UNASSIGNED].sort(compareNim);

  return next;
}

function SortableStudentCard({
  student,
  container,
}: {
  student: AssignMahasiswa;
  container: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `student:${student.id}`,
    data: { container },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      className={cn(
        "flex cursor-grab touch-none items-center justify-between gap-2 rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface) px-3 py-1.5 text-sm active:cursor-grabbing",
        isDragging && "z-10 opacity-70 shadow-lg",
      )}
    >
      <span className="min-w-0">
        <span className="mr-2 font-mono text-xs text-(--md-sys-color-on-surface-variant)">
          {student.nim}
        </span>
        <span className="truncate font-medium">{student.nama}</span>
      </span>
      <span
        className="shrink-0 text-xs text-(--md-sys-color-on-surface-variant) opacity-60"
        aria-hidden="true"
      >
        ⋮⋮
      </span>
    </div>
  );
}

function GroupSection({
  label,
  title,
  students,
}: {
  label: string;
  title: string;
  students: AssignMahasiswa[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `container:${label}`,
    data: { container: label },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-low) p-2",
        isOver && "border-(--md-sys-color-primary) bg-(--md-sys-color-surface-container-high)",
      )}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-(--md-sys-color-on-surface)">
          {title}
        </span>
        <span className="text-[11px] text-(--md-sys-color-on-surface-variant)">
          {students.length}
        </span>
      </div>

      <SortableContext
        items={students.map((student) => `student:${student.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="min-h-14 space-y-1.5">
          {students.map((student) => (
            <SortableStudentCard
              key={student.id}
              student={student}
              container={label}
            />
          ))}

          {students.length === 0 && (
            <p className="px-2 py-4 text-center text-[11px] text-(--md-sys-color-on-surface-variant) opacity-70">
              Tarik mahasiswa ke sini.
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function KelompokModal({
  slug,
  label,
  plug,
  onClose,
  onSaved,
}: {
  slug: string;
  label: string;
  plug: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [sections, setSections] = useState<Sections>({});
  const [groupInput, setGroupInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    let cancelled = false;

    praktikumService
      .listMahasiswa(slug, plug, true)
      .then((students) => {
        if (cancelled) return;

        const labels = Array.from(
          new Set(
            students
              .map((student) => (student.kelompok ?? "").trim())
              .filter(Boolean),
          ),
        ).sort((a, b) => a.localeCompare(b, "id", { numeric: true }));

        const next: Sections = { [UNASSIGNED]: [] };
        for (const group of labels) next[group] = [];

        for (const student of students) {
          const group = (student.kelompok ?? "").trim();
          (next[group || UNASSIGNED] ??= []).push(student);
        }

        for (const key of Object.keys(next)) next[key].sort(compareNim);

        setSections(next);
        setGroupInput(labels.join(", "));
      })
      .catch((err) => {
        const messages = getFormErrorMessages(err);
        setError(
          messages.length > 0 ? messages.join(" ") : "Gagal memuat mahasiswa.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, plug]);

  const groupKeys = useMemo(
    () =>
      Object.keys(sections)
        .filter((key) => key !== UNASSIGNED)
        .sort((a, b) => a.localeCompare(b, "id", { numeric: true })),
    [sections],
  );

  const applyGroups = () => {
    const labels = parseLabels(groupInput);

    if (labels.some((group) => group.length > 50)) {
      setError("Nama kelompok maksimal 50 karakter.");
      return;
    }

    setSections((current) => rebuildSections(current, labels));
    setGroupInput(labels.join(", "));
    setError(null);
  };

  const findGroupByStudent = (studentId: number): string | undefined => {
    for (const [group, list] of Object.entries(sections)) {
      if (list.some((student) => student.id === studentId)) return group;
    }

    return undefined;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    if (!activeId.startsWith("student:")) return;

    const activeStudentId = Number(activeId.slice("student:".length));
    const overIsContainer = String(over.id).startsWith("container:");
    const activeGroup = findGroupByStudent(activeStudentId);
    const overStudentId = overIsContainer
      ? null
      : Number(String(over.id).slice("student:".length));
    const overGroup = overIsContainer
      ? String(over.id).slice("container:".length)
      : overStudentId === null
        ? undefined
        : findGroupByStudent(overStudentId);

    if (
      activeGroup === undefined ||
      overGroup === undefined ||
      activeGroup === overGroup
    ) {
      return;
    }

    setSections((current) => {
      const source = current[activeGroup] ?? [];
      const student = source.find((item) => item.id === activeStudentId);
      if (!student) return current;

      const sourceNext = source.filter((item) => item.id !== activeStudentId);
      const target = [...(current[overGroup] ?? [])];
      let insertIndex = target.length;

      if (overStudentId !== null) {
        const index = target.findIndex((item) => item.id === overStudentId);
        if (index >= 0) insertIndex = index;
      }

      target.splice(insertIndex, 0, student);

      return {
        ...current,
        [activeGroup]: sourceNext,
        [overGroup]: target,
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    if (!activeId.startsWith("student:")) return;

    const activeStudentId = Number(activeId.slice("student:".length));
    const overIsContainer = String(over.id).startsWith("container:");
    const activeGroup = findGroupByStudent(activeStudentId);
    const overStudentId = overIsContainer
      ? null
      : Number(String(over.id).slice("student:".length));
    const overGroup = overIsContainer
      ? String(over.id).slice("container:".length)
      : overStudentId === null
        ? undefined
        : findGroupByStudent(overStudentId);

    if (
      activeGroup === undefined ||
      overGroup === undefined ||
      activeGroup !== overGroup
    ) {
      return;
    }

    setSections((current) => {
      const list = current[activeGroup] ?? [];
      const oldIndex = list.findIndex(
        (student) => student.id === activeStudentId,
      );
      const newIndex =
        overStudentId === null
          ? list.length - 1
          : list.findIndex((student) => student.id === overStudentId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        return current;
      }

      return {
        ...current,
        [activeGroup]: arrayMove(list, oldIndex, newIndex),
      };
    });
  };

  const handleSave = () => {
    const labels = parseLabels(groupInput);

    if (labels.some((group) => group.length > 50)) {
      setError("Nama kelompok maksimal 50 karakter.");
      return;
    }

    const next = rebuildSections(sections, labels);
    setSections(next);
    const payload: Record<string, string | null> = {};

    for (const [group, list] of Object.entries(next)) {
      for (const student of list) {
        payload[String(student.id)] = group === UNASSIGNED ? null : group;
      }
    }

    setIsSaving(true);
    setError(null);

    praktikumService
      .syncKelompok(slug, plug, payload)
      .then(() => {
        onSaved();
        onClose();
      })
      .catch((err) => {
        const messages = getFormErrorMessages(err);
        setError(
          messages.length > 0 ? messages.join(" ") : "Gagal menyimpan kelompok.",
        );
      })
      .finally(() => setIsSaving(false));
  };

  return (
    <Dialog
      isOpen
      onClose={onClose}
      title="Pengaturan Kelompok"
      className="max-w-3xl"
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-(--md-sys-color-on-surface-variant)">
            {label} &middot; {plug}
          </p>
          <p className="mt-1 text-xs text-(--md-sys-color-on-surface-variant)">
            Masukkan nomor kelompok dipisahkan koma, misalnya{" "}
            <span className="font-mono">4, 5, 6</span>. Tarik mahasiswa ke
            kelompok yang sesuai, lalu simpan.
          </p>
        </div>

        <div className="flex items-end gap-2">
          <Input
            label="Kelompok"
            value={groupInput}
            onChange={(event) => setGroupInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyGroups();
              }
            }}
            placeholder="mis. 4, 5, 6"
            containerClassName="flex-1"
          />
          <Button
            variant="outlined"
            size="sm"
            type="button"
            onClick={applyGroups}
            disabled={isLoading || isSaving}
          >
            Terapkan
          </Button>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        {isLoading ? (
          <p className="py-10 text-center text-xs text-(--md-sys-color-on-surface-variant)">
            Memuat mahasiswa...
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            collisionDetection={closestCorners}
          >
            <div className="grid gap-3 md:grid-cols-2">
              {groupKeys.map((group) => (
                <GroupSection
                  key={group}
                  label={group}
                  title={`Kelompok ${group}`}
                  students={sections[group] ?? []}
                />
              ))}

              <GroupSection
                label={UNASSIGNED}
                title={UNASSIGNED_LABEL}
                students={sections[UNASSIGNED] ?? []}
              />
            </div>
          </DndContext>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-(--md-sys-color-outline-variant) pt-3">
          <span className="text-xs text-(--md-sys-color-on-surface-variant)">
            {Object.values(sections).reduce(
              (total, list) => total + list.length,
              0,
            )}{" "}
            mahasiswa
          </span>
          <div className="flex gap-2">
            <Button variant="outlined" onClick={onClose} disabled={isSaving}>
              Batal
            </Button>
            <Button
              variant="filled"
              onClick={handleSave}
              disabled={isLoading || isSaving}
            >
              {isSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
