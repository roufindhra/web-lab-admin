import { useState } from "react";
import { toggleSortSpec, type SortSpec } from "@/utils/tableSort";

export function useTableSort(defaultSort: SortSpec, onChange?: () => void) {
  const [sorts, setSorts] = useState<SortSpec[]>([defaultSort]);

  const toggleSort = (column: string, additive = false) => {
    setSorts((current) => toggleSortSpec(current, column, additive));
    onChange?.();
  };

  const removeSort = (column: string) => {
    setSorts((current) => {
      if (current.length <= 1) return current;
      return current.filter((sort) => sort.column !== column);
    });
    onChange?.();
  };

  const resetSort = () => {
    setSorts([defaultSort]);
    onChange?.();
  };

  return { sorts, toggleSort, removeSort, resetSort };
}
