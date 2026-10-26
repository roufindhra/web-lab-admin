import React from "react";
import { cn } from "@/utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "outlined" | "text" | "fab";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "filled", size = "md", children, ...props }, ref) => {
    const variantClasses = {
      filled: "md-button-filled",
      outlined: "md-button-outlined",
      text: "md-button-text",
      fab: "md-fab px-4 py-3 flex items-center gap-2",
    };

    const sizeClasses = {
      sm: "px-3 py-1 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-2.5 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          variant !== "fab" && sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
