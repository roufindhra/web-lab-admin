import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  kurikulumService,
  praktikumService,
  ApiError,
  type KurikulumMateri,
  type Praktikum,
} from "@/services";
import MateriFormModal from "../components/modals/MateriFormModal";
import { Button } from "@/components/ui/Buttons";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const SEARCH_DEBOUNCE_MS = 400;

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;

  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const parts: ReactNode[] = [];
  let i = 0;

  while (i <= text.length) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark
        key={idx}
        className="rounded-sm bg-(--md-sys-color-tertiary-container) px-0.5 text-(--md-sys-color-on-tertiary-container)"
      >
        {text.slice(idx, idx + q.length)}
      </mark>,
    );
    i = idx + q.length;
  }

  return <>{parts}</>;
}

export default function KurikulumDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [praktikum, setPraktikum] = useState<Praktikum | null>(null);
  const [materiList, setMateriList] = useState<KurikulumMateri[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMateri, setEditingMateri] = useState<KurikulumMateri | null>(
    null,
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const refresh = useCallback(async () => {
    if (!slug) return;
    try {
      const data = await kurikulumService.getAll(
        slug,
        debouncedSearch || undefined,
      );
      setMateriList(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal memuat kurikulum.",
      );
    }
  }, [slug, debouncedSearch]);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      praktikumService.getBySlug(slug),
      kurikulumService.getAll(slug, debouncedSearch || undefined),
    ])
      .then(([praktikumData, materiData]) => {
        setPraktikum(praktikumData);
        setMateriList(materiData);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Gagal memuat data."),
      )
      .finally(() => setIsLoading(false));
  }, [slug, debouncedSearch]);

  const handleArsipkan = async (materi: KurikulumMateri) => {
    if (!slug) return;
    try {
      await kurikulumService.destroy(slug, materi.id);
      await refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal mengarsipkan materi.",
      );
    }
  };

  const handlePulihkan = async (materi: KurikulumMateri) => {
    if (!slug) return;
    try {
      await kurikulumService.restore(slug, materi.id);
      await refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal memulihkan materi.",
      );
    }
  };

  const materiAktif = materiList.filter((m) => m.is_active);
  const materiArsip = materiList.filter((m) => !m.is_active);
  const searching = debouncedSearch.length > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || !slug) return;

    const oldIndex = materiAktif.findIndex((m) => m.id === active.id);
    const newIndex = materiAktif.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const ordered = arrayMove(materiAktif, oldIndex, newIndex).map((m, i) => ({
      ...m,
      materi_id: i + 1,
    }));
    const arsip = materiList.filter((m) => !m.is_active);
    setMateriList([...ordered, ...arsip]);

    try {
      await kurikulumService.reorder(
        slug,
        ordered.map((m) => m.id),
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Gagal memperbarui urutan.",
      );
      await refresh();
    }
  };

  if (isLoading) {
    return (
      <div className="text-sm text-(--md-sys-color-on-surface-variant)">
        Memuat...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-(--md-sys-color-on-surface)">
            {praktikum?.label ?? "Kurikulum"}
          </h1>
          <p className="mt-1 text-sm text-(--md-sys-color-on-surface-variant)">
            Susunan materi yang akan diajarkan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama atau isi materi..."
            containerClassName="w-64"
          />
          <Button
            variant="filled"
            onClick={() => {
              setEditingMateri(null);
              setModalOpen(true);
            }}
          >
            + Tambah Materi
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-(--md-sys-color-on-surface-variant)">
          Materi Aktif ({materiAktif.length})
        </h2>
        <Card variant="outlined" className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface-container-low) text-xs uppercase text-(--md-sys-color-on-surface-variant)">
              <tr>
                <th className="px-4 py-3">No.</th>
                <th className="px-4 py-3">Materi</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--md-sys-color-outline-variant) text-(--md-sys-color-on-surface)">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => void handleDragEnd(event)}
              >
                <SortableContext
                  items={materiAktif.map((m) => m.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {materiAktif.map((materi) => (
                    <SortableMateriRow
                      key={materi.id}
                      materi={materi}
                      query={searching ? debouncedSearch : ""}
                      sortable={!searching}
                      onEdit={() => {
                        setEditingMateri(materi);
                        setModalOpen(true);
                      }}
                      onArsipkan={() => void handleArsipkan(materi)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              {materiAktif.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-(--md-sys-color-on-surface-variant)"
                  >
                    {debouncedSearch
                      ? "Tidak ada materi yang cocok dengan pencarian."
                      : 'Belum ada materi. Klik "Tambah Materi" untuk menyusun kurikulum.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {materiArsip.length > 0 && (
        <div className="space-y-2 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-(--md-sys-color-on-surface-variant)">
            Arsip ({materiArsip.length})
          </h2>
          <Card variant="outlined" className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-(--md-sys-color-outline-variant) text-(--md-sys-color-on-surface)">
                {materiArsip.map((materi) => (
                  <tr
                    key={materi.id}
                    className="bg-(--md-sys-color-surface-container-low)/50 hover:bg-(--md-sys-color-surface-container-high) transition-colors"
                  >
                    <td className="px-4 py-3 text-(--md-sys-color-on-surface-variant) opacity-60">
                      {materi.materi_id}
                    </td>
                    <td className="px-4 py-3 text-(--md-sys-color-on-surface-variant) line-through">
                      {materi.materi_nama}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => void handlePulihkan(materi)}
                        className="hover:underline px-2 py-1"
                      >
                        Pulihkan
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {modalOpen && slug && (
        <MateriFormModal
          slug={slug}
          materi={editingMateri}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            void refresh();
          }}
        />
      )}
    </div>
  );
}

interface SortableMateriRowProps {
  materi: KurikulumMateri;
  query: string;
  sortable: boolean;
  onEdit: () => void;
  onArsipkan: () => void;
}

function SortableMateriRow({
  materi,
  query,
  sortable,
  onEdit,
  onArsipkan,
}: SortableMateriRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: materi.id, disabled: !sortable });

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`hover:bg-(--md-sys-color-surface-container-high) transition-colors ${
        isDragging ? "relative z-10 shadow-lg bg-(--md-sys-color-surface-container-high)" : ""
      }`}
    >
      <td className="px-4 py-3 text-(--md-sys-color-on-surface-variant)">
        <span
          {...(sortable ? attributes : {})}
          {...(sortable ? listeners : {})}
          className={
            sortable
              ? "inline-flex cursor-grab touch-none items-center gap-1.5 select-none active:cursor-grabbing"
              : "inline-block"
          }
          title={sortable ? "Tarik untuk mengubah urutan" : undefined}
        >
          {sortable && (
            <span
              aria-hidden
              className="text-xs leading-none text-(--md-sys-color-outline)"
            >
              ⠿
            </span>
          )}
          {materi.materi_id}
        </span>
      </td>
      <td className="px-4 py-3 font-medium">
        <Highlight text={materi.materi_nama} query={query} />
        {query && materi.snippet && (
          <p className="mt-1 text-xs font-normal text-(--md-sys-color-on-surface-variant)">
            <Highlight text={materi.snippet} query={query} />
          </p>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="text"
            size="sm"
            onClick={onEdit}
            className="hover:underline px-2 py-1"
          >
            Edit
          </Button>
          <Button
            variant="text"
            size="sm"
            onClick={onArsipkan}
            className="text-red-600 dark:text-red-400 hover:underline px-2 py-1"
          >
            Arsipkan
          </Button>
        </div>
      </td>
    </tr>
  );
}
