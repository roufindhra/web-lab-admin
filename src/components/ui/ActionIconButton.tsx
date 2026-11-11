import React from "react";
import { cn } from "@/utils/cn";

interface ActionIconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Karakter unicode yang ditampilkan sebagai ikon aksi. */
  symbol: string;
  /** Dipakai sebagai tooltip dan aria-label. */
  label: string;
  tone?: "default" | "danger";
}

export const ActionIconButton = React.forwardRef<
  HTMLButtonElement,
  ActionIconButtonProps
>(
  (
    {
      symbol,
      label,
      tone = "default",
      className,
      type = "button",
      title,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      {...props}
      type={type}
      title={title ?? label}
      aria-label={label}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-base leading-none transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
        tone === "danger"
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          : "text-(--md-sys-color-on-surface) hover:bg-(--md-sys-color-surface-container-high)",
        className,
      )}
    >
      {symbol}
    </button>
  ),
);

ActionIconButton.displayName = "ActionIconButton";
