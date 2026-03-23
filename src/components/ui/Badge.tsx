import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive" | "success"
  colorHex?: string
}

export function Badge({ className, variant = "default", colorHex, style, ...props }: BadgeProps) {
  const dynamicStyle = colorHex ? {
    backgroundColor: `${colorHex}1a`, // 10% opacity for bg
    color: colorHex,
    borderColor: `${colorHex}40`, // 25% opacity for border
    borderWidth: 1,
    borderStyle: 'solid'
  } : {}

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-[var(--color-surface-hover)] text-[var(--color-text)]": variant === "default",
          "border-transparent bg-[var(--color-brand)]/20 text-[var(--color-brand)]": variant === "success",
          "text-[var(--color-text)] border-[var(--color-border)]": variant === "outline",
          "border-transparent bg-[var(--color-border)] text-[var(--color-text)]": variant === "secondary",
          "border-transparent bg-[var(--color-destructive)]/20 text-[var(--color-destructive)]": variant === "destructive",
        },
        className
      )}
      style={{ ...dynamicStyle, ...style }}
      {...props}
    />
  )
}
