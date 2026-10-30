import React from "react";
import { cn } from "@/utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, containerClassName, error, label, id, ...props }, ref) => {
    const generatedId = id || React.useId();

    return (
      <div className={cn("w-full space-y-1", containerClassName)}>
        {label && (
          <label
            htmlFor={generatedId}
            className="block text-xs font-semibold text-(--md-sys-color-on-surface)"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={generatedId}
          className={cn(
            "w-full rounded-(--md-sys-shape-corner-medium) border border-(--md-sys-color-outline) bg-(--md-sys-color-surface) px-3.5 py-2 text-sm text-(--md-sys-color-on-surface) transition-all focus:border-(--md-sys-color-primary) focus:outline-none focus:ring-1 focus:ring-(--md-sys-color-primary) disabled:opacity-50",
            error && "border-red-500 focus:ring-red-500",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
