import { useState, useEffect } from "react"

export type LayoutMode = "tabs" | "split"

export function useLayout() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    return (localStorage.getItem("drvault_layout_mode") as LayoutMode) || "tabs"
  })

  useEffect(() => {
    localStorage.setItem("drvault_layout_mode", layoutMode)
  }, [layoutMode])

  return { layoutMode, setLayoutMode }
}
