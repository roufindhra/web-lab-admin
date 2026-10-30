import React from "react";
import { cn } from "@/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "outlined" | "filled" | "elevated";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "outlined", children, ...props }, ref) => {
    const variantClasses: Record<NonNullable<CardProps["variant"]>, string> = {
      outlined: "md-card-outlined",
      filled: "md-card-filled",
      elevated: "md-card-elevated",
    };

    return (
      <div
        ref={ref}
        className={cn("p-5", variantClasses[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";