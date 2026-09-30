import React, { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = "secondary", size = "sm", isLoading, className = "", disabled, ...props }, ref) => {
    let baseStyles =
      "inline-flex items-center justify-center font-medium rounded-sm border transition-colors select-none focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed";

    let variantStyles = "bg-white text-slate-800 border-slate-200 hover:bg-slate-50";

    if (variant === "primary") {
      variantStyles = "bg-slate-900 text-white border-slate-900 hover:bg-slate-800 shadow-sm";
    } else if (variant === "outline") {
      variantStyles = "bg-transparent text-slate-700 border-slate-300 hover:bg-slate-50";
    } else if (variant === "danger") {
      variantStyles = "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100";
    } else if (variant === "ghost") {
      variantStyles = "bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900";
    }

    let sizeStyles = "px-2.5 py-1 text-xs";
    if (size === "md") sizeStyles = "px-3.5 py-1.5 text-xs";
    if (size === "lg") sizeStyles = "px-4 py-2 text-sm";

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
