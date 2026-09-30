import React from "react";

export type BadgeVariant = "HOT" | "WARM" | "COLD" | "attention" | "neutral";

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ variant, children, className = "", size = "sm" }: BadgeProps) {
  let styles = "bg-slate-100 text-slate-700 border-slate-200";

  if (variant === "HOT") {
    styles = "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold";
  } else if (variant === "WARM") {
    styles = "bg-amber-50 text-amber-800 border-amber-300 font-semibold";
  } else if (variant === "COLD") {
    styles = "bg-slate-100 text-slate-600 border-slate-200";
  } else if (variant === "attention") {
    styles = "bg-rose-50 text-rose-700 border-rose-200 font-medium";
  }

  const sizeStyles = size === "sm" ? "px-1.5 py-0.5 text-[11px] leading-tight" : "px-2 py-1 text-xs leading-normal";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border ${styles} ${sizeStyles} ${className}`}
    >
      {variant === "HOT" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
      {variant === "WARM" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
      {variant === "COLD" && <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />}
      {variant === "attention" && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />}
      {children}
    </span>
  );
}
