import { useState, useEffect } from 'react'

const defaultColors: Record<string, string> = {
  "Avatar": "#3b82f6", // blue
  "B-Roll": "#a855f7", // purple
  "Validado": "#22c55e", // green
  "Diabetes": "#eab308", // yellow/orange
  "Neuropatia": "#ec4899", // pink
  "Standard": "#64748b", // slate
  "Premium": "#f59e0b",  // amber
  "Dr. Oz": "#0284c7",   // sky blue
  "Dr. Phil": "#6366f1", // indigo
  "Dr. Gundry": "#0ea5e9", // cyan
  "Ben Bikman": "#14b8a6", // teal
  "Mel": "#f59e0b",      // honey gold
  "Honey Tweak": "#d97706", // dark amber
  "Favo de Mel": "#b45309", // warm amber
  "Gelatina": "#ec4899", // pink
  "Sal Rosa": "#fb7185", // rose
  "CNN": "#ef4444",      // red
  "Avatar Feminino": "#8b5cf6", // violet
  "Receita Caseira": "#10b981", // emerald
  "Medidor de Glicose": "#06b6d4", // light cyan
  "Remédio Natural": "#84cc16" // lime
}

export function useTagColors() {
  const [colors, setColors] = useState<Record<string, string>>(defaultColors)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('drvault_tagColors')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setColors({ ...defaultColors, ...parsed })
      } catch (e) {
        console.error("Failed to parse colors")
        setColors(defaultColors)
      }
    } else {
      setColors(defaultColors)
    }
    setIsLoaded(true)
  }, [])

  const updateColor = (tagName: string, hexColor: string) => {
    const newColors = { ...colors, [tagName]: hexColor }
    setColors(newColors)
    localStorage.setItem('drvault_tagColors', JSON.stringify(newColors))
  }

  return { colors, updateColor, isLoaded }
}

