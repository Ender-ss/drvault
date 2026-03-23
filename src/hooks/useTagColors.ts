import { useState, useEffect } from 'react'

export function useTagColors() {
  const [colors, setColors] = useState<Record<string, string>>({})
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('drvault_tagColors')
    if (stored) {
      try {
        setColors(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to parse colors")
      }
    } else {
      // Defaults
      setColors({
        "Avatar": "#3b82f6", // blue
        "B-Roll": "#a855f7", // purple
        "Validado": "#22c55e", // green
        "Diabetes": "#eab308", // yellow/orange
        "Neuropatia": "#ec4899", // pink
        "Standard": "#64748b", // slate
        "Premium": "#f59e0b"   // amber
      })
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
