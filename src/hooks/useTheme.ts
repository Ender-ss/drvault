import { useState, useEffect } from "react"

export type Theme = "dark" | "light"

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("drvault_theme") as Theme) || "dark"
  })

  useEffect(() => {
    localStorage.setItem("drvault_theme", theme)
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light")
    } else {
      document.documentElement.removeAttribute("data-theme")
    }
  }, [theme])

  return { theme, setTheme }
}
