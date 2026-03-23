import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link" | "brand"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-brand)] disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[var(--color-border)] text-white hover:bg-[var(--color-surface-hover)]": variant === "default",
            "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)] shadow-sm": variant === "brand",
            "border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-surface-hover)]": variant === "outline",
            "hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-white": variant === "ghost",
            "text-[var(--color-brand)] underline-offset-4 hover:underline": variant === "link",
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-10 rounded-md px-8": size === "lg",
            "h-9 w-9": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
